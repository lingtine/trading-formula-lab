/**
 * SMC Presets: Conservative, Aggressive, Scalping, Swing H1/H4
 */

import { SmcParams } from './params-schema';
import { getDefaultParams } from './params-schema';

export interface PresetDef {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  params: Partial<SmcParams>;
}

export const PRESETS: PresetDef[] = [
  {
    id: 'btc_m15_conservative',
    name: 'BTC Futures M15 – Bảo thủ',
    description: 'Ít tín hiệu, chắc chắn.',
    timeframe: 'M15',
    params: {
      swingLen: 4,
      bosBreakMode: 'close',
      eqToleranceValue: 0.18,
      sweepWickMin: 0.18,
      displacementMin: 1.4,
      obRangeMode: 'full',
      fvgFreshMaxFillRatio: 0.5,
      minConfluenceCount: 2,
      conflictPolicy: 'no_trade',
      minRR: 2.0,
    },
  },
  {
    id: 'btc_m15_aggressive',
    name: 'BTC Futures M15 – Tích cực',
    description: 'Nhiều tín hiệu hơn.',
    timeframe: 'M15',
    params: {
      swingLen: 3,
      bosBreakMode: 'wick',
      eqToleranceValue: 0.25,
      sweepWickMin: 0.12,
      displacementMin: 1.1,
      obRangeMode: 'body',
      fvgFreshMaxFillRatio: 0.7,
      minConfluenceCount: 1,
      conflictPolicy: 'wait_confirmation',
      minRR: 1.6,
    },
  },
  {
    id: 'btc_m5_scalping',
    name: 'BTC Futures M5 – Scalping',
    description: 'Khung M5, nhạy hơn, nhiều tín hiệu.',
    timeframe: 'M5',
    params: {
      swingLen: 2,
      bosBreakMode: 'close',
      structureLookback: 150,
      eqToleranceValue: 0.2,
      sweepWickMin: 0.1,
      displacementMin: 1.0,
      obRangeMode: 'body',
      obLookback: 100,
      fvgMinSize: 0.1,
      fvgFreshMaxFillRatio: 0.65,
      minConfluenceCount: 1,
      conflictPolicy: 'wait_confirmation',
      minRR: 1.5,
    },
  },
  {
    id: 'btc_swing_h1h4',
    name: 'BTC Swing H1/H4',
    description: 'Giao dịch swing, khung H1/H4.',
    timeframe: 'H1',
    params: {
      swingLen: 5,
      structureLookback: 300,
      bosBreakMode: 'close',
      chochSensitivity: 'strict',
      eqToleranceValue: 0.22,
      sweepWickMin: 0.2,
      displacementMin: 1.5,
      obRangeMode: 'full',
      obLookback: 250,
      obFreshMaxTouches: 2,
      fvgFreshMaxFillRatio: 0.5,
      minConfluenceCount: 3,
      conflictPolicy: 'no_trade',
      minRR: 2.5,
    },
  },
];

/** Resolve params: start from default, overlay preset, then custom overrides */
export function resolvePresetParams(
  presetId: string | null,
  customOverrides: Partial<SmcParams> = {}
): SmcParams {
  const base = getDefaultParams();
  const preset = presetId ? PRESETS.find((p) => p.id === presetId) : null;
  if (preset) {
    for (const [k, v] of Object.entries(preset.params)) {
      if (v !== undefined) base[k] = v;
    }
  }
  for (const [k, v] of Object.entries(customOverrides)) {
    if (v !== undefined) base[k] = v;
  }
  return base;
}

export function getPresetById(id: string): PresetDef | undefined {
  return PRESETS.find((p) => p.id === id);
}
