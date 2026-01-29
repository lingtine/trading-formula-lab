/**
 * Main SMC Engine - combines all analysis modules and outputs normalized result
 */

import { Candle, Timeframe } from '../../core/src/types';
import { loadSchema } from '../../core/src/schema-loader';
import { detectSwings } from './swing-detector';
import { analyzeMarketStructure } from './structure-analyzer';
import { detectEquilibriumLevels, detectLiquiditySweeps } from './liquidity-analyzer';
import { detectOrderBlocks, detectFairValueGaps, updatePOIFreshness } from './poi-detector';

// Output types matching schema
export interface SmcOutput {
  engine: {
    name: string;
    version: string;
    school: string;
    generatedAt: string;
  };
  context: {
    symbol: string;
    market: 'spot' | 'futures' | 'perpetual';
    category: 'linear' | 'inverse' | 'spot';
    timeframe: Timeframe;
    tz: string;
    candleSource: string;
    range: {
      from: number;
      to: number;
      limit: number;
    };
  };
  summary: {
    bias: 'bullish' | 'bearish' | 'range' | 'unknown';
    decision: 'BUY' | 'SELL' | 'NO_TRADE' | 'WAIT_CONFIRMATION';
    confidence: number;
    headline: string;
    keyReasons: string[];
  };
  signals: any[];
  levels: any[];
  poi: any[];
  setups: any[];
  diagnostics: {
    params: Record<string, any>;
    scores: {
      components: Array<{ name: string; value: number; notes?: string }>;
      total: number;
    };
    warnings: string[];
    debug?: Record<string, any>;
  };
}

export interface SmcEngineOptions {
  symbol?: string;
  category?: 'linear' | 'inverse' | 'spot';
  timeframe?: Timeframe;
  tz?: string;
}

export class SmcEngine {
  private options: Required<SmcEngineOptions>;

  constructor(options: SmcEngineOptions = {}) {
    this.options = {
      symbol: options.symbol || 'BTCUSDT',
      category: options.category || 'linear',
      timeframe: options.timeframe || 'M15',
      tz: options.tz || 'UTC'
    };
  }

  /**
   * Process candles and generate SMC analysis output
   */
  async process(candles: Candle[]): Promise<SmcOutput> {
    if (candles.length < 10) {
      throw new Error('Insufficient candles for analysis (minimum 10 required)');
    }

    // 1. Detect swings
    const swings = detectSwings(candles, 3);

    // 2. Analyze market structure
    const structure = analyzeMarketStructure(candles, swings);

    // 3. Detect equilibrium levels
    const eqLevels = detectEquilibriumLevels(candles, swings);

    // 4. Detect liquidity sweeps
    const sweeps = detectLiquiditySweeps(candles, swings, eqLevels);

    // 5. Detect POIs
    const orderBlocks = detectOrderBlocks(candles);
    const fvgs = detectFairValueGaps(candles);
    updatePOIFreshness([...orderBlocks, ...fvgs], candles);

    // 6. Generate signals
    const signals = this.generateSignals(candles, swings, structure, sweeps);

    // 7. Generate levels
    const levels = this.generateLevels(eqLevels, sweeps);

    // 8. Generate POI array
    const poi = this.generatePOIArray(orderBlocks, fvgs, structure);

    // 9. Generate setups
    const setups = this.generateSetups(candles, structure, sweeps, orderBlocks, fvgs);

    // 10. Generate summary
    const summary = this.generateSummary(structure, sweeps, orderBlocks, fvgs);

    // 11. Build output
    const output: SmcOutput = {
      engine: {
        name: 'smc-engine',
        version: '0.1.0',
        school: 'SMC',
        generatedAt: new Date().toISOString()
      },
      context: {
        symbol: this.options.symbol,
        market: this.options.category === 'spot' ? 'spot' : 'perpetual',
        category: this.options.category,
        timeframe: this.options.timeframe,
        tz: this.options.tz,
        candleSource: 'bybit-kline',
        range: {
          from: candles[0].t,
          to: candles[candles.length - 1].t,
          limit: candles.length
        }
      },
      summary,
      signals,
      levels,
      poi,
      setups,
      diagnostics: {
        params: {
          fractalLen: 3,
          displacementThreshold: 0.5
        },
        scores: {
          components: [
            { name: 'structure', value: structure.bias !== 'unknown' ? 70 : 30 },
            { name: 'liquidity', value: sweeps.length > 0 ? 60 : 40 },
            { name: 'poi', value: orderBlocks.length + fvgs.length > 0 ? 50 : 30 }
          ],
          total: 60
        },
        warnings: [],
        debug: {
          swingCount: swings.length,
          structureBias: structure.bias
        }
      }
    };

    // 12. Validate output against schema
    const { validate } = loadSchema();
    const valid = validate(output);
    if (!valid && validate.errors) {
      console.warn('Schema validation warnings:', validate.errors);
      const errorMessages = validate.errors.map((e: any) => e.message || e).join(', ');
      (output as SmcOutput).diagnostics.warnings.push(
        `Schema validation issues: ${errorMessages}`
      );
    }

    return output as SmcOutput;
  }

