import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/setup → schema + presets for Setup UI
 */
export async function GET() {
  try {
    const { PARAM_SCHEMA, PARAM_GROUPS, getDefaultParams } = await import(
      '../../../../../packages/engine-smc/src/params-schema'
    );
    const { PRESETS } = await import('../../../../../packages/engine-smc/src/presets');

    const defaultParams = getDefaultParams();

    return NextResponse.json({
      schema: PARAM_SCHEMA,
      groups: PARAM_GROUPS,
      presets: PRESETS,
      defaultParams,
    });
  } catch (error: any) {
    console.error('API /api/setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load setup' },
      { status: 500 }
    );
  }
}
