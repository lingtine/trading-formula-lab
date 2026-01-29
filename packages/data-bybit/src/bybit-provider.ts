/**
 * Bybit REST API provider for fetching candles
 */

import { Candle, Timeframe } from '../../core/src/types';
import { BybitKlineParams, BybitKlineResponse, FetchCandlesOptions, NormalizedCandlesResult } from './types';
import * as https from 'https';
import * as http from 'http';

// Convert Timeframe to Bybit interval format
function timeframeToBybitInterval(tf: Timeframe): string {
  const mapping: Record<Timeframe, string> = {
    'M1': '1',
    'M3': '3',
    'M5': '5',
    'M15': '15',
    'M30': '30',
    'H1': '60',
    'H2': '120',
    'H4': '240',
    'H6': '360',
    'H12': '720',
    'D1': 'D',
    'W1': 'W'
  };
  return mapping[tf];
}

// Normalize Bybit kline array to Candle format
function normalizeKlineItem(item: string[]): Candle {
  return {
    t: parseInt(item[0], 10), // startTime (epoch ms)
    o: parseFloat(item[1]),   // openPrice
    h: parseFloat(item[2]),   // highPrice
    l: parseFloat(item[3]),   // lowPrice
    c: parseFloat(item[4]),   // closePrice
    v: parseFloat(item[5])    // volume
  };
}

export class BybitDataProvider {
  private baseUrl: string;
  private useProxy: boolean;
  private proxyUrl?: string;

  constructor(
    baseUrl: string = process.env.BYBIT_REST_BASE || 'https://api.bybit.com',
    useProxy: boolean = false,
    proxyUrl?: string
  ) {
    this.baseUrl = baseUrl;
    this.useProxy = useProxy;
    this.proxyUrl = proxyUrl;
  }

  /**
   * Fetch kline data from Bybit REST API
   * Nếu useProxy = true, sẽ gọi qua proxy route thay vì trực tiếp
   */
  async fetchKlines(params: BybitKlineParams): Promise<BybitKlineResponse> {
    const queryParams = new URLSearchParams({
      category: params.category,
      symbol: params.symbol,
      interval: params.interval,
      ...(params.start && { start: params.start.toString() }),
      ...(params.end && { end: params.end.toString() }),
      ...(params.limit && { limit: params.limit.toString() })
    });

    // Nếu dùng proxy, gọi qua proxy route
    if (this.useProxy && this.proxyUrl) {
      const proxyUrl = `${this.proxyUrl}?${queryParams.toString()}`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Proxy error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as BybitKlineResponse;
      if (data.retCode !== 0) {
        throw new Error(`Bybit API error: ${data.retMsg} (code: ${data.retCode})`);
      }
      return data;
    }

    // Direct call to Bybit API
    const url = `${this.baseUrl}/v5/market/kline?${queryParams.toString()}`;

    // Use fetch if available (Node 18+), otherwise use https module
    let data: BybitKlineResponse;

    if (typeof fetch !== 'undefined') {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore if can't read body
        }
        throw new Error(`Bybit API error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
      }

      data = await response.json() as BybitKlineResponse;
    } else {
      // Fallback for older Node.js versions
      data = await new Promise<BybitKlineResponse>((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        };

        const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Bybit API error: ${res.statusCode} ${res.statusMessage} - ${body}`));
              return;
            }
            try {
              const parsed = JSON.parse(body) as BybitKlineResponse;
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : String(e)} - Body: ${body}`));
            }
          });
        });

        req.on('error', reject);
        req.end();
      });
    }

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg} (code: ${data.retCode})`);
    }

    return data;
  }

  /**
   * Fetch candles and normalize to {t,o,h,l,c,v} format
   */
  async fetchCandles(options: FetchCandlesOptions = {}): Promise<NormalizedCandlesResult> {
    const symbol = options.symbol || process.env.SYMBOL || 'BTCUSDT';
    const category = options.category || (process.env.CATEGORY as any) || 'linear';

    // Handle timeframe: if env.TF is just a number (e.g., "15"), convert to "M15"
    let timeframe: Timeframe = options.timeframe || 'M15';
    if (!options.timeframe && process.env.TF) {
      const tfEnv = process.env.TF;
      if (/^\d+$/.test(tfEnv)) {
        timeframe = `M${tfEnv}` as Timeframe;
      } else {
        timeframe = tfEnv as Timeframe;
      }
    }

    const limit = options.limit || parseInt(process.env.LIMIT || '200', 10);

    const bybitInterval = timeframeToBybitInterval(timeframe);
    if (!bybitInterval) {
      throw new Error(`Invalid timeframe: ${timeframe}. Supported: M1, M3, M5, M15, M30, H1, H2, H4, H6, H12, D1, W1`);
    }

    const params: BybitKlineParams = {
      category,
      symbol,
      interval: bybitInterval,
      limit,
      ...(options.start && { start: options.start }),
      ...(options.end && { end: options.end })
    };

    const response = await this.fetchKlines(params);

    if (!response.result || !response.result.list || response.result.list.length === 0) {
      throw new Error(`No candles returned from Bybit API. Response: ${JSON.stringify(response)}`);
    }

    // Normalize candles (reverse order - Bybit returns newest first)
    const candles: Candle[] = response.result.list
      .reverse() // Reverse to get chronological order (oldest first)
      .map(normalizeKlineItem);

    return {
      candles,
      symbol,
      category,
      timeframe
    };
  }
}
