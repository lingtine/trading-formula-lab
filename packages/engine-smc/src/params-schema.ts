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
    label: 'Độ dài Swing (Fractal)',
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
    label: 'Nhìn lại cấu trúc',
    help: 'Số nến nhìn lại để phân tích cấu trúc.',
    group: 'structure',
  },
  {
    key: 'bosBreakMode',
    type: 'select',
    default: 'close',
    label: 'Chế độ phá BOS',
    help: 'close = đóng cửa vượt (ít nhiễu); wick = wick vượt.',
    group: 'structure',
    options: [
      { value: 'close', label: 'Đóng cửa' },
      { value: 'wick', label: 'Wick' },
    ],
  },
  {
    key: 'chochSensitivity',
    type: 'select',
    default: 'normal',
    label: 'Độ nhạy CHoCH',
    help: 'Bình thường hoặc chặt (ít tín hiệu hơn).',
    group: 'structure',
    options: [
      { value: 'normal', label: 'Bình thường' },
      { value: 'strict', label: 'Chặt' },
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
    label: 'Số lần chạm tối thiểu EQ',
    help: 'Số lần chạm tối thiểu để xác định EQH/EQL.',
    group: 'liquidity',
  },
  {
    key: 'eqToleranceMode',
    type: 'select',
    default: 'atr',
    label: 'Chế độ dung sai EQ',
    help: 'ATR hoặc phần trăm.',
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
    label: 'Dung sai EQ (bội số ATR)',
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
    label: 'Wick tối thiểu Sweep (ATR)',
    help: 'Wick tối thiểu để coi là sweep.',
    group: 'liquidity',
  },
  {
    key: 'sweepCloseRule',
    type: 'select',
    default: 'must_reclaim',
    label: 'Quy tắc đóng Sweep',
    help: 'Bắt buộc thu hồi hoặc thu hồi mềm.',
    group: 'liquidity',
    options: [
      { value: 'must_reclaim', label: 'Bắt buộc thu hồi' },
      { value: 'soft_reclaim', label: 'Thu hồi mềm' },
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
    label: 'Displacement tối thiểu (ATR)',
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
    label: 'Tỷ lệ body tối thiểu',
    help: 'Tỷ lệ body tối thiểu.',
    group: 'displacement',
  },
  {
    key: 'requireDisplacementForOB',
    type: 'boolean',
    default: true,
    label: 'Bắt buộc có Displacement cho OB',
    help: 'Chỉ coi OB khi có displacement đủ mạnh.',
    group: 'displacement',
  },
  // D) POI – Order Block
  {
    key: 'obRangeMode',
    type: 'select',
    default: 'full',
    label: 'Chế độ vùng OB',
    help: 'full = cả wick; body = chỉ body.',
    group: 'poi_ob',
    options: [
      { value: 'full', label: 'Đầy đủ (wick)' },
      { value: 'body', label: 'Chỉ body' },
    ],
  },
  {
    key: 'obLookback',
    type: 'number',
    default: 150,
    min: 50,
    max: 300,
    step: 25,
    label: 'Số nến nhìn lại OB',
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
    label: 'Số lần chạm tối đa để OB còn mới',
    help: 'Số lần chạm tối đa để coi OB còn fresh.',
    group: 'poi_ob',
  },
  {
    key: 'obInvalidationMode',
    type: 'select',
    default: 'wick',
    label: 'Cách vô hiệu hóa OB',
    help: 'Wick hoặc đóng cửa.',
    group: 'poi_ob',
    options: [
      { value: 'wick', label: 'Wick' },
      { value: 'close', label: 'Đóng cửa' },
    ],
  },
  {
    key: 'preferOBNearBOS',
    type: 'boolean',
    default: true,
    label: 'Ưu tiên OB gần BOS',
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
    label: 'Kích thước FVG tối thiểu (ATR)',
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
    label: 'Tỷ lệ lấp tối đa để FVG còn mới',
    help: 'Tỷ lệ fill tối đa để coi FVG còn fresh.',
    group: 'poi_fvg',
  },
  {
    key: 'fvgConsiderPartialFill',
    type: 'boolean',
    default: true,
    label: 'Tính lấp một phần cho FVG',
    help: 'Tính partial fill khi cập nhật freshness.',
    group: 'poi_fvg',
  },
  // F) Premium / Discount
  {
    key: 'pdRangeSource',
    type: 'select',
    default: 'last_swing',
    label: 'Nguồn vùng Premium/Discount',
    help: 'Swing gần nhất | Vùng phiên | Swing khung cao.',
    group: 'premium_discount',
    options: [
      { value: 'last_swing', label: 'Swing gần nhất' },
      { value: 'session_range', label: 'Vùng phiên' },
      { value: 'htf_swing', label: 'Swing khung cao' },
    ],
  },
  {
    key: 'pdMidpoint',
    type: 'number',
    default: 0.5,
    min: 0.5,
    max: 0.618,
    step: 0.01,
    label: 'Điểm giữa PD',
    help: '0.5 cố định hoặc 0.618.',
    group: 'premium_discount',
  },
  {
    key: 'requireDiscountForBuy',
    type: 'boolean',
    default: true,
    label: 'Bắt buộc vùng chiết khấu để mua',
    help: 'Chỉ mua khi giá ở vùng discount.',
    group: 'premium_discount',
  },
  {
    key: 'requirePremiumForSell',
    type: 'boolean',
    default: true,
    label: 'Bắt buộc vùng premium để bán',
    help: 'Chỉ bán khi giá ở vùng premium.',
    group: 'premium_discount',
  },
  // G) Setup Builder
  {
    key: 'requireHTFBias',
    type: 'boolean',
    default: true,
    label: 'Bắt buộc xu hướng khung cao',
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
    label: 'Số yếu tố hội tụ tối thiểu',
    help: 'Số yếu tố hội tụ tối thiểu.',
    group: 'setup',
  },
  {
    key: 'conflictPolicy',
    type: 'select',
    default: 'no_trade',
    label: 'Chính sách xung đột',
    help: 'Không giao dịch hoặc chờ xác nhận.',
    group: 'setup',
    options: [
      { value: 'no_trade', label: 'Không giao dịch' },
      { value: 'wait_confirmation', label: 'Chờ xác nhận' },
    ],
  },
  {
    key: 'minRR',
    type: 'number',
    default: 2.0,
    min: 1.5,
    max: 3.0,
    step: 0.1,
    label: 'R:R tối thiểu',
    help: 'Risk:Reward tối thiểu 1.5–3.0.',
    group: 'setup',
  },
  {
    key: 'tpRule',
    type: 'select',
    default: 'liquidity_first',
    label: 'Quy tắc chốt lời',
    help: 'Ưu tiên thanh khoản hoặc swing.',
    group: 'setup',
    options: [
      { value: 'liquidity_first', label: 'Ưu tiên thanh khoản' },
      { value: 'swing_first', label: 'Ưu tiên swing' },
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
  { id: 'structure', label: 'Cấu trúc thị trường' },
  { id: 'liquidity', label: 'Thanh khoản' },
  { id: 'displacement', label: 'Displacement' },
  { id: 'poi_ob', label: 'POI – Order Block' },
  { id: 'poi_fvg', label: 'POI – FVG' },
  { id: 'premium_discount', label: 'Premium / Chiết khấu' },
  { id: 'setup', label: 'Xây dựng kịch bản' },
];
