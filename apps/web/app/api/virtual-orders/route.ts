import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

/** Trạng thái lệnh ảo: PLANNED (chưa chạm entry), OPEN (đã khớp), CLOSED (TP/SL/expire), EXPIRED (hết hạn chưa khớp) */
export type VirtualOrderState = 'PLANNED' | 'OPEN' | 'CLOSED' | 'EXPIRED';

/** Lệnh ảo: tạo từ setup, tự fill theo entry và đóng theo TP/SL */
export interface VirtualOrder {
  id: string;
  symbol: string;
  tf: string;
  side: 'BUY' | 'SELL';
  state: VirtualOrderState;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  entry_zone_low: number;
  entry_zone_high: number;
  entry_fill_price: number | null;
  stop_loss: number;
  targets: number[];
  rr_expected: number;
  engine_version: string;
  preset_id: string | null;
  preset_version?: string;
  params_resolved: Record<string, unknown>;
  snapshot_id: string;
  setup_ref: string;
  setup_name: string;
  close_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  notes: string | null;
  dedupe_key: string;
  valid_until_candle_t: number;
}

const FILENAME = 'virtual-orders.json';
const TICK_BUCKET: Record<string, number> = { BTCUSDT: 0.01, ETHUSDT: 0.01 };
const TF_MS: Record<string, number> = {
  M1: 60_000, M3: 180_000, M5: 300_000, M15: 900_000, M30: 1_800_000,
  H1: 3_600_000, H2: 7_200_000, H4: 14_400_000, H6: 21_600_000, H12: 43_200_000, D1: 86_400_000, W1: 604_800_000,
};
const DEFAULT_MIN_CONFIDENCE = 70;
const DEFAULT_MIN_RR = 2.0;
const DEFAULT_MIN_CONFLUENCE_COUNT = 2;
const DEFAULT_VALID_UNTIL_CANDLES = 12;

let memoryStore: VirtualOrder[] = [];

async function getDataPath(): Promise<string> {
  const dir = join(process.cwd(), 'data');
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
  return join(dir, FILENAME);
}

