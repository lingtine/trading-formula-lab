/**
 * Market structure analysis: BOS (Break of Structure) and CHoCH (Change of Character)
 */

import { Candle } from '../../core/src/types';
import { Swing, MarketStructure } from './types';

/**
 * Detect BOS (Break of Structure)
 * Bullish BOS: price breaks above previous swing high
 * Bearish BOS: price breaks below previous swing low
 */
export function detectBOS(
  candles: Candle[],
  swings: Swing[],
  currentIndex: number
): { type: 'bullish' | 'bearish' | null; swingIndex: number } | null {
  if (swings.length < 2 || currentIndex < 2) {
    return null;
  }

  const currentCandle = candles[currentIndex];

  // Find previous swing high
  const prevSwingHigh = swings
    .filter(s => s.type === 'high' && s.index < currentIndex)
    .sort((a, b) => b.index - a.index)[0];

  // Find previous swing low
  const prevSwingLow = swings
    .filter(s => s.type === 'low' && s.index < currentIndex)
    .sort((a, b) => b.index - a.index)[0];

  // Check for bullish BOS (break above swing high)
  if (prevSwingHigh && currentCandle.h > prevSwingHigh.price) {
    return {
      type: 'bullish',
      swingIndex: prevSwingHigh.index
    };
  }

  // Check for bearish BOS (break below swing low)
  if (prevSwingLow && currentCandle.l < prevSwingLow.price) {
    return {
      type: 'bearish',
      swingIndex: prevSwingLow.index
    };
  }

  return null;
}

/**
 * Detect CHoCH (Change of Character)
 * Bullish CHoCH: price breaks above previous swing high after a downtrend
 * Bearish CHoCH: price breaks below previous swing low after an uptrend
 */
export function detectCHoCH(
  candles: Candle[],
  swings: Swing[],
  currentIndex: number,
  lastBOS?: { type: 'bullish' | 'bearish'; index: number }
): { type: 'bullish' | 'bearish'; swingIndex: number } | null {
  if (!lastBOS || swings.length < 2 || currentIndex < 2) {
    return null;
  }

  const currentCandle = candles[currentIndex];

  // After bearish BOS, bullish CHoCH occurs when price breaks above a swing high
  if (lastBOS.type === 'bearish') {
    const prevSwingHigh = swings
      .filter(s => s.type === 'high' && s.index < currentIndex && s.index > lastBOS.index)
      .sort((a, b) => b.index - a.index)[0];

    if (prevSwingHigh && currentCandle.h > prevSwingHigh.price) {
      return {
        type: 'bullish',
        swingIndex: prevSwingHigh.index
      };
    }
  }

  // After bullish BOS, bearish CHoCH occurs when price breaks below a swing low
  if (lastBOS.type === 'bullish') {
    const prevSwingLow = swings
      .filter(s => s.type === 'low' && s.index < currentIndex && s.index > lastBOS.index)
      .sort((a, b) => b.index - a.index)[0];

    if (prevSwingLow && currentCandle.l < prevSwingLow.price) {
      return {
        type: 'bearish',
        swingIndex: prevSwingLow.index
      };
    }
  }

  return null;
}

/**
 * Analyze market structure from candles and swings
 */
export function analyzeMarketStructure(
  candles: Candle[],
  swings: Swing[]
): MarketStructure {
  let lastBOS: { type: 'bullish' | 'bearish'; index: number } | undefined;
  let lastCHoCH: { type: 'bullish' | 'bearish'; index: number } | undefined;
  let bias: 'bullish' | 'bearish' | 'range' | 'unknown' = 'unknown';

  // Analyze structure from latest to oldest
  for (let i = candles.length - 1; i >= 0; i--) {
    // Check for CHoCH first (more significant)
    const choch = detectCHoCH(candles, swings, i, lastBOS);
    if (choch) {
      lastCHoCH = {
        type: choch.type,
        index: choch.swingIndex
      };
      bias = choch.type === 'bullish' ? 'bullish' : 'bearish';
      break;
    }

    // Check for BOS
    const bos = detectBOS(candles, swings, i);
    if (bos && bos.type) {
      lastBOS = {
        type: bos.type,
        index: bos.swingIndex
      };
      if (!lastCHoCH) {
        bias = bos.type === 'bullish' ? 'bullish' : 'bearish';
      }
    }
  }

  return {
    bias,
    lastBOS: lastBOS ? {
      index: lastBOS.index,
      time: candles[lastBOS.index].t,
      price: lastBOS.type === 'bullish' ? candles[lastBOS.index].h : candles[lastBOS.index].l,
      direction: lastBOS.type
    } : undefined,
    lastCHoCH: lastCHoCH ? {
      index: lastCHoCH.index,
      time: candles[lastCHoCH.index].t,
      price: lastCHoCH.type === 'bullish' ? candles[lastCHoCH.index].h : candles[lastCHoCH.index].l,
      direction: lastCHoCH.type
    } : undefined
  };
}
