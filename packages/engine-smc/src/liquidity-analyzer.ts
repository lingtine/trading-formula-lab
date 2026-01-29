/**
 * Liquidity analysis: EQH/EQL and liquidity sweeps
 */

import { Candle } from '@trading-formula-lab/core';
import { Swing, EquilibriumLevel, LiquiditySweep } from './types';

/**
 * Detect Equilibrium High (EQH) and Equilibrium Low (EQL)
 * EQH: Highest point where price consolidated
 * EQL: Lowest point where price consolidated
 */
export function detectEquilibriumLevels(
  candles: Candle[],
  swings: Swing[]
): EquilibriumLevel[] {
  const levels: EquilibriumLevel[] = [];

  if (swings.length < 2) {
    return levels;
  }

  // Find EQH (highest swing high in recent range)
  const recentHighs = swings
    .filter(s => s.type === 'high')
    .slice(-5); // Last 5 swing highs

  if (recentHighs.length > 0) {
    const eqh = recentHighs.reduce((max, s) => s.price > max.price ? s : max);
    levels.push({
      id: `eqh-${eqh.time}`,
      type: 'EQH',
      price: eqh.price,
      time: eqh.time,
      strength: 70
    });
  }

  // Find EQL (lowest swing low in recent range)
  const recentLows = swings
    .filter(s => s.type === 'low')
    .slice(-5); // Last 5 swing lows

  if (recentLows.length > 0) {
    const eql = recentLows.reduce((min, s) => s.price < min.price ? s : min);
    levels.push({
      id: `eql-${eql.time}`,
      type: 'EQL',
      price: eql.price,
      time: eql.time,
      strength: 70
    });
  }

  return levels;
}

/**
 * Detect liquidity sweeps
 * Buy-side sweep: wick below support, then close back above
 * Sell-side sweep: wick above resistance, then close back below
 */
export function detectLiquiditySweeps(
  candles: Candle[],
  swings: Swing[],
  eqLevels: EquilibriumLevel[]
): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];

  if (candles.length < 3 || eqLevels.length === 0) {
    return sweeps;
  }

  // Check for sweeps in recent candles
  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    // Check EQL (buy-side liquidity)
    const eql = eqLevels.find(l => l.type === 'EQL');
    if (eql) {
      // Wick below EQL, then close back above
      if (prev.l < eql.price * 0.999 && curr.c > eql.price) {
        sweeps.push({
          id: `sweep-buy-${curr.t}`,
          type: 'buy_side',
          price: prev.l,
          time: curr.t,
          confirmed: true
        });
      }
    }

    // Check EQH (sell-side liquidity)
    const eqh = eqLevels.find(l => l.type === 'EQH');
    if (eqh) {
      // Wick above EQH, then close back below
      if (prev.h > eqh.price * 1.001 && curr.c < eqh.price) {
        sweeps.push({
          id: `sweep-sell-${curr.t}`,
          type: 'sell_side',
          price: prev.h,
          time: curr.t,
          confirmed: true
        });
      }
    }
  }

  return sweeps;
}
