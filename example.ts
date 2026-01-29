/**
 * Example usage of SMC Engine
 * Run with: npx ts-node example.ts
 */

import 'dotenv/config';
import { BybitDataProvider } from './packages/data-bybit/src/bybit-provider';
import { SmcEngine } from './packages/engine-smc/src/smc-engine';

async function main() {
  try {
    console.log('Fetching candles from Bybit...');

    // Fetch candles
    const provider = new BybitDataProvider();
    const { candles, symbol, category, timeframe } = await provider.fetchCandles({
      limit: 200
    });

    console.log(`Fetched ${candles.length} candles for ${symbol} (${category}, ${timeframe})`);
    console.log(`First candle: ${new Date(candles[0].t).toISOString()}`);
    console.log(`Last candle: ${new Date(candles[candles.length - 1].t).toISOString()}`);

    // Run SMC analysis
    console.log('\nRunning SMC analysis...');
    const engine = new SmcEngine({
      symbol,
      category,
      timeframe
    });

    const result = await engine.process(candles);

    // Display summary
    console.log('\n=== SMC Analysis Summary ===');
    console.log(`Bias: ${result.summary.bias}`);
    console.log(`Decision: ${result.summary.decision}`);
    console.log(`Confidence: ${result.summary.confidence}%`);
    console.log(`Headline: ${result.summary.headline}`);
    console.log('\nKey Reasons:');
    result.summary.keyReasons.forEach((reason: string, i: number) => {
      console.log(`  ${i + 1}. ${reason}`);
    });

    console.log(`\nSignals: ${result.signals.length}`);
    console.log(`Levels: ${result.levels.length}`);
    console.log(`POIs: ${result.poi.length}`);
    console.log(`Setups: ${result.setups.length}`);

    // Validate output
    const { loadSchema } = await import('./packages/core/src/schema-loader');
    const { validate: validateFn } = loadSchema();
    const isValid = validateFn(result);

    if (isValid) {
      console.log('\n✓ Output validated against schema');
    } else {
      console.log('\n✗ Schema validation failed:');
      console.log(validateFn.errors);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
