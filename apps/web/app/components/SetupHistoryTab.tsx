'use client';

import { useState, useEffect, useCallback } from 'react';

/** Bản ghi lịch sử áp dụng kịch bản (đồng bộ với API) */
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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  success: 'Thành công',
  failed: 'Thất bại',
};

const SOURCE_LABEL: Record<string, string> = {
  chart: 'Biểu đồ',
  setup: 'Thiết lập',
};

export function SetupHistoryTab() {
  const [entries, setEntries] = useState<SetupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/setup-history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải lịch sử');
      setEntries(data.entries || []);
    } catch (e: any) {
      setError(e.message || 'Không tải được lịch sử');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback(async (id: string, status: 'success' | 'failed') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/setup-history?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status, updatedAt: data.entry?.updatedAt ?? e.updatedAt } : e))
      );
    } catch (e: any) {
      setError(e.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ entries, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  if (loading) {
    return <div className="loading">Đang tải lịch sử áp dụng kịch bản...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
          Log lịch sử áp dụng kịch bản từ biểu đồ/thiết lập, lệnh (entry/SL/TP) và trạng thái thành công/thất bại.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
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

      {entries.length === 0 ? (
        <div className="card">
          <div className="card-content">
            <p style={{ color: '#888', margin: 0 }}>
              Chưa có bản ghi. Dùng nút &quot;Ghi vào lịch sử&quot; ở tab Thiết lập hoặc khi biểu đồ cập nhật để ghi kịch bản và lệnh.
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <div className="card-content" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a', background: '#0a0a0a' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Thời gian</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Nguồn</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Preset</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Symbol / TF</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Kịch bản</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Entry</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>SL</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>TP</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Trạng thái</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#aaa' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '10px', color: '#ccc', whiteSpace: 'nowrap' }}>
                      {new Date(e.appliedAt).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px', color: '#888' }}>{SOURCE_LABEL[e.source] ?? e.source}</td>
                    <td style={{ padding: '10px', color: '#aaa' }}>{e.presetId ?? '—'}</td>
                    <td style={{ padding: '10px', color: '#aaa' }}>{e.symbol} / {e.timeframe}</td>
                    <td style={{ padding: '10px', color: '#ccc' }}>
                      {e.setupSnapshot ? (
                        <span>
                          {e.setupSnapshot.name}{' '}
                          <span className={`badge ${e.setupSnapshot.direction === 'BUY' ? 'bullish' : 'bearish'}`}>
                            {e.setupSnapshot.direction === 'BUY' ? 'MUA' : 'BÁN'}
                          </span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '10px', color: '#aaa', fontFamily: 'monospace', fontSize: '12px' }}>
                      {e.setupSnapshot
                        ? `${e.setupSnapshot.entry.zone.low.toFixed(2)} – ${e.setupSnapshot.entry.zone.high.toFixed(2)}`
                        : '—'}
                    </td>
                    <td style={{ padding: '10px', color: '#aaa', fontFamily: 'monospace', fontSize: '12px' }}>
                      {e.setupSnapshot ? e.setupSnapshot.risk.stopLoss.toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: '10px', color: '#aaa', fontFamily: 'monospace', fontSize: '12px' }}>
                      {e.setupSnapshot && e.setupSnapshot.targets.length
                        ? e.setupSnapshot.targets.map((t) => t.price.toFixed(2)).join(', ')
                        : '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className={`badge ${
                          e.status === 'success' ? 'bullish' : e.status === 'failed' ? 'bearish' : 'neutral'
                        }`}
                      >
                        {STATUS_LABEL[e.status] ?? e.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {e.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={updatingId === e.id}
                            onClick={() => setStatus(e.id, 'success')}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(34,197,94,0.2)',
                              border: '1px solid #22c55e',
                              borderRadius: '4px',
                              color: '#22c55e',
                              cursor: updatingId === e.id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Thành công
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === e.id}
                            onClick={() => setStatus(e.id, 'failed')}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(239,68,68,0.2)',
                              border: '1px solid #ef4444',
                              borderRadius: '4px',
                              color: '#ef4444',
                              cursor: updatingId === e.id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Thất bại
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
