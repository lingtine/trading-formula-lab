/**
 * SMC Param Schema: type, min/max, default, label, help for UI auto-render
 */

export type ParamType = 'number' | 'select' | 'boolean';

export interface ParamSchemaItem {
  key: string;
  type: ParamType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  help: string;
  group: string;
  options?: { value: string; label: string }[];
}

export const PARAM_SCHEMA: ParamSchemaItem[] = [
  // A) Market Structure
  {
    key: 'swingLen',
    type: 'number',
    default: 3,
    min: 2,
    max: 6,
    step: 1,
    label: 'Swing Length (Fractal)',
    help: 'Nhỏ => nhạy; lớn => chắc. BTC M15 khuyến nghị 3.',
    group: 'structure',
  },
  {
    key: 'structureLookback',
    type: 'number',
    default: 200,
    min: 100,
    max: 500,
    step: 50,
    label: 'Structure Lookback',
    help: 'Số nến nhìn lại để phân tích cấu trúc.',
    group: 'structure',
  },
  {
    key: 'bosBreakMode',
    type: 'select',
    default: 'close',
    label: 'BOS Break Mode',
    help: 'close = đóng cửa vượt (ít nhiễu); wick = wick vượt.',
    group: 'structure',
    options: [
      { value: 'close', label: 'Close' },
      { value: 'wick', label: 'Wick' },
    ],
  },
  {
    key: 'chochSensitivity',
    type: 'select',
    default: 'normal',
    label: 'CHoCH Sensitivity',
    help: 'normal hoặc strict (ít tín hiệu hơn).',
    group: 'structure',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'strict', label: 'Strict' },
    ],
  },
  // B) Liquidity
  {
    key: 'eqMinTouches',
    type: 'number',
    default: 2,
    min: 2,
    max: 4,
    step: 1,
    label: 'EQ Min Touches',
    help: 'Số lần chạm tối thiểu để xác định EQH/EQL.',
    group: 'liquidity',
  },
  {
    key: 'eqToleranceMode',
    type: 'select',
    default: 'atr',
    label: 'EQ Tolerance Mode',
    help: 'atr hoặc percent.',
    group: 'liquidity',
    options: [
      { value: 'atr', label: 'ATR' },
      { value: 'percent', label: '%' },
    ],
  },
  {
    key: 'eqToleranceValue',
    type: 'number',
    default: 0.18,
    min: 0.1,
    max: 0.4,
    step: 0.02,
    label: 'EQ Tolerance (ATR mult)',
    help: 'ATR: 0.10–0.40; %: 0.02–0.20.',
    group: 'liquidity',
  },
  {
    key: 'sweepWickMin',
    type: 'number',
    default: 0.15,
    min: 0.05,
    max: 0.3,
    step: 0.01,
    label: 'Sweep Wick Min (ATR)',
    help: 'Wick tối thiểu để coi là sweep.',
    group: 'liquidity',
  },
  {
    key: 'sweepCloseRule',
    type: 'select',
    default: 'must_reclaim',
    label: 'Sweep Close Rule',
    help: 'must_reclaim hoặc soft_reclaim.',
    group: 'liquidity',
    options: [
      { value: 'must_reclaim', label: 'Must Reclaim' },
      { value: 'soft_reclaim', label: 'Soft Reclaim' },
    ],
  },
  // C) Displacement
  {
    key: 'displacementMin',
    type: 'number',
    default: 1.2,
    min: 0.8,
    max: 2.0,
    step: 0.1,
    label: 'Displacement Min (ATR)',
    help: '0.8–2.0 * ATR.',
    group: 'displacement',
  },
  {
    key: 'bodyRatioMin',
    type: 'number',
    default: 0.5,
    min: 0.45,
    max: 0.75,
    step: 0.05,
    label: 'Body Ratio Min',
    help: 'Tỷ lệ body tối thiểu.',
    group: 'displacement',
  },
  {
    key: 'requireDisplacementForOB',
    type: 'boolean',
    default: true,
    label: 'Require Displacement for OB',
    help: 'Chỉ coi OB khi có displacement đủ mạnh.',
    group: 'displacement',
  },
  // D) POI – Order Block
  {
    key: 'obRangeMode',
    type: 'select',
    default: 'full',
    label: 'OB Range Mode',
    help: 'full = cả wick; body = chỉ body.',
    group: 'poi_ob',
    options: [
      { value: 'full', label: 'Full' },
      { value: 'body', label: 'Body' },
    ],
  },
  {
    key: 'obLookback',
    type: 'number',
    default: 150,
    min: 50,
    max: 300,
    step: 25,
    label: 'OB Lookback',
    help: 'Số nến nhìn lại để tìm OB.',
    group: 'poi_ob',
  },
  {
    key: 'obFreshMaxTouches',
    type: 'number',
    default: 1,
    min: 0,
    max: 2,
    step: 1,
    label: 'OB Fresh Max Touches',
    help: 'Số lần chạm tối đa để coi OB còn fresh.',
    group: 'poi_ob',
  },
  {
    key: 'obInvalidationMode',
    type: 'select',
    default: 'wick',
    label: 'OB Invalidation',
    help: 'wick hoặc close.',
    group: 'poi_ob',
    options: [
      { value: 'wick', label: 'Wick' },
      { value: 'close', label: 'Close' },
    ],
  },
  {
    key: 'preferOBNearBOS',
    type: 'boolean',
    default: true,
    label: 'Prefer OB Near BOS',
    help: 'Ưu tiên OB gần điểm BOS.',
    group: 'poi_ob',
  },
  // E) POI – FVG
  {
    key: 'fvgMinSize',
    type: 'number',
    default: 0.15,
    min: 0.05,
    max: 0.3,
    step: 0.01,
    label: 'FVG Min Size (ATR)',
    help: '0.05–0.30 * ATR.',
    group: 'poi_fvg',
  },
  {
    key: 'fvgFreshMaxFillRatio',
    type: 'number',
    default: 0.6,
    min: 0.3,
    max: 0.8,
    step: 0.05,
    label: 'FVG Fresh Max Fill',
    help: 'Tỷ lệ fill tối đa để coi FVG còn fresh.',
    group: 'poi_fvg',
  },
  {
    key: 'fvgConsiderPartialFill',
    type: 'boolean',
    default: true,
    label: 'FVG Consider Partial Fill',
    help: 'Tính partial fill khi cập nhật freshness.',
    group: 'poi_fvg',
  },
  // F) Premium / Discount
  {
    key: 'pdRangeSource',
    type: 'select',
    default: 'last_swing',
    label: 'PD Range Source',
    help: 'last_swing | session_range | htf_swing.',
    group: 'premium_discount',
    options: [
      { value: 'last_swing', label: 'Last Swing' },
      { value: 'session_range', label: 'Session Range' },
      { value: 'htf_swing', label: 'HTF Swing' },
    ],
  },
  {
    key: 'pdMidpoint',
    type: 'number',
    default: 0.5,
    min: 0.5,
    max: 0.618,
    step: 0.01,
    label: 'PD Midpoint',
    help: '0.5 cố định hoặc 0.618.',
    group: 'premium_discount',
  },
  {
    key: 'requireDiscountForBuy',
    type: 'boolean',
    default: true,
    label: 'Require Discount for Buy',
    help: 'Chỉ mua khi giá ở vùng discount.',
    group: 'premium_discount',
  },
  {
    key: 'requirePremiumForSell',
    type: 'boolean',
    default: true,
    label: 'Require Premium for Sell',
    help: 'Chỉ bán khi giá ở vùng premium.',
    group: 'premium_discount',
  },
  // G) Setup Builder
  {
    key: 'requireHTFBias',
    type: 'boolean',
    default: true,
    label: 'Require HTF Bias',
    help: 'Cần bias khung cao hơn.',
    group: 'setup',
  },
  {
    key: 'minConfluenceCount',
    type: 'number',
    default: 2,
    min: 1,
    max: 4,
    step: 1,
    label: 'Min Confluence Count',
    help: 'Số yếu tố hội tụ tối thiểu.',
    group: 'setup',
  },
  {
    key: 'conflictPolicy',
    type: 'select',
    default: 'no_trade',
    label: 'Conflict Policy',
    help: 'no_trade hoặc wait_confirmation.',
    group: 'setup',
    options: [
      { value: 'no_trade', label: 'No Trade' },
      { value: 'wait_confirmation', label: 'Wait Confirmation' },
    ],
  },
  {
    key: 'minRR',
    type: 'number',
    default: 2.0,
    min: 1.5,
    max: 3.0,
    step: 0.1,
    label: 'Min R:R',
    help: 'Risk:Reward tối thiểu 1.5–3.0.',
    group: 'setup',
  },
  {
    key: 'tpRule',
    type: 'select',
    default: 'liquidity_first',
    label: 'TP Rule',
    help: 'liquidity_first hoặc swing_first.',
    group: 'setup',
    options: [
      { value: 'liquidity_first', label: 'Liquidity First' },
      { value: 'swing_first', label: 'Swing First' },
    ],
  },
];

/** Resolved params type (all keys from schema) */
export type SmcParams = Record<string, number | string | boolean>;

/** Build default params from schema */
export function getDefaultParams(): SmcParams {
  const out: SmcParams = {};
  for (const item of PARAM_SCHEMA) {
    out[item.key] = item.default;
  }
  return out;
}

/** Get schema by key */
export function getParamSchema(key: string): ParamSchemaItem | undefined {
  return PARAM_SCHEMA.find((p) => p.key === key);
}

/** Get schema by group */
export function getParamSchemaByGroup(group: string): ParamSchemaItem[] {
  return PARAM_SCHEMA.filter((p) => p.group === group);
}

export const PARAM_GROUPS: { id: string; label: string }[] = [
  { id: 'structure', label: 'Market Structure' },
  { id: 'liquidity', label: 'Liquidity' },
  { id: 'displacement', label: 'Displacement' },
  { id: 'poi_ob', label: 'POI – Order Block' },
  { id: 'poi_fvg', label: 'POI – FVG' },
  { id: 'premium_discount', label: 'Premium / Discount' },
  { id: 'setup', label: 'Setup Builder' },
];
