/**
 * Core types for trading formula lab
 */

// Normalized candle format
export interface Candle {
  t: number; // timestamp (epoch ms)
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

// Bybit kline response item (raw format)
export interface BybitKlineItem {
  0: string; // startTime
  1: string; // openPrice
  2: string; // highPrice
  3: string; // lowPrice
  4: string; // closePrice
  5: string; // volume
  6: string; // turnover
}

// Timeframe type
export type Timeframe = 'M1' | 'M3' | 'M5' | 'M15' | 'M30' | 'H1' | 'H2' | 'H4' | 'H6' | 'H12' | 'D1' | 'W1';

// Market category
export type MarketCategory = 'spot' | 'linear' | 'inverse';