  private generateSignals(
    candles: Candle[],
    swings: any[],
    structure: any,
    sweeps: any[]
  ): any[] {
    const signals: any[] = [];
    const latestCandle = candles[candles.length - 1];

    // BOS signal
    if (structure.lastBOS) {
      signals.push({
        id: `signal-bos-${structure.lastBOS.time}`,
        kind: 'STRUCTURE_BOS',
        direction: structure.lastBOS.direction,
        confidence: 75,
        time: {
          tf: this.options.timeframe,
          t: structure.lastBOS.time
        },
        label: `${structure.lastBOS.direction.toUpperCase()} BOS`,
        reason: `Break of structure at ${structure.lastBOS.price}`,
        anchors: [{
          time: { tf: this.options.timeframe, t: structure.lastBOS.time },
          price: structure.lastBOS.price
        }]
      });
    }

    // CHoCH signal
    if (structure.lastCHoCH) {
      signals.push({
        id: `signal-choch-${structure.lastCHoCH.time}`,
        kind: 'STRUCTURE_CHOCH',
        direction: structure.lastCHoCH.direction,
        confidence: 80,
        time: {
          tf: this.options.timeframe,
          t: structure.lastCHoCH.time
        },
        label: `${structure.lastCHoCH.direction.toUpperCase()} CHoCH`,
        reason: `Change of character at ${structure.lastCHoCH.price}`,
        anchors: [{
          time: { tf: this.options.timeframe, t: structure.lastCHoCH.time },
          price: structure.lastCHoCH.price
        }]
      });
    }

    // Liquidity sweep signals
    sweeps.forEach(sweep => {
      signals.push({
        id: `signal-sweep-${sweep.id}`,
        kind: 'LIQUIDITY_SWEEP',
        direction: sweep.type === 'buy_side' ? 'bullish' : 'bearish',
        confidence: 70,
        time: {
          tf: this.options.timeframe,
          t: sweep.time
        },
        label: `${sweep.type === 'buy_side' ? 'Buy' : 'Sell'} Side Sweep`,
        reason: `Liquidity sweep at ${sweep.price}`,
        anchors: [{
          time: { tf: this.options.timeframe, t: sweep.time },
          price: sweep.price
        }]
      });
    });

    return signals;
  }

  private generateLevels(eqLevels: any[], sweeps: any[]): any[] {
    const levels: any[] = [];

    eqLevels.forEach(level => {
      levels.push({
        id: level.id,
        type: level.type,
        tf: this.options.timeframe,
        range: {
          low: level.price * 0.999,
          high: level.price * 1.001
        },
        strength: level.strength,
        status: 'fresh',
        createdAt: {
          tf: this.options.timeframe,
          t: level.time
        }
      });
    });

    sweeps.forEach(sweep => {
      levels.push({
        id: `level-${sweep.id}`,
        type: sweep.type === 'buy_side' ? 'BUY_SIDE_LIQUIDITY' : 'SELL_SIDE_LIQUIDITY',
        tf: this.options.timeframe,
        range: {
          low: sweep.price * 0.999,
          high: sweep.price * 1.001
        },
        strength: 60,
        status: sweep.confirmed ? 'tested' : 'fresh',
        createdAt: {
          tf: this.options.timeframe,
          t: sweep.time
        }
      });
    });

    return levels;
  }

  private generatePOIArray(orderBlocks: any[], fvgs: any[], structure: any): any[] {
    const poi: any[] = [];

    orderBlocks.forEach(ob => {
      poi.push({
        id: ob.id,
        type: 'OB',
        direction: ob.direction,
        tf: this.options.timeframe,
        range: ob.range,
        freshness: ob.freshness,
        status: ob.freshness.isFresh ? 'active' : 'consumed',
        origin: {
          createdBy: ob.createdBy,
          time: {
            tf: this.options.timeframe,
            t: ob.time
          }
        },
        quality: {
          score: ob.freshness.isFresh ? 80 : 40
        }
      });
    });

    fvgs.forEach(fvg => {
      poi.push({
        id: fvg.id,
        type: 'FVG',
        direction: fvg.direction,
        tf: this.options.timeframe,
        range: fvg.range,
        freshness: fvg.freshness,
        status: fvg.freshness.isFresh ? 'active' : 'consumed',
        origin: {
          createdBy: 'displacement',
          time: {
            tf: this.options.timeframe,
            t: fvg.time
          }
        },
        quality: {
          score: fvg.freshness.isFresh ? 70 : 30
        }
      });
    });

    return poi;
  }

