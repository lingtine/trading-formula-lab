'use client';

import { useState, useEffect, useCallback } from 'react';

interface ParamSchemaItem {
  key: string;
  type: string;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  help: string;
  group: string;
  options?: { value: string; label: string }[];
}

interface PresetDef {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  params: Record<string, number | string | boolean>;
}

interface SetupTabProps {
  presetId: string | null;
  setupParams: Record<string, number | string | boolean>;
  onPresetChange: (id: string | null) => void;
  onParamsChange: (params: Record<string, number | string | boolean>) => void;
  analysis?: any;
}

export function SetupTab({
  presetId,
  setupParams,
  onPresetChange,
  onParamsChange,
  analysis,
}: SetupTabProps) {
  const [schema, setSchema] = useState<ParamSchemaItem[]>([]);
  const [groups, setGroups] = useState<{ id: string; label: string }[]>([]);
  const [presets, setPresets] = useState<PresetDef[]>([]);
  const [defaultParams, setDefaultParams] = useState<Record<string, number | string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/setup')
      .then((res) => res.json())
      .then((data) => {
        setSchema(data.schema || []);
        setGroups(data.groups || []);
        setPresets(data.presets || []);
        setDefaultParams(data.defaultParams || {});
      })
      .catch((e) => console.error('Setup load error:', e))
      .finally(() => setLoading(false));
  }, []);

  // Sync setupParams from preset once when presetId is set and setupParams still empty
  useEffect(() => {
    if (presets.length === 0 || Object.keys(defaultParams).length === 0) return;
    if (!presetId || Object.keys(setupParams).length > 0) return;
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      const merged = { ...defaultParams, ...preset.params };
      onParamsChange(merged);
    }
  }, [presetId, presets.length]);

  const applyPreset = useCallback(
    (id: string | null) => {
      onPresetChange(id);
      if (id) {
        const preset = presets.find((p) => p.id === id);
        if (preset) {
          const merged = { ...defaultParams, ...preset.params };
          onParamsChange(merged);
        }
      } else {
        onParamsChange({ ...defaultParams });
      }
    },
    [presets, defaultParams, onPresetChange, onParamsChange]
  );

  const getValue = useCallback(
    (key: string): number | string | boolean => {
      if (setupParams[key] !== undefined) return setupParams[key];
      const item = schema.find((p) => p.key === key);
      return item ? (item.default as number | string | boolean) : 0;
    },
    [setupParams, schema]
  );

  const setValue = useCallback(
    (key: string, value: number | string | boolean) => {
      onParamsChange({ ...setupParams, [key]: value });
    },
    [setupParams, onParamsChange]
  );

  const resetGroupToPreset = useCallback(
    (groupId: string) => {
      const base = presetId ? (() => {
        const p = presets.find((x) => x.id === presetId);
        return p ? { ...defaultParams, ...p.params } : { ...defaultParams };
      })() : { ...defaultParams };
      const groupKeys = schema.filter((p) => p.group === groupId).map((p) => p.key);
      const next = { ...setupParams };
      groupKeys.forEach((k) => {
        if (base[k] !== undefined) next[k] = base[k];
      });
      onParamsChange(next);
    },
    [presetId, presets, defaultParams, schema, setupParams, onParamsChange]
  );

  const saveAsMyPreset = useCallback(() => {
    try {
      const key = 'smc_my_preset';
      localStorage.setItem(key, JSON.stringify({ presetId, params: setupParams }));
      setSavedMessage('Đã lưu vào "My preset".');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (e) {
      setSavedMessage('Lưu thất bại.');
    }
  }, [presetId, setupParams]);

  if (loading) {
    return <div className="loading">Đang tải cấu hình...</div>;
  }

  const leftColumn = (
    <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {analysis?.diagnostics?.params && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Tham số đã áp dụng</div>
          <div className="card-content">
            <pre style={{ fontSize: '11px', color: '#888', overflow: 'auto', maxHeight: '320px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(analysis.diagnostics.params, null, 2)}
            </pre>
          </div>
        </div>
      )}
      {analysis?.diagnostics?.warnings?.length > 0 && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Cảnh báo</div>
          <div className="card-content">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {analysis.diagnostics.warnings.map((w: string, i: number) => (
                <li key={i} style={{ marginBottom: '6px', fontSize: '13px', color: '#f59e0b' }}>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {(!analysis?.diagnostics?.params && (!analysis?.diagnostics?.warnings || analysis.diagnostics.warnings.length === 0)) && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Tham số đã áp dụng</div>
          <div className="card-content">
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Chạy phân tích (Refresh hoặc mở Chart) để xem tham số engine đã dùng.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {leftColumn}
      <div style={{ flex: 1, minWidth: '320px', maxWidth: '720px' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Preset</div>
          <div className="card-content">
            <p style={{ color: '#888', marginBottom: '12px', fontSize: '14px' }}>
              Chọn preset phù hợp với phong cách giao dịch. Engine sẽ dùng bộ tham số tương ứng.
            </p>
            <select
              value={presetId || ''}
              onChange={(e) => applyPreset(e.target.value || null)}
              aria-label="Chọn preset"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '10px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="">— Mặc định (schema) —</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {presetId && presets.find((p) => p.id === presetId) && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#888' }}>
                {presets.find((p) => p.id === presetId)?.description}
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div className="card-title">Advanced</div>
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                padding: '8px 16px',
                background: advancedOpen ? '#2a2a2a' : '#1a3a5c',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {advancedOpen ? 'Thu gọn' : 'Mở Advanced'}
            </button>
          </div>
          {advancedOpen && (
            <div className="card-content" style={{ paddingTop: '8px' }}>
              <p style={{ color: '#888', marginBottom: '16px', fontSize: '13px' }}>
                Chỉnh từng tham số. Giới hạn min/max được áp dụng để không phá engine.
              </p>
              {groups.map((gr) => {
                const items = schema.filter((p) => p.group === gr.id);
                if (items.length === 0) return null;
                return (
                  <div key={gr.id} style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>{gr.label}</span>
                      <button
                        type="button"
                        onClick={() => resetGroupToPreset(gr.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Về preset
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item) => (
                        <div key={item.key} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                          <label style={{ flex: '1 1 200px', fontSize: '14px' }} title={item.help}>
                            {item.label}
                          </label>
                          {item.type === 'number' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
                              <input
                                type="range"
                                min={item.min}
                                max={item.max}
                                step={item.step ?? 0.01}
                                value={Number(getValue(item.key))}
                                onChange={(e) => setValue(item.key, Number(e.target.value))}
                                style={{ flex: 1, minWidth: '100px' }}
                              />
                              <span style={{ minWidth: '48px', fontSize: '13px', color: '#aaa' }}>
                                {typeof getValue(item.key) === 'number' && Number(getValue(item.key)) % 1 !== 0
                                  ? Number(getValue(item.key)).toFixed(2)
                                  : getValue(item.key)}
                              </span>
                            </div>
                          )}
                          {item.type === 'select' && (
                            <select
                              value={String(getValue(item.key))}
                              onChange={(e) => setValue(item.key, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '13px',
                                minWidth: '140px',
                              }}
                            >
                              {item.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {item.type === 'boolean' && (
                            <input
                              type="checkbox"
                              checked={Boolean(getValue(item.key))}
                              onChange={(e) => setValue(item.key, e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={saveAsMyPreset}
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
                  Lưu thành preset của tôi
                </button>
                {savedMessage && <span style={{ fontSize: '13px', color: '#22c55e' }}>{savedMessage}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
