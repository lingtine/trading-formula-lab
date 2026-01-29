/**
 * Points of Interest (POI) detection: Order Blocks and Fair Value Gaps
 */

import { Candle } from '../../core/src/types';
import { OrderBlock, FairValueGap } from './types';

/**
 * Detect Order Blocks (OB)
 * Bullish OB: Last bearish candle before a strong bullish move
 * Bearish OB: Last bullish candle before a strong bearish move
 */
export function detectOrderBlocks(
  candles: Candle[],
  displacementThreshold: number = 0.5 // % change to consider as displacement
): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];

  if (candles.length < 3) {
    return orderBlocks;
  }

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // Bullish OB: bearish candle followed by strong bullish displacement
    if (curr.c < curr.o && next.c > next.o) {
      const displacement = ((next.c - curr.c) / curr.c) * 100;
      if (displacement > displacementThreshold) {
        orderBlocks.push({
          id: `ob-bullish-${curr.t}`,
          direction: 'bullish',
          range: {
            low: Math.min(curr.l, prev.l),
            high: Math.max(curr.h, prev.h)
          },
          time: curr.t,
          createdBy: 'displacement',
          freshness: {
            isFresh: true,
            touches: 0,
            fillRatio: 0
          }
        });
      }
    }

    // Bearish OB: bullish candle followed by strong bearish displacement
    if (curr.c > curr.o && next.c < next.o) {
      const displacement = ((curr.c - next.c) / curr.c) * 100;
      if (displacement > displacementThreshold) {
        orderBlocks.push({
          id: `ob-bearish-${curr.t}`,
          direction: 'bearish',
          range: {
            low: Math.min(curr.l, next.l),
            high: Math.max(curr.h, next.h)
          },
          time: curr.t,
          createdBy: 'displacement',
          freshness: {
            isFresh: true,
            touches: 0,
            fillRatio: 0
          }
        });
      }
    }
  }

  return orderBlocks;
}

/**
 * Detect Fair Value Gaps (FVG)
 * FVG: Gap between candle bodies (no overlap)
 * Bullish FVG: gap between high of previous and low of next
 * Bearish FVG: gap between low of previous and high of next
 */
export function detectFairValueGaps(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];

  if (candles.length < 3) {
    return fvgs;
  }

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // Bullish FVG: gap between prev high and next low
    if (prev.h < next.l) {
      fvgs.push({
        id: `fvg-bullish-${curr.t}`,
        direction: 'bullish',
        range: {
          low: prev.h,
          high: next.l
        },
        time: curr.t,
        freshness: {
          isFresh: true,
          touches: 0,
          fillRatio: 0
        }
      });
    }

    // Bearish FVG: gap between prev low and next high
    if (prev.l > next.h) {
      fvgs.push({
        id: `fvg-bearish-${curr.t}`,
        direction: 'bearish',
        range: {
          low: next.h,
          high: prev.l
        },
        time: curr.t,
        freshness: {
          isFresh: true,
          touches: 0,
          fillRatio: 0
        }
      });
    }
  }

  return fvgs;
}

/**
 * Update freshness of POIs based on current price action
 */
export function updatePOIFreshness(
  pois: (OrderBlock | FairValueGap)[],
  candles: Candle[]
): void {
  const latestCandle = candles[candles.length - 1];

  for (const poi of pois) {
    let touches = 0;
    let filled = false;

    // Check if price has touched the POI range
    for (const candle of candles.slice(-20)) { // Check last 20 candles
      if (candle.l <= poi.range.high && candle.h >= poi.range.low) {
        touches++;
        // Check if filled (price went through the range)
        if (candle.l < poi.range.low && candle.h > poi.range.high) {
          filled = true;
        }
      }
    }

    poi.freshness.touches = touches;
    poi.freshness.fillRatio = filled ? 1 : Math.min(touches / 3, 1);
    poi.freshness.isFresh = touches === 0;
  }
}
