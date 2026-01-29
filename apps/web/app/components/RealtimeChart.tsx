'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '../hooks/useBybitKlineWS';

export interface RealtimeChartProps {
  candles: Candle[];
  candleStatus: 'forming' | 'closed';
  isConnected: boolean;
  symbol?: string;
  /** SMC analysis for overlays: OB, FVG, EQH/EQL (from engine output) */
  analysis?: {
    poi?: Array<{
      type: string;
      direction?: string;
      range: { low: number; high: number };
      id?: string;
    }>;
    levels?: Array<{
      type: string;
      range?: { low: number; high: number };
      id?: string;
    }>;
  };
}

function candleToChartItem(c: Candle): CandlestickData<UTCTimestamp> {
  return {
    time: Math.floor(c.t / 1000) as UTCTimestamp,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  };
}

export function RealtimeChart({
  candles,
  candleStatus,
  isConnected,
  symbol = 'BTCUSDT',
  analysis,
}: RealtimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>[]>([]);

  // Init chart when we have candles
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;
    if (chartRef.current) return; // already created

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0d0d0d' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: containerRef.current.clientWidth,
      height: 480,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const data = candles.map(candleToChartItem);
    candlestickSeries.setData(data);

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, [candles.length]);

  // Set/update candle data when candles change (initial load or WS merge)
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const data = candles.map(candleToChartItem);
    seriesRef.current.setData(data);
  }, [candles]);

  // Overlays: OB, FVG, EQH/EQL (price lines)
  const applyOverlays = useCallback(() => {
    if (!seriesRef.current) return;

    priceLinesRef.current.forEach((pl) => {
      try {
        seriesRef.current?.removePriceLine(pl);
      } catch (_) { }
    });
    priceLinesRef.current = [];

    if (!analysis) return;

    const series = seriesRef.current;

    // POI: Order Blocks & FVG (range = low/high)
    if (analysis.poi?.length) {
      analysis.poi.forEach((poi) => {
        if (!poi.range) return;
        const { low, high } = poi.range;
        const isBullish = poi.direction === 'bullish';
        const color = isBullish ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        const lowLine = series.createPriceLine({
          price: low,
          color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: poi.type === 'OB' ? (isBullish ? 'OB↑' : 'OB↓') : isBullish ? 'FVG↑' : 'FVG↓',
        });
        const highLine = series.createPriceLine({
          price: high,
          color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
        });
        priceLinesRef.current.push(lowLine, highLine);
      });
    }

    // Levels: EQH/EQL (range midpoint or both lines)
    if (analysis.levels?.length) {
      analysis.levels.forEach((level) => {
        const range = level.range;
        if (!range) return;
        const mid = (range.low + range.high) / 2;
        const isEQH = level.type === 'EQH';
        const color = isEQH ? '#3b82f6' : level.type === 'EQL' ? '#f59e0b' : '#6b7280';
        const pl = series.createPriceLine({
          price: mid,
          color,
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: level.type,
        });
        priceLinesRef.current.push(pl);
      });
    }
  }, [analysis]);

  useEffect(() => {
    applyOverlays();
  }, [applyOverlays, analysis]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>{symbol}</span>
        <span
          style={{
            fontSize: '12px',
            color: isConnected ? '#22c55e' : '#6b7280',
          }}
        >
          WS: {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: candleStatus === 'forming' ? '#f59e0b' : '#6b7280',
          }}
        >
          Nến: {candleStatus === 'forming' ? 'đang hình thành' : 'đã đóng'}
        </span>
      </div>
      <div ref={containerRef} style={{ width: '100%', minHeight: '480px' }} />
    </div>
  );
}
