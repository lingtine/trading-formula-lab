import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - route sử dụng request headers
export const dynamic = 'force-dynamic';

// Dynamic import to avoid bundling issues with Node.js modules
export async function GET(request: NextRequest) {
  try {
    // Import providers dynamically
    const { BybitDataProvider } = await import('../../../../../packages/data-bybit/src/bybit-provider');
    const { SmcEngine } = await import('../../../../../packages/engine-smc/src/smc-engine');

    // Load environment variables
    if (typeof process !== 'undefined' && process.env) {
      // Environment variables should be available
    }

    // Fetch candles - dùng proxy nếu đang ở Vercel để tránh bị chặn IP
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    let proxyUrl: string | undefined;

    if (isVercel) {
      // Lấy URL từ request headers hoặc env
      const host = request.headers.get('host') || process.env.VERCEL_URL;
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      if (host) {
        proxyUrl = `${protocol}://${host}/api/bybit-proxy`;
      }
    }

    // Thử fetch candles với fallback: proxy -> direct
    let candles;
    let provider = new BybitDataProvider(
      undefined, // baseUrl - dùng default
      !!proxyUrl, // useProxy
      proxyUrl // proxyUrl
    );

    try {
      const result = await provider.fetchCandles({
        limit: 200
      });
      candles = result.candles;
    } catch (proxyError: any) {
      // Nếu proxy fail và đang dùng proxy, thử direct call
      if (proxyUrl && (proxyError.message?.includes('403') || proxyError.message?.includes('Forbidden'))) {
        console.warn('Proxy failed, trying direct call:', proxyError.message);
        provider = new BybitDataProvider(); // Direct call, không dùng proxy
        const result = await provider.fetchCandles({
          limit: 200
        });
        candles = result.candles;
      } else {
        throw proxyError;
      }
    }

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
