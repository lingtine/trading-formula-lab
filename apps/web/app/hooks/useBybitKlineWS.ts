'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface UseBybitKlineWSOptions {
  symbol?: string;
  interval?: string;
  initialCandles?: Candle[];
  onCandleClose?: (candles: Candle[]) => void;
  enabled?: boolean;
}

/**
 * Hook: WebSocket Bybit kline + merge logic.
 * - confirm=false → update nến đang chạy (last candle)
 * - confirm=true → append nến mới + gọi onCandleClose(candles)
 */
export function useBybitKlineWS({
  symbol = 'BTCUSDT',
  interval = '15',
  initialCandles = [],
  onCandleClose,
  enabled = true,
}: UseBybitKlineWSOptions) {
  const [candles, setCandles] = useState<Candle[]>(initialCandles);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candleStatus, setCandleStatus] = useState<'forming' | 'closed'>('closed');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const onCandleCloseRef = useRef(onCandleClose);
  onCandleCloseRef.current = onCandleClose;

  // Sync initial candles when they change (e.g. after first fetch)
  useEffect(() => {
    if (initialCandles.length > 0) {
      setCandles(initialCandles);
    }
  }, [initialCandles.length]);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = 'wss://stream.bybit.com/v5/public/linear';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      const topic = `kline.${interval}.${symbol}`;
      ws.send(JSON.stringify({ op: 'subscribe', args: [topic] }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.op === 'subscribe' && message.success) return;
        if (!message.topic?.startsWith('kline.') || !message.data?.length) return;

        message.data.forEach((item: any) => {
          const t = item.start;
          const candle: Candle = {
            t,
            o: parseFloat(item.open),
            h: parseFloat(item.high),
            l: parseFloat(item.low),
            c: parseFloat(item.close),
            v: parseFloat(item.volume),
          };
          const confirm = item.confirm === true;

          setCandles((prev) => {
            if (prev.length === 0) {
              const next = [candle];
              if (confirm && onCandleCloseRef.current) setTimeout(() => onCandleCloseRef.current?.(next), 0);
              setCandleStatus(confirm ? 'closed' : 'forming');
              return next;
            }
            const last = prev[prev.length - 1];
            if (t === last.t) {
              const next = [...prev.slice(0, -1), candle];
              if (confirm && onCandleCloseRef.current) setTimeout(() => onCandleCloseRef.current?.(next), 0);
              setCandleStatus(confirm ? 'closed' : 'forming');
              return next;
            }
            if (t > last.t) {
              const next = [...prev, candle];
              if (confirm && onCandleCloseRef.current) setTimeout(() => onCandleCloseRef.current?.(next), 0);
              setCandleStatus(confirm ? 'closed' : 'forming');
              return next;
            }
            return prev;
          });
        });
      } catch (e) {
        console.error('useBybitKlineWS parse error:', e);
      }
    };

    ws.onerror = () => setError('WebSocket error');
    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Max reconnection attempts reached');
      }
    };
  }, [enabled, symbol, interval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) connect();
    else disconnect();
    return () => disconnect();
  }, [enabled, symbol, interval, connect, disconnect]);

  return {
    candles,
    setCandles,
    isConnected,
    error,
    candleStatus,
  };
}
