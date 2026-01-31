import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

/** Một bản ghi áp dụng kịch bản: từ chart/setup, lệnh (entry/SL/TP) và trạng thái */
export interface SetupHistoryEntry {
  id: string;
  appliedAt: string;
  presetId: string | null;
  params: Record<string, number | string | boolean>;
  symbol: string;
  timeframe: string;
  source: 'chart' | 'setup';
  candleTime?: number;
  setupSnapshot: {
    name: string;
    direction: string;
    entry: { zone: { low: number; high: number } };
    risk: { stopLoss: number };
    targets: Array<{ price: number }>;
  } | null;
  status: 'pending' | 'success' | 'failed';
  updatedAt?: string;
}

const FILENAME = 'setup-history.json';

/** In-memory fallback khi không ghi được file (vd. Vercel) */
let memoryStore: SetupHistoryEntry[] = [];

async function getDataPath(): Promise<string> {
  const dir = join(process.cwd(), 'data');
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
  return join(dir, FILENAME);
}

async function loadEntries(): Promise<SetupHistoryEntry[]> {
  try {
    const path = await getDataPath();
    const raw = await readFile(path, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return memoryStore.length ? memoryStore : [];
  }
}

async function saveEntries(entries: SetupHistoryEntry[]): Promise<void> {
  memoryStore = entries;
  try {
    const path = await getDataPath();
    await writeFile(path, JSON.stringify({ entries, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('setup-history: could not write file, using memory only', e);
  }
}

function generateId(): string {
  return `sh_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** GET: danh sách lịch sử áp dụng kịch bản */
export async function GET() {
  try {
    const entries = await loadEntries();
    return NextResponse.json({ entries });
  } catch (e: any) {
    console.error('setup-history GET', e);
    return NextResponse.json({ error: e.message, entries: [] }, { status: 500 });
  }
}

/** POST: thêm bản ghi mới (từ chart/setup, tự tạo lệnh từ kịch bản) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      presetId = null,
      params = {},
      symbol = 'BTCUSDT',
      timeframe = 'M15',
      source = 'setup',
      candleTime,
      setupSnapshot = null,
    } = body;

    const entries = await loadEntries();
    const now = new Date().toISOString();
    const entry: SetupHistoryEntry = {
      id: generateId(),
      appliedAt: now,
      presetId,
      params: typeof params === 'object' ? params : {},
      symbol: String(symbol),
      timeframe: String(timeframe),
      source: source === 'chart' ? 'chart' : 'setup',
      candleTime: typeof candleTime === 'number' ? candleTime : undefined,
      setupSnapshot: setupSnapshot && typeof setupSnapshot === 'object' ? setupSnapshot : null,
      status: 'pending',
      updatedAt: now,
    };
    entries.unshift(entry);
    await saveEntries(entries);
    return NextResponse.json({ ok: true, entry });
  } catch (e: any) {
    console.error('setup-history POST', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH: cập nhật trạng thái (thành công / thất bại) */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json().catch(() => ({}));
    const status = body.status as string;

    if (!id || !['success', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Missing id or invalid status (success|failed)' },
        { status: 400 }
      );
    }

    const entries = await loadEntries();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    entries[idx] = {
      ...entries[idx],
      status: status as 'success' | 'failed',
      updatedAt: now,
    };
    await saveEntries(entries);
    return NextResponse.json({ ok: true, entry: entries[idx] });
  } catch (e: any) {
    console.error('setup-history PATCH', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
