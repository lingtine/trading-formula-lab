'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations } from './translations/vi';
import { HelpDialog } from './components/HelpDialog';
import { useBybitWebSocket, KlineUpdate } from './hooks/useBybitWebSocket';
import { useBybitKlineWS } from './hooks/useBybitKlineWS';
import { RealtimeChart } from './components/RealtimeChart';
import { SetupTab } from './components/SetupTab';

type Tab = 'bias' | 'liquidity' | 'poi' | 'setups' | 'method' | 'chart' | 'setup';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('bias');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [realtime, setRealtime] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newCandleReceived, setNewCandleReceived] = useState(false);
  const [chartCandles, setChartCandles] = useState<Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>>([]);
  const [chartCandlesLoading, setChartCandlesLoading] = useState(false);
  const [presetId, setPresetId] = useState<string | null>('btc_m15_conservative');
  const [setupParams, setSetupParams] = useState<Record<string, number | string | boolean>>({});

  // Load initial analysis
  useEffect(() => {
    loadAnalysis();
  }, []);

  // Fetch candles for chart: GET /api/candles, fallback client Bybit
  const fetchChartCandles = useCallback(async () => {
    setChartCandlesLoading(true);
    try {
      let candles: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> = [];
      const symbol = 'BTCUSDT';
      const tf = '15';
      const limit = 200;

      const apiRes = await fetch(`/api/candles?symbol=${symbol}&tf=${tf}&limit=${limit}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.candles?.length) candles = data.candles;
      }

      if (candles.length === 0) {
        const bybitUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${tf}&limit=${limit}`;
        const res = await fetch(bybitUrl, { method: 'GET', headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Bybit ${res.status}`);
        const data = await res.json();
        if (data.retCode !== 0 || !data.result?.list?.length) throw new Error(data.retMsg || 'No candles');
        candles = data.result.list.reverse().map((item: string[]) => ({
          t: parseInt(item[0], 10),
          o: parseFloat(item[1]),
          h: parseFloat(item[2]),
          l: parseFloat(item[3]),
          c: parseFloat(item[4]),
          v: parseFloat(item[5]),
        }));
      }
      setChartCandles(candles);
    } catch (e) {
      console.error('Fetch chart candles error:', e);
    } finally {
      setChartCandlesLoading(false);
    }
  }, []);

  // When opening Chart tab, fetch candles if not yet loaded
  useEffect(() => {
    if (activeTab === 'chart' && chartCandles.length === 0 && !chartCandlesLoading) {
      fetchChartCandles();
    }
  }, [activeTab, chartCandles.length, chartCandlesLoading, fetchChartCandles]);

  // Realtime chart: WS merge + SMC on candle close
  const onCandleClose = useCallback(async (candles: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>) => {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candles,
          symbol: 'BTCUSDT',
          category: 'linear',
          timeframe: 'M15',
          presetId,
          params: Object.keys(setupParams).length ? setupParams : undefined,
        }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setAnalysis(result);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('SMC on candle close error:', e);
    }
  }, [presetId, setupParams]);

  const {
    candles: wsCandles,
    isConnected: chartWsConnected,
    error: chartWsError,
    candleStatus,
  } = useBybitKlineWS({
    symbol: 'BTCUSDT',
    interval: '15',
    initialCandles: chartCandles,
    onCandleClose,
    enabled: activeTab === 'chart',
  });

  // Handle WebSocket kline updates
  const handleKlineUpdate = useCallback(async (update: KlineUpdate) => {
    if (!update.confirm) return; // Only process confirmed candles

    console.log('New confirmed candle received:', update);
    setNewCandleReceived(true);

    // Reload analysis when new candle is confirmed
    await loadAnalysis(true);

    // Reset indicator after a moment
    setTimeout(() => setNewCandleReceived(false), 2000);
  }, []);

  // WebSocket connection
  const { isConnected: wsConnected, error: wsError } = useBybitWebSocket({
    symbol: 'BTCUSDT',
    interval: '15',
    onKlineUpdate: handleKlineUpdate,
    enabled: realtime
  });

  const loadAnalysis = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Fetch candles từ Bybit trực tiếp từ browser (tránh bị CloudFront chặn)
      const symbol = 'BTCUSDT';
      const category = 'linear';
      const interval = '15'; // M15
      const limit = 200;

      const bybitUrl = `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;

      const candlesResponse = await fetch(bybitUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!candlesResponse.ok) {
        throw new Error(`Failed to fetch candles: ${candlesResponse.status} ${candlesResponse.statusText}`);
      }

      const candlesData = await candlesResponse.json();

      if (candlesData.retCode !== 0) {
        throw new Error(`Bybit API error: ${candlesData.retMsg} (code: ${candlesData.retCode})`);
      }

      if (!candlesData.result || !candlesData.result.list || candlesData.result.list.length === 0) {
        throw new Error('No candles returned from Bybit API');
      }

      // Normalize candles: Bybit returns [startTime, open, high, low, close, volume, ...]
      // Reverse để có chronological order (oldest first)
      const candles = candlesData.result.list
        .reverse()
        .map((item: string[]) => ({
          t: parseInt(item[0], 10), // startTime (epoch ms)
          o: parseFloat(item[1]),   // openPrice
          h: parseFloat(item[2]),   // highPrice
          l: parseFloat(item[3]),   // lowPrice
          c: parseFloat(item[4]),   // closePrice
          v: parseFloat(item[5])    // volume
        }));

      // Gửi candles lên server để chạy SMC engine
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candles,
          symbol,
          category,
          timeframe: 'M15',
          presetId,
          params: Object.keys(setupParams).length ? setupParams : undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysis(result);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
      console.error('Analysis error:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const t = translations;

  if (loading && !analysis) {
    return (
      <div className="container">
        <div className="loading">{t.common.loading}</div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="container">
        <div className="error">{t.common.error}: {error}</div>
        <button
          onClick={() => loadAnalysis()}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container">
        <div className="error">{t.common.noData}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>
          SMC Analysis - {analysis.context.symbol}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {lastUpdate && (
            <span style={{ fontSize: '12px', color: '#888' }}>
              {t.common.lastUpdate}: {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
          )}
          {newCandleReceived && (
            <span style={{
              fontSize: '12px',
              color: '#10b981',
              animation: 'pulse 1s ease-in-out',
              fontWeight: '600'
            }}>
              ✨ Candle mới đã được cập nhật
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: wsConnected ? '#10b981' : realtime ? '#ef4444' : '#6b7280',
              animation: wsConnected ? 'pulse 2s infinite' : 'none'
            }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={realtime}
                onChange={(e) => {
                  setRealtime(e.target.checked);
                  if (!e.target.checked) {
                    setNewCandleReceived(false);
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: realtime ? '#4a9eff' : '#888' }}>
                🔴 {t.common.realtime}
              </span>
            </label>
          </div>
          {wsError && realtime && (
            <span style={{ fontSize: '12px', color: '#ef4444' }}>
              WS: {wsError}
            </span>
          )}
          <button
            onClick={() => loadAnalysis()}
            style={{
              padding: '8px 16px',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 {t.common.refresh}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'bias' ? 'active' : ''}`}
          onClick={() => setActiveTab('bias')}
        >
          {t.tabs.bias}
        </button>
        <button
          className={`tab ${activeTab === 'liquidity' ? 'active' : ''}`}
          onClick={() => setActiveTab('liquidity')}
        >
          {t.tabs.liquidity}
        </button>
        <button
          className={`tab ${activeTab === 'poi' ? 'active' : ''}`}
          onClick={() => setActiveTab('poi')}
        >
          {t.tabs.poi}
        </button>
        <button
          className={`tab ${activeTab === 'setups' ? 'active' : ''}`}
          onClick={() => setActiveTab('setups')}
        >
          {t.tabs.setups}
        </button>
        <button
          className={`tab ${activeTab === 'method' ? 'active' : ''}`}
          onClick={() => setActiveTab('method')}
        >
          {t.tabs.method}
        </button>
        <button
          className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          {t.tabs.chart}
        </button>
        <button
          className={`tab ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          {t.tabs.setup}
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'bias' && <BiasTab summary={analysis.summary} t={t.bias} />}
        {activeTab === 'liquidity' && <LiquidityTab levels={analysis.levels} signals={analysis.signals} t={t.liquidity} />}
        {activeTab === 'poi' && <POITab poi={analysis.poi} t={t.poi} />}
        {activeTab === 'setups' && <SetupsTab setups={analysis.setups} t={t.setups} />}
        {activeTab === 'method' && <MethodTab analysis={analysis} t={t.method} />}
        {activeTab === 'chart' && (
          <ChartTab
            candles={wsCandles.length ? wsCandles : chartCandles}
            candleStatus={candleStatus}
            isConnected={chartWsConnected}
            chartCandlesLoading={chartCandlesLoading}
            chartWsError={chartWsError}
            analysis={analysis}
          />
        )}
        {activeTab === 'setup' && (
          <SetupTab
            presetId={presetId}
            setupParams={setupParams}
            onPresetChange={setPresetId}
            onParamsChange={setSetupParams}
            onApply={() => loadAnalysis()}
            analysis={analysis}
          />
        )}
      </div>
    </div>
  );
}

function ChartTab({
  candles,
  candleStatus,
  isConnected,
  chartCandlesLoading,
  chartWsError,
  analysis,
}: {
  candles: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>;
  candleStatus: 'forming' | 'closed';
  isConnected: boolean;
  chartCandlesLoading: boolean;
  chartWsError: string | null;
  analysis: any;
}) {
  const t = translations;
  if (chartCandlesLoading && candles.length === 0) {
    return <div className="loading">{t.common.loading}</div>;
  }
  if (candles.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <p style={{ color: '#888' }}>Chưa có dữ liệu nến. Thử refresh hoặc kiểm tra kết nối.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      {chartWsError && (
        <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', fontSize: '14px' }}>
          WS: {chartWsError}
        </div>
      )}
      <RealtimeChart
        candles={candles}
        candleStatus={candleStatus}
        isConnected={isConnected}
        symbol="BTCUSDT"
        analysis={analysis ? { poi: analysis.poi, levels: analysis.levels } : undefined}
      />
    </div>
  );
}

function BiasTab({ summary, t }: { summary: any; t: any }) {
  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-title">{t.title}</div>
          <HelpDialog title={t.help.title} content={t.help.content} />
        </div>
        <div className="card-content">
          <span className={`badge ${summary.bias}`}>{t.biasTypes[summary.bias]}</span>
          <p style={{ marginTop: '12px', fontSize: '18px', fontWeight: '600' }}>
            {summary.headline}
          </p>
          <p style={{ marginTop: '8px', color: '#888' }}>
            {t.confidence}: {summary.confidence}%
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t.decision}</div>
        <div className="card-content">
          <span className={`badge ${summary.decision === 'BUY' ? 'bullish' : summary.decision === 'SELL' ? 'bearish' : 'neutral'}`}>
            {t.decisions[summary.decision]}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t.keyReasons}</div>
        <div className="card-content">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {summary.keyReasons.map((reason: string, i: number) => (
              <li key={i} style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LiquidityTab({ levels, signals, t }: { levels: any[]; signals: any[]; t: any }) {
  const liquidityLevels = levels.filter(l =>
    l.type === 'EQH' || l.type === 'EQL' ||
    l.type === 'BUY_SIDE_LIQUIDITY' || l.type === 'SELL_SIDE_LIQUIDITY'
  );
  const sweepSignals = signals.filter(s => s.kind === 'LIQUIDITY_SWEEP');

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-title">{t.title}</div>
          <HelpDialog title={t.help.title} content={t.help.content} />
        </div>
        <div className="card-content">
          {liquidityLevels.length === 0 ? (
            <p style={{ color: '#888' }}>{t.noLevels}</p>
          ) : (
            liquidityLevels.map((level, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{t.types[level.type] || level.type}</span>
                  <span className={`badge ${level.status === 'fresh' ? 'bullish' : 'neutral'}`}>
                    {t.status[level.status] || level.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Range: {level.range.low.toFixed(2)} - {level.range.high.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t.sweeps}</div>
        <div className="card-content">
          {sweepSignals.length === 0 ? (
            <p style={{ color: '#888' }}>{t.noSweeps}</p>
          ) : (
            sweepSignals.map((signal, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{signal.label}</span>
                  <span className={`badge ${signal.direction}`}>
                    {signal.direction === 'bullish' ? 'Tăng' : 'Giảm'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {signal.reason}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function POITab({ poi, t }: { poi: any[]; t: any }) {
  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-title">{t.title} ({poi.length})</div>
          <HelpDialog title={t.help.title} content={t.help.content} />
        </div>
        <div className="card-content">
          {poi.length === 0 ? (
            <p style={{ color: '#888' }}>{t.noPoi}</p>
          ) : (
            poi.map((item, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{t.types[item.type] || item.type} - {t.directions[item.direction] || item.direction}</span>
                  <span className={`badge ${item.freshness.isFresh ? 'bullish' : 'neutral'}`}>
                    {item.freshness.isFresh ? t.freshness.fresh : t.freshness.consumed}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  Range: {item.range.low.toFixed(2)} - {item.range.high.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {t.touches}: {item.freshness.touches} | {t.fillRatio}: {(item.freshness.fillRatio * 100).toFixed(0)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SetupsTab({ setups, t }: { setups: any[]; t: any }) {
  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-title">{t.title} ({setups.length})</div>
          <HelpDialog title={t.help.title} content={t.help.content} />
        </div>
        <div className="card-content">
          {setups.length === 0 ? (
            <p style={{ color: '#888' }}>{t.noSetups}</p>
          ) : (
            setups.map((setup, i) => (
              <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{setup.name}</span>
                  <span className={`badge ${setup.direction === 'BUY' ? 'bullish' : 'bearish'}`}>
                    {setup.direction === 'BUY' ? 'MUA' : 'BÁN'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                  {t.status.title}: <span style={{ color: '#fff' }}>{t.status[setup.status] || setup.status}</span>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {t.entryZone}: {setup.entry.zone.low.toFixed(2)} - {setup.entry.zone.high.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {t.stopLoss}: {setup.risk.stopLoss.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  {t.targets}: {setup.targets.map((tgt: any) => tgt.price.toFixed(2)).join(', ')}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {t.confidence}: {setup.confidence}% | {t.rrMin}: {setup.risk.rrMin}
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                  {t.reasons}:
                  <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                    {setup.reasons.map((r: string, j: number) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MethodTab({ analysis, t }: { analysis: any; t: any }) {
  return (
    <div>
      {/* SMC Introduction */}
      <div className="card">
        <div className="card-title">{t.smc.title}</div>
        <div className="card-content">
          <p style={{ marginBottom: '16px', lineHeight: '1.8' }}>
            {t.smc.description}
          </p>
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Nguyên tắc cốt lõi:
            </h4>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              {t.smc.principles.map((principle: string, i: number) => (
                <li key={i} style={{ marginBottom: '8px' }}>{principle}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Formulas */}
      <div className="card">
        <div className="card-title">{t.formulas.title}</div>
        <div className="card-content">
          {/* Swing Detection */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.swingDetection.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.swingDetection.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.swingDetection.description}
            </div>
          </div>

          {/* BOS */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.bos.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.bos.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.bos.description}
            </div>
          </div>

          {/* CHoCH */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.choch.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.choch.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.choch.description}
            </div>
          </div>

          {/* Liquidity */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.liquidity.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.liquidity.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.liquidity.description}
            </div>
          </div>

          {/* Order Block */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.orderBlock.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.orderBlock.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.orderBlock.description}
            </div>
          </div>

          {/* FVG */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {t.formulas.fvg.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>
              {t.formulas.fvg.formula}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
              {t.formulas.fvg.description}
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="card">
        <div className="card-title">{t.system.title}</div>
        <div className="card-content">
          {/* Architecture */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              {t.system.architecture.title}
            </h4>
            <p style={{ marginBottom: '12px', color: '#ccc' }}>
              {t.system.architecture.description}
            </p>
            {t.system.architecture.components.map((comp: any, i: number) => (
              <div key={i} style={{ marginBottom: '12px', padding: '10px', background: '#0a0a0a', borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                  {comp.name}
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>
                  {comp.description}
                </div>
              </div>
            ))}
          </div>

          {/* Workflow */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              {t.system.workflow.title}
            </h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              {t.system.workflow.steps.map((step: string, i: number) => (
                <li key={i} style={{ marginBottom: '8px', color: '#ccc' }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Tech Stack */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#4a9eff', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              {t.system.techStack.title}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {t.system.techStack.items.map((tech: string, i: number) => (
                <span key={i} className="badge neutral" style={{ fontSize: '12px' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Current Config */}
          <div>
            <h4 style={{ color: '#4a9eff', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              {t.system.currentConfig.title}
            </h4>
            {analysis && (
              <div style={{ padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Symbol</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.context.symbol}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Market</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.context.market} ({analysis.context.category})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Timeframe</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.context.timeframe}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Candles</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.context.range.limit}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Data Source</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.context.candleSource}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Engine Version</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                      {analysis.engine.version}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Time Range</div>
                  <div style={{ fontSize: '13px', color: '#ccc' }}>
                    {new Date(analysis.context.range.from).toLocaleString('vi-VN')} → {new Date(analysis.context.range.to).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            )}
            {!analysis && (
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                {t.system.currentConfig.items.map((item: string, i: number) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#ccc' }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
