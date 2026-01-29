import { NextResponse } from 'next/server';

// Dynamic import to avoid bundling issues with Node.js modules
export async function GET() {
  try {
    // Import providers dynamically
    const { BybitDataProvider } = await import('../../../../../packages/data-bybit/src/bybit-provider');
    const { SmcEngine } = await import('../../../../../packages/engine-smc/src/smc-engine');

    // Load environment variables
    if (typeof process !== 'undefined' && process.env) {
      // Environment variables should be available
    }

    // Fetch candles
    const provider = new BybitDataProvider();
    const { candles } = await provider.fetchCandles({
      limit: 200
    });

    // Run SMC engine
    const engine = new SmcEngine({
      symbol: 'BTCUSDT',
      category: 'linear',
      timeframe: 'M15'
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
