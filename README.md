# Trading Formula Lab (SMC-first)

A modular trading analysis platform where each "school" (SMC, PA, Indicators, Wyckoff...) is implemented as a plug-in engine that consumes OHLCV and outputs normalized `signals / levels / poi / setups`.

This repository starts with **SMC engine for BTCUSDT Perpetual (Bybit) on M15**.

---

## Goals

- Fetch candles from **Bybit V5** (REST), optional realtime via WebSocket
- Run **SMC engine** to generate:
  - Market structure (BOS / CHoCH)
  - Liquidity (EQH / EQL / Sweep)
  - POIs (Order Block / FVG)
  - Trade plans (entry/SL/TP) as `setups`
- Provide a normalized output schema so new schools can be added later

---

## Project Structure

```
multi-schools-engine/
├── apps/
│   └── web/              # Next.js web UI
├── packages/
│   ├── core/             # Shared schemas and utilities
│   │   └── schemas/
│   │       └── smc-output.schema.json
│   ├── data-bybit/       # Bybit data provider (REST + WebSocket)
│   └── engine-smc/       # SMC analysis engine
├── .env                  # Environment variables
├── package.json          # Root workspace config
└── npm-workspace.yaml    # pnpm workspace config
```

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm (install: `npm install -g pnpm`)

### Installation

1. **Install dependencies:**

```bash
pnpm install
```

2. **Configure environment:**
   The `.env` file is already created with default values:

```env
BYBIT_REST_BASE=https://api.bybit.com
SYMBOL=BTCUSDT
CATEGORY=linear
TF=15
LIMIT=200
```

### Development Scripts

```bash
# Start web UI
pnpm dev:web

# Type checking
pnpm typecheck

# Lint (placeholder)
pnpm lint
```

---

## Bybit Data Integration

### REST API

- Endpoint: `GET /v5/market/kline` for historical candles
- Public endpoints do not require API keys
- Normalize output to: `{t, o, h, l, c, v}` format

### WebSocket (Realtime)

- Topic: `kline.15.BTCUSDT`
- Only finalize signals when `confirm=true` on WebSocket messages

---

## Usage

### Run Example Script

```bash
# Install dependencies first
pnpm install

# Run example
npx ts-node example.ts
```

### Start Web UI

```bash
pnpm dev:web
```

Then open http://localhost:3000 in your browser.

### Use in Your Code

```typescript
import { BybitDataProvider } from "@trading-formula-lab/data-bybit";
import { SmcEngine } from "@trading-formula-lab/engine-smc";

// Fetch candles
const provider = new BybitDataProvider();
const { candles } = await provider.fetchCandles({ limit: 200 });

// Run analysis
const engine = new SmcEngine({
  symbol: "BTCUSDT",
  category: "linear",
  timeframe: "M15",
});

const result = await engine.process(candles);
console.log(result.summary);
```

## Implementation Status

✅ **packages/data-bybit**:

- Fetch candles from Bybit REST API
- Normalize to `{t, o, h, l, c, v}` format
- ⏳ WebSocket realtime updates (planned)

✅ **packages/engine-smc**:

- Compute swings → structure → liquidity → POI → setups
- Validate output using AJV against schema
- Swing detection (fractal len=3)
- BOS / CHoCH detection
- EQH / EQL levels
- Liquidity sweep detection
- FVG and Order Block detection
- Setup generation

✅ **apps/web**:

- Next.js UI with tabs:
  - **Bias** - Market bias summary
  - **Liquidity** - EQH/EQL/Sweep levels
  - **POI** - Order Blocks and FVGs
  - **Setups** - Trade plans with entry/SL/TP

---

## Architecture
