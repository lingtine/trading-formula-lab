'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface KlineUpdate {
  candle: {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  };
  confirm: boolean;
  symbol: string;
  interval: string;
}

export interface UseBybitWebSocketOptions {
  symbol?: string;
  interval?: string;
  onKlineUpdate?: (update: KlineUpdate) => void;
  enabled?: boolean;
}

export function useBybitWebSocket({
  symbol = 'BTCUSDT',
  interval = '15',
  onKlineUpdate,
  enabled = true
}: UseBybitWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = 'wss://stream.bybit.com/v5/public/linear';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Bybit WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Subscribe to kline topic
        const topic = `kline.${interval}.${symbol}`;
        const subscribeMessage = {
          op: 'subscribe',
          args: [topic]
        };
        ws.send(JSON.stringify(subscribeMessage));
        console.log(`Subscribed to: ${topic}`);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle subscription confirmation
          if (message.op === 'subscribe' && message.success) {
            console.log('Subscription confirmed:', message.ret_msg);
            return;
          }

          // Handle kline updates
          if (message.topic && message.topic.startsWith('kline.')) {
            if (message.data && Array.isArray(message.data)) {
              message.data.forEach((item: any) => {
                // Only process confirmed candles
                if (item.confirm === true) {
                  const update: KlineUpdate = {
                    candle: {
                      t: item.start,
                      o: parseFloat(item.open),
                      h: parseFloat(item.high),
                      l: parseFloat(item.low),
                      c: parseFloat(item.close),
                      v: parseFloat(item.volume)
                    },
                    confirm: true,
                    symbol,
                    interval
                  };

                  if (onKlineUpdate) {
                    onKlineUpdate(update);
                  }
                }
              });
            }
          }
        } catch (err: any) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };
    } catch (err: any) {
      console.error('Error creating WebSocket:', err);
      setError(err.message || 'Failed to connect');
    }
  }, [symbol, interval, onKlineUpdate, enabled]);

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
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, symbol, interval, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect
  };
}
