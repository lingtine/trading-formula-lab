import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamic import to avoid bundling issues with Node.js modules
export async function POST(request: NextRequest) {
  try {
    // Import SMC engine
    const { SmcEngine } = await import('../../../../../packages/engine-smc/src/smc-engine');

    // Nhận candles từ client
    const body = await request.json();
    const { candles, symbol = 'BTCUSDT', category = 'linear', timeframe = 'M15' } = body;

    if (!candles || !Array.isArray(candles) || candles.length === 0) {
      return NextResponse.json(
        { error: 'Invalid candles data. Expected an array of candles.' },
        { status: 400 }
      );
    }

    // Run SMC engine
    const engine = new SmcEngine({
      symbol,
      category,
      timeframe: timeframe as any
    });

    const result = await engine.process(candles);

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// GET method - deprecated, chỉ để backward compatibility
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Please use POST method and send candles data from client-side. Server-side fetching is blocked by CloudFront.',
      message: 'Fetch candles from browser and POST to this endpoint with { candles, symbol, category, timeframe }'
    },
    { status: 405 }
  );
}