async function loadOrders(): Promise<VirtualOrder[]> {
  try {
    const path = await getDataPath();
    const raw = await readFile(path, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return memoryStore.length ? memoryStore : [];
  }
}

async function saveOrders(orders: VirtualOrder[]): Promise<void> {
  memoryStore = orders;
  try {
    const path = await getDataPath();
    await writeFile(path, JSON.stringify({ orders, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('virtual-orders: could not write file', e);
  }
}

function generateId(): string {
  return `vo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function buildDedupeKey(symbol: string, tf: string, side: string, entryMid: number): string {
  const tick = TICK_BUCKET[symbol] ?? 0.01;
  const bucketed = Math.round(entryMid / tick) * tick;
  return `${symbol}|${tf}|${side}|${bucketed}`;
}

function canCreateFromSetup(
  setup: { status?: string; confidence?: number; risk?: { rrMin?: number }; reasons?: string[]; confluence?: unknown },
  minConfidence: number,
  minRR: number,
  minConfluenceCount: number
): { ok: boolean; reason?: string } {
  const status = setup.status ?? '';
  if (!['valid', 'wait'].includes(status)) {
    return { ok: false, reason: `setup.status phải valid hoặc wait (hiện: ${status})` };
  }
  const conf = Number(setup.confidence) ?? 0;
  if (conf < minConfidence) {
    return { ok: false, reason: `confidence ${conf} < ${minConfidence}` };
  }
  const rr = Number(setup.risk?.rrMin) ?? 0;
  if (rr < minRR) {
    return { ok: false, reason: `rrMin ${rr} < ${minRR}` };
  }
  const count = Array.isArray(setup.reasons) ? setup.reasons.length : 0;
  if (count < minConfluenceCount) {
    return { ok: false, reason: `số lý do/confluence ${count} < ${minConfluenceCount}` };
  }
  return { ok: true };
}

/** GET: danh sách lệnh ảo, query ?state=PLANNED|OPEN|CLOSED|EXPIRED */
export async function GET(request: NextRequest) {
  try {
    const orders = await loadOrders();
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const filtered = state
      ? orders.filter((o) => o.state === state)
      : orders;
    return NextResponse.json({ orders: filtered });
  } catch (e: any) {
    console.error('virtual-orders GET', e);
    return NextResponse.json({ error: e.message, orders: [] }, { status: 500 });
  }
}

/** POST: tạo lệnh ảo từ 1 setup (đạt điều kiện + dedupe) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol = 'BTCUSDT',
      timeframe = 'M15',
      preset_id = null,
      preset_version,
      params_resolved = {},
      engine_version = 'smc.v1.0.0',
      snapshot_id,
      setup,
      minConfidence = DEFAULT_MIN_CONFIDENCE,
      minRR = DEFAULT_MIN_RR,
      minConfluenceCount = DEFAULT_MIN_CONFLUENCE_COUNT,
      validUntilCandles = DEFAULT_VALID_UNTIL_CANDLES,
    } = body;

    if (!setup || !setup.entry?.zone || setup.risk?.stopLoss == null) {
      return NextResponse.json({ error: 'Thiếu setup hoặc setup.entry.zone / setup.risk' }, { status: 400 });
    }

    const check = canCreateFromSetup(setup, minConfidence, minRR, minConfluenceCount);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    const zone = setup.entry.zone;
    const low = Number(zone.low);
    const high = Number(zone.high);
    const mid = (low + high) / 2;
    const side = setup.direction === 'BUY' ? 'BUY' : 'SELL';
    const dedupeKey = buildDedupeKey(symbol, timeframe, side, mid);

    const orders = await loadOrders();
    const active = orders.filter((o) => ['PLANNED', 'OPEN'].includes(o.state) && o.dedupe_key === dedupeKey);
    if (active.length > 0) {
      return NextResponse.json({ error: 'Đã tồn tại lệnh trùng vùng (dedupe)' }, { status: 409 });
    }

    const candleMs = TF_MS[timeframe] ?? 900_000;
    const created_at = new Date().toISOString();
    const createdTs = Date.now();
    const valid_until_candle_t = createdTs + validUntilCandles * candleMs;

    const targets: number[] = (setup.targets ?? []).map((t: { price?: number }) => Number(t.price)).filter((p: number) => !Number.isNaN(p));

    const order: VirtualOrder = {
      id: generateId(),
      symbol: String(symbol),
      tf: String(timeframe),
      side,
      state: 'PLANNED',
      created_at,
      opened_at: null,
      closed_at: null,
      entry_zone_low: low,
      entry_zone_high: high,
      entry_fill_price: null,
      stop_loss: Number(setup.risk.stopLoss),
      targets,
      rr_expected: Number(setup.risk.rrMin) ?? 2,
      engine_version: String(engine_version),
      preset_id: preset_id ?? null,
      preset_version: preset_version ?? undefined,
      params_resolved: typeof params_resolved === 'object' ? params_resolved : {},
      snapshot_id: snapshot_id ?? `snap_${createdTs}`,
      setup_ref: setup.id ?? `setup-${createdTs}`,
      setup_name: setup.name ?? 'Setup',
      close_reason: null,
      pnl: null,
      pnl_pct: null,
      notes: null,
      dedupe_key: dedupeKey,
      valid_until_candle_t,
    };

    orders.unshift(order);
    await saveOrders(orders);
    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    console.error('virtual-orders POST', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH: cập nhật (vd. đóng tay MANUAL) */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json().catch(() => ({}));

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const orders = await loadOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const o = orders[idx];

    if (body.state === 'CLOSED' && ['PLANNED', 'OPEN'].includes(o.state)) {
      orders[idx] = {
        ...o,
        state: 'CLOSED',
        closed_at: now,
        close_reason: body.close_reason ?? 'MANUAL',
        pnl: body.pnl ?? null,
        pnl_pct: body.pnl_pct ?? null,
        notes: body.notes ?? o.notes,
      };
    } else if (body.notes !== undefined) {
      orders[idx] = { ...o, notes: body.notes };
    } else {
      return NextResponse.json({ error: 'Invalid PATCH body' }, { status: 400 });
    }

    await saveOrders(orders);
    return NextResponse.json({ ok: true, order: orders[idx] });
  } catch (e: any) {
    console.error('virtual-orders PATCH', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE: xóa log lệnh ảo */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const orders = await loadOrders();
    const filtered = orders.filter((o) => o.id !== id);
    if (filtered.length === orders.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    await saveOrders(filtered);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('virtual-orders DELETE', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
