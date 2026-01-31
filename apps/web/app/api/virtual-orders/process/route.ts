import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

/** Candle: t (ms), o, h, l, c */
interface CandleBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface VirtualOrder {
  id: string;
  symbol: string;
  tf: string;
  side: 'BUY' | 'SELL';
  state: string;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  entry_zone_low: number;
  entry_zone_high: number;
  entry_fill_price: number | null;
  stop_loss: number;
  targets: number[];
  valid_until_candle_t: number;
  setup_name: string;
  close_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  [k: string]: unknown;
}

const FILENAME = 'virtual-orders.json';

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
    return [];
  }
}

async function saveOrders(orders: VirtualOrder[]): Promise<void> {
  try {
    const path = await getDataPath();
    await writeFile(path, JSON.stringify({ orders, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('virtual-orders process: could not write', e);
  }
}

/** Paper fill: conservative = zone mid */
function fillPrice(zoneLow: number, zoneHigh: number, _side: string): number {
  return (zoneLow + zoneHigh) / 2;
}

/** PLANNED: kiểm tra entry zone chạm (candle close confirm) */
function isEntryTouched(order: VirtualOrder, candle: CandleBar): boolean {
  const { side, entry_zone_low, entry_zone_high } = order;
  if (side === 'BUY') {
    return candle.l <= entry_zone_high;
  }
  return candle.h >= entry_zone_low;
}

/** OPEN: worst_case - SL trước, rồi TP */
function checkClose(order: VirtualOrder, candle: CandleBar): { reason: string; pnl: number; pnl_pct: number } | null {
  const { side, stop_loss, targets, entry_fill_price } = order;
  const fill = entry_fill_price ?? (order.entry_zone_low + order.entry_zone_high) / 2;
  const tp1 = targets[0];

  if (side === 'BUY') {
    if (candle.l <= stop_loss) {
      const pnl = stop_loss - fill;
      const pnl_pct = (pnl / fill) * 100;
      return { reason: 'SL', pnl, pnl_pct };
    }
    if (tp1 != null && candle.h >= tp1) {
      const pnl = tp1 - fill;
      const pnl_pct = (pnl / fill) * 100;
      return { reason: 'TP1', pnl, pnl_pct };
    }
  } else {
    if (candle.h >= stop_loss) {
      const pnl = fill - stop_loss;
      const pnl_pct = (pnl / fill) * 100;
      return { reason: 'SL', pnl, pnl_pct };
    }
    if (tp1 != null && candle.l <= tp1) {
      const pnl = fill - tp1;
      const pnl_pct = (pnl / fill) * 100;
      return { reason: 'TP1', pnl, pnl_pct };
    }
  }
  return null;
}

/** POST: xử lý 1 nến đóng — fill PLANNED, expire PLANNED, đóng OPEN (TP/SL worst_case) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { closedCandle, symbol = 'BTCUSDT', timeframe = 'M15' } = body;

    if (!closedCandle || typeof closedCandle.t !== 'number' || typeof closedCandle.l !== 'number' || typeof closedCandle.h !== 'number') {
      return NextResponse.json({ error: 'Thiếu closedCandle (t, o, h, l, c)' }, { status: 400 });
    }

    const candle: CandleBar = {
      t: closedCandle.t,
      o: closedCandle.o ?? closedCandle.c,
      h: closedCandle.h,
      l: closedCandle.l,
      c: closedCandle.c ?? closedCandle.l,
    };

    const orders = await loadOrders();
    const now = new Date().toISOString();
    let changed = 0;

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (o.symbol !== symbol || o.tf !== timeframe) continue;

      if (o.state === 'PLANNED') {
        if (candle.t >= o.valid_until_candle_t) {
          orders[i] = { ...o, state: 'EXPIRED', closed_at: now, close_reason: 'EXPIRED', pnl: null, pnl_pct: null };
          changed++;
          continue;
        }
        if (isEntryTouched(o as VirtualOrder, candle)) {
          const fill = fillPrice(o.entry_zone_low, o.entry_zone_high, o.side);
          orders[i] = {
            ...o,
            state: 'OPEN',
            opened_at: now,
            entry_fill_price: fill,
          };
          changed++;
          continue;
        }
      }

      if (o.state === 'OPEN') {
        const result = checkClose(o as VirtualOrder, candle);
        if (result) {
          orders[i] = {
            ...o,
            state: 'CLOSED',
            closed_at: now,
            close_reason: result.reason,
            pnl: result.pnl,
            pnl_pct: result.pnl_pct,
          };
          changed++;
        }
      }
    }

    await saveOrders(orders);
    return NextResponse.json({ ok: true, updated: changed, orders });
  } catch (e: any) {
    console.error('virtual-orders process', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
