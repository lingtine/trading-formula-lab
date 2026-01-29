/**
 * SMC Engine types
 */

import { Candle, Timeframe } from '@trading-formula-lab/core';

// Swing point
export interface Swing {
  index: number;
  time: number;
  price: number;
  type: 'high' | 'low';
}

// Market structure
export interface MarketStructure {
  bias: 'bullish' | 'bearish' | 'range' | 'unknown';
  lastBOS?: {
    index: number;
    time: number;
    price: number;
    direction: 'bullish' | 'bearish';
  };
  lastCHoCH?: {
    index: number;
    time: number;
    price: number;
    direction: 'bullish' | 'bearish';
  };
}

// EQH/EQL level
export interface EquilibriumLevel {
  id: string;
  type: 'EQH' | 'EQL';
  price: number;
  time: number;
  strength: number;
}

// Liquidity sweep
export interface LiquiditySweep {
  id: string;
  type: 'buy_side' | 'sell_side';
  price: number;
  time: number;
  confirmed: boolean;
}

// Order Block
export interface OrderBlock {
  id: string;
  direction: 'bullish' | 'bearish';
  range: { low: number; high: number };
  time: number;
  createdBy: 'bos' | 'choch' | 'displacement' | 'manual';
  freshness: {
    isFresh: boolean;
    touches: number;
    fillRatio: number;
  };
}

// Fair Value Gap
export interface FairValueGap {
  id: string;
  direction: 'bullish' | 'bearish';
  range: { low: number; high: number };
  time: number;
  freshness: {
    isFresh: boolean;
    touches: number;
    fillRatio: number;
  };
}
