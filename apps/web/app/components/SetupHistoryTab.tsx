'use client';

import { useState, useEffect, useCallback } from 'react';

/** Lệnh ảo: PLANNED (chưa chạm entry), OPEN (đã khớp), CLOSED (TP/SL), EXPIRED (hết hạn) */
export interface VirtualOrder {
  id: string;
  symbol: string;
  tf: string;
  side: 'BUY' | 'SELL';
  state: 'PLANNED' | 'OPEN' | 'CLOSED' | 'EXPIRED';
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
  snapshot_id: string;
  setup_ref: string;
  setup_name: string;
  close_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  notes: string | null;
  valid_until_candle_t?: number;
}

const STATE_LABEL: Record<string, string> = {
  PLANNED: 'Chờ entry',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  EXPIRED: 'Hết hạn',
};

function OrderTable({
  orders,
  onDelete,
  deletingId,
}: {
  orders: VirtualOrder[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #2a2a2a', background: '#0a0a0a' }}>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Thời gian</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Symbol / TF</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Kịch bản</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Side</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Entry</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Fill</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>SL / TP</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Trạng thái</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Đóng (lý do / PnL)</th>
          <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Xóa</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
            <td style={{ padding: '10px', color: '#ccc', whiteSpace: 'nowrap' }}>
              {new Date(o.created_at).toLocaleString('vi-VN')}
            </td>
            <td style={{ padding: '10px', color: '#aaa' }}>{o.symbol} / {o.tf}</td>
            <td style={{ padding: '10px', color: '#ccc' }}>{o.setup_name}</td>
            <td style={{ padding: '10px' }}>
              <span className={`badge ${o.side === 'BUY' ? 'bullish' : 'bearish'}`}>
                {o.side === 'BUY' ? 'MUA' : 'BÁN'}
              </span>
            </td>
            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>
              {o.entry_zone_low.toFixed(2)} – {o.entry_zone_high.toFixed(2)}
            </td>
            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>
              {o.entry_fill_price != null ? o.entry_fill_price.toFixed(2) : '—'}
            </td>
            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>
              SL {o.stop_loss.toFixed(2)} / TP {o.targets.slice(0, 2).map((t) => t.toFixed(2)).join(', ')}
            </td>
            <td style={{ padding: '10px' }}>
              <span
                className={`badge ${
                  o.state === 'OPEN' ? 'bullish' : o.state === 'CLOSED' ? 'neutral' : o.state === 'EXPIRED' ? 'bearish' : 'neutral'
                }`}
              >
                {STATE_LABEL[o.state] ?? o.state}
              </span>
            </td>
            <td style={{ padding: '10px', fontSize: '12px', color: '#888' }}>
              {o.close_reason != null && (
                <span>
                  {o.close_reason}
                  {o.pnl != null && ` / ${o.pnl >= 0 ? '+' : ''}${o.pnl.toFixed(2)} (${o.pnl_pct != null ? (o.pnl_pct >= 0 ? '+' : '') + o.pnl_pct.toFixed(1) + '%' : '—'})`}
                </span>
              )}
              {o.state === 'PLANNED' || o.state === 'OPEN' ? '—' : null}
            </td>
            <td style={{ padding: '10px' }}>
              <button
                type="button"
                disabled={deletingId === o.id}
                onClick={() => onDelete(o.id)}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#ef4444',
                  cursor: deletingId === o.id ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                Xóa
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SetupHistoryTab() {
  const [orders, setOrders] = useState<VirtualOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterState ? `/api/virtual-orders?state=${encodeURIComponent(filterState)}` : '/api/virtual-orders';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải lệnh ảo');
      setOrders(data.orders || []);
    } catch (e: any) {
      setError(e.message || 'Không tải được danh sách');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filterState]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteOrder = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/virtual-orders?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setError(e.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ orders, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-orders-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orders]);

  if (loading) {
    return <div className="loading">Đang tải lệnh ảo...</div>;
  }

  const planned = orders.filter((o) => o.state === 'PLANNED');
  const open = orders.filter((o) => o.state === 'OPEN');
  const closed = orders.filter((o) => o.state === 'CLOSED' || o.state === 'EXPIRED');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
          Lệnh ảo tạo từ tab Kịch bản (Tạo lệnh). Tự khớp entry khi giá chạm vùng, tự đóng theo TP/SL khi nến đóng.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#888' }}>
            Lọc:
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{
                padding: '6px 10px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
              }}
            >
              <option value="">Tất cả</option>
              <option value="PLANNED">Chờ entry</option>
              <option value="OPEN">Đang mở</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </label>
          <button
            type="button"
            onClick={load}
            style={{
              padding: '8px 16px',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={exportJson}
            style={{
              padding: '8px 16px',
              background: '#1a3a5c',
              border: '1px solid #2a4a6c',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Xuất JSON
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card">
          <div className="card-content">
            <p style={{ color: '#888', margin: 0 }}>
              Chưa có lệnh ảo. Vào tab <strong>Kịch bản</strong>, bấm <strong>Tạo lệnh</strong> trên một setup để tạo. Lệnh tự khớp khi giá chạm vùng entry và tự đóng theo TP/SL khi nến đóng.
            </p>
          </div>
        </div>
      ) : (
        <>
          {!filterState && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>
                Chờ entry: <strong style={{ color: '#f59e0b' }}>{planned.length}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#888' }}>
                Đang mở: <strong style={{ color: '#22c55e' }}>{open.length}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#888' }}>
                Đã đóng / Hết hạn: <strong style={{ color: '#888' }}>{closed.length}</strong>
              </span>
            </div>
          )}
          <div className="card" style={{ overflow: 'auto' }}>
            <div className="card-content" style={{ padding: 0 }}>
              <OrderTable orders={orders} onDelete={deleteOrder} deletingId={deletingId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
