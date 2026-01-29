import { NextResponse } from 'next/server';

// Force dynamic rendering - route sử dụng request.url
export const dynamic = 'force-dynamic';

/**
 * Proxy route để fetch candles từ Bybit API
 * Tránh bị chặn IP từ Vercel server
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'linear';
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const interval = searchParams.get('interval') || '15';
    const limit = searchParams.get('limit') || '200';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Build query params
    const queryParams = new URLSearchParams({
      category,
      symbol,
      interval,
      limit
    });
    if (start) queryParams.set('start', start);
    if (end) queryParams.set('end', end);

    const bybitUrl = `https://api.bybit.com/v5/market/kline?${queryParams.toString()}`;

    // Fetch từ Bybit với headers đầy đủ
    const response = await fetch(bybitUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.bybit.com/',
        'Origin': 'https://www.bybit.com'
      }
      // Cache được xử lý qua Cache-Control headers trong response
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bybit API error:', response.status, errorText);
      return NextResponse.json(
        {
          error: `Bybit API error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Kiểm tra retCode từ Bybit
    if (data.retCode !== 0) {
      return NextResponse.json(
        {
          error: `Bybit API error: ${data.retMsg} (code: ${data.retCode})`
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch from Bybit',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}
