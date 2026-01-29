/**
 * Bybit-specific types
 */

import { Candle, Timeframe, MarketCategory } from '../../core/src/types';

export interface BybitKlineParams {
  category: MarketCategory;
  symbol: string;
  interval: string; // Bybit interval format: "15", "60", "D", etc.
  start?: number; // epoch ms
  end?: number; // epoch ms
  limit?: number; // 1-1000, default 200
}

export interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: string[][]; // Array of [startTime, open, high, low, close, volume, turnover]
  };
}

export interface FetchCandlesOptions {
  symbol?: string;
  category?: MarketCategory;
  timeframe?: Timeframe;
  limit?: number;
  start?: number;
  end?: number;
}

export interface NormalizedCandlesResult {
  candles: Candle[];
  symbol: string;
  category: MarketCategory;
  timeframe: Timeframe;
}
