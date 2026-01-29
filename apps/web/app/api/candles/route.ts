import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/candles?symbol=BTCUSDT&tf=15&limit=200
 * Server fetch Bybit /v5/market/kline → trả về candles chuẩn hóa.
 * Lưu ý: Trên Vercel có thể bị CloudFront 403; client có thể fallback fetch trực tiếp Bybit.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const tf = searchParams.get('tf') || '15';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000);

    const category = 'linear';
    const interval = tf;

    const bybitUrl = `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(bybitUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SMC-Chart/1.0)',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: `Bybit API error: ${response.status} ${response.statusText}`,
          details: text.slice(0, 500),
          fallback: 'Fetch candles from client (browser) to avoid CloudFront block.',
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      return NextResponse.json(
        { error: `Bybit API: ${data.retMsg} (code: ${data.retCode})` },
        { status: 500 }
      );
    }

    if (!data.result?.list?.length) {
      return NextResponse.json(
        { error: 'No candles returned from Bybit', candles: [] },
        { status: 200 }
      );
    }

    // Chuẩn hóa: [startTime, open, high, low, close, volume, ...] → { t, o, h, l, c, v }, chronological
    const candles = data.result.list
      .reverse()
      .map((item: string[]) => ({
        t: parseInt(item[0], 10),
        o: parseFloat(item[1]),
        h: parseFloat(item[2]),
        l: parseFloat(item[3]),
        c: parseFloat(item[4]),
        v: parseFloat(item[5]),
      }));

    return NextResponse.json({
      candles,
      symbol,
      category,
      timeframe: `M${tf}`,
    });
  } catch (error: any) {
    console.error('API /api/candles error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candles' },
      { status: 500 }
    );
  }
}
