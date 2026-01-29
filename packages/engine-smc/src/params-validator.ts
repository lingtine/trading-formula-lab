/**
 * Validation Layer: clamp min/max, reject dangerous config, warnings
 */

import { SmcParams } from './params-schema';
import { PARAM_SCHEMA, getParamSchema } from './params-schema';

export interface ValidationResult {
  params: SmcParams;
  warnings: string[];
  valid: boolean;
}

const DANGEROUS_RANGES: Record<string, { min?: number; max?: number; msg: string }> = {
  swingLen: { min: 2, max: 6, msg: 'swingLen ngoài 2–6 có thể phá logic swing.' },
  structureLookback: { min: 50, max: 500, msg: 'structureLookback quá nhỏ/lớn ảnh hưởng hiệu năng.' },
};

/** Clamp number to schema min/max */
function clampValue(key: string, value: number): number {
  const schema = getParamSchema(key);
  if (!schema || schema.type !== 'number') return value;
  if (schema.min != null && value < schema.min) return schema.min;
  if (schema.max != null && value > schema.max) return schema.max;
  return value;
}

/** Validate and clamp params; collect warnings */
export function validateParams(input: SmcParams): ValidationResult {
  const params: SmcParams = { ...input };
  const warnings: string[] = [];

  for (const item of PARAM_SCHEMA) {
    const raw = params[item.key];
    if (raw === undefined) continue;

    if (item.type === 'number' && typeof raw === 'number') {
      const clamped = clampValue(item.key, raw);
      if (clamped !== raw) {
        warnings.push(`"${item.label}" đã được giới hạn về ${clamped}.`);
      }
      params[item.key] = clamped;
    }

    if (item.type === 'select' && item.options) {
      const valid = item.options.some((o) => o.value === raw);
      if (!valid) {
        params[item.key] = item.default;
        warnings.push(`"${item.label}" không hợp lệ, dùng mặc định: ${item.default}.`);
      }
    }
  }

  // Dangerous config checks
  if (typeof params.swingLen === 'number' && (params.swingLen < 2 || params.swingLen > 6)) {
    params.swingLen = Math.max(2, Math.min(6, params.swingLen));
    warnings.push('swingLen đã được giới hạn 2–6 để tránh lỗi logic.');
  }

  if (params.bosBreakMode === 'wick') {
    warnings.push('BOS Break Mode = wick => dễ nhiễu tín hiệu.');
  }

  return {
    params,
    warnings,
    valid: true,
  };
}

export const SMC_PARAMS_VERSION = 'smc.v1.0';
