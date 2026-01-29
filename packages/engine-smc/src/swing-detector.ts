/**
 * Swing detection using fractal method (len=3)
 */

import { Candle } from '../../core/src/types';
import { Swing } from './types';

/**
 * Detect swing highs and lows using fractal method
 * A swing high: high[i] > high[i-1] && high[i] > high[i+1] && high[i] > high[i-2] && high[i] > high[i+2]
 * A swing low: low[i] < low[i-1] && low[i] < low[i+1] && low[i] < low[i-2] && low[i] < low[i+2]
 */
export function detectSwings(candles: Candle[], fractalLen: number = 3): Swing[] {
  const swings: Swing[] = [];
  const len = candles.length;

  if (len < fractalLen * 2 + 1) {
    return swings; // Not enough data
  }

  // Check for swing highs and lows
  for (let i = fractalLen; i < len - fractalLen; i++) {
    const candle = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;

    // Check swing high: current high must be higher than neighbors
    for (let j = 1; j <= fractalLen; j++) {
      if (candles[i - j].h >= candle.h || candles[i + j].h >= candle.h) {
        isSwingHigh = false;
        break;
      }
    }

    // Check swing low: current low must be lower than neighbors
    for (let j = 1; j <= fractalLen; j++) {
      if (candles[i - j].l <= candle.l || candles[i + j].l <= candle.l) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingHigh) {
      swings.push({
        index: i,
        time: candle.t,
        price: candle.h,
        type: 'high'
      });
    } else if (isSwingLow) {
      swings.push({
        index: i,
        time: candle.t,
        price: candle.l,
        type: 'low'
      });
    }
  }

  return swings;
}