  private generateSetups(
    candles: Candle[],
    structure: any,
    sweeps: any[],
    orderBlocks: any[],
    fvgs: any[]
  ): any[] {
    const setups: any[] = [];
    const latestCandle = candles[candles.length - 1];
    const latestPrice = latestCandle.c;

    // Setup 1: Sweep -> CHoCH -> POI
    if (sweeps.length > 0 && structure.lastCHoCH) {
      const recentSweep = sweeps[sweeps.length - 1];
      const relevantPOI = [...orderBlocks, ...fvgs]
        .filter(p => p.freshness.isFresh && p.direction === structure.lastCHoCH.direction)
        .sort((a, b) => Math.abs(a.range.low - latestPrice) - Math.abs(b.range.low - latestPrice))[0];

      if (relevantPOI) {
        const direction = structure.lastCHoCH.direction === 'bullish' ? 'BUY' : 'SELL';
        const entryZone = relevantPOI.range;
        const stopLoss = direction === 'BUY'
          ? entryZone.low * 0.995
          : entryZone.high * 1.005;
        const target1 = direction === 'BUY'
          ? entryZone.high * 1.02
          : entryZone.low * 0.98;

        setups.push({
          id: `setup-${Date.now()}`,
          name: 'Sweep -> CHoCH -> POI',
          direction,
          status: 'wait',
          timeframe: this.options.timeframe,
          entry: {
            mode: 'limit',
            zone: entryZone,
            trigger: {
              type: 'CHOCH_CONFIRM',
              rules: ['CHoCH confirmed', 'POI fresh']
            },
            validFrom: {
              tf: this.options.timeframe,
              t: latestCandle.t
            }
          },
          risk: {
            stopLoss,
            invalidation: {
              type: direction === 'BUY' ? 'BELOW_OB' : 'ABOVE_OB',
              anchor: {
                time: { tf: this.options.timeframe, t: relevantPOI.time },
                price: stopLoss
              }
            },
            rrMin: 2.0
          },
          targets: [
            {
              type: 'TP',
              price: target1,
              label: 'TP1'
            }
          ],
          confidence: 70,
          reasons: [
            'Liquidity sweep confirmed',
            'CHoCH structure change',
            'Fresh POI available'
          ],
          confluence: {
            poiIds: [relevantPOI.id],
            signalIds: [`signal-choch-${structure.lastCHoCH.time}`, `signal-sweep-${recentSweep.id}`]
          }
        });
      }
    }

    return setups;
  }

  private generateSummary(
    structure: any,
    sweeps: any[],
    orderBlocks: any[],
    fvgs: any[]
  ): SmcOutput['summary'] {
    const bias = structure.bias;
    let decision: 'BUY' | 'SELL' | 'NO_TRADE' | 'WAIT_CONFIRMATION' = 'NO_TRADE';
    let confidence = 50;
    const reasons: string[] = [];

    if (bias === 'bullish') {
      decision = sweeps.length > 0 ? 'BUY' : 'WAIT_CONFIRMATION';
      confidence = 65;
      reasons.push('Bullish market structure');
      if (sweeps.some(s => s.type === 'buy_side')) {
        reasons.push('Buy-side liquidity sweep');
        confidence += 10;
      }
      if (orderBlocks.some(ob => ob.direction === 'bullish' && ob.freshness.isFresh)) {
        reasons.push('Fresh bullish order block');
        confidence += 10;
      }
    } else if (bias === 'bearish') {
      decision = sweeps.length > 0 ? 'SELL' : 'WAIT_CONFIRMATION';
      confidence = 65;
      reasons.push('Bearish market structure');
      if (sweeps.some(s => s.type === 'sell_side')) {
        reasons.push('Sell-side liquidity sweep');
        confidence += 10;
      }
      if (orderBlocks.some(ob => ob.direction === 'bearish' && ob.freshness.isFresh)) {
        reasons.push('Fresh bearish order block');
        confidence += 10;
      }
    } else {
      decision = 'NO_TRADE';
      confidence = 30;
      reasons.push('Unclear market structure');
    }

    const headline = `${bias.toUpperCase()} bias - ${decision}`;

    return {
      bias,
      decision,
      confidence: Math.min(confidence, 100),
      headline,
      keyReasons: reasons.slice(0, 5)
    };
  }
}
