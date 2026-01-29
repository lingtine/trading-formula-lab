export const translations = {
  // Common
  common: {
    loading: 'Đang tải phân tích SMC...',
    error: 'Lỗi',
    retry: 'Thử lại',
    noData: 'Không có dữ liệu',
    close: 'Đóng',
    help: 'Hướng dẫn',
    realtime: 'Realtime',
    refresh: 'Refresh',
    lastUpdate: 'Cập nhật lần cuối',
  },

  // Tabs
  tabs: {
    bias: 'Bias',
    liquidity: 'Liquidity',
    poi: 'POI',
    setups: 'Setups',
    method: 'Phương pháp',
    chart: 'Chart',
  },

  // Bias Tab
  bias: {
    title: 'Market Bias',
    decision: 'Quyết định',
    confidence: 'Độ tin cậy',
    keyReasons: 'Lý do chính',
    biasTypes: {
      bullish: 'TĂNG',
      bearish: 'GIẢM',
      range: 'ĐI NGANG',
      unknown: 'KHÔNG RÕ',
    },
    decisions: {
      BUY: 'MUA',
      SELL: 'BÁN',
      NO_TRADE: 'KHÔNG GIAO DỊCH',
      WAIT_CONFIRMATION: 'CHỜ XÁC NHẬN',
    },
    help: {
      title: 'Hướng dẫn: Market Bias',
      content: `
        <h3>Market Bias là gì?</h3>
        <p>Market Bias cho biết xu hướng chung của thị trường dựa trên phân tích cấu trúc (BOS/CHoCH).</p>
        
        <h3>Các loại Bias:</h3>
        <ul>
          <li><strong>Bullish (Tăng):</strong> Thị trường có xu hướng tăng, BOS bullish hoặc CHoCH bullish</li>
          <li><strong>Bearish (Giảm):</strong> Thị trường có xu hướng giảm, BOS bearish hoặc CHoCH bearish</li>
          <li><strong>Range (Đi ngang):</strong> Thị trường đang trong phạm vi, không có xu hướng rõ ràng</li>
          <li><strong>Unknown (Không rõ):</strong> Chưa đủ dữ liệu để xác định xu hướng</li>
        </ul>
        
        <h3>Decision (Quyết định):</h3>
        <ul>
          <li><strong>BUY:</strong> Nên mua khi bias bullish và có liquidity sweep</li>
          <li><strong>SELL:</strong> Nên bán khi bias bearish và có liquidity sweep</li>
          <li><strong>WAIT_CONFIRMATION:</strong> Chờ thêm tín hiệu xác nhận</li>
          <li><strong>NO_TRADE:</strong> Không nên giao dịch trong điều kiện hiện tại</li>
        </ul>
        
        <h3>Confidence (Độ tin cậy):</h3>
        <p>Độ tin cậy từ 0-100%, càng cao càng đáng tin cậy. Dựa trên số lượng tín hiệu và chất lượng POI.</p>
      `,
    },
  },

  // Liquidity Tab
  liquidity: {
    title: 'Equilibrium Levels',
    sweeps: 'Liquidity Sweeps',
    noLevels: 'Không có equilibrium levels được phát hiện',
    noSweeps: 'Không có liquidity sweeps được phát hiện',
    status: {
      fresh: 'Mới',
      tested: 'Đã test',
      broken: 'Đã phá vỡ',
      invalid: 'Không hợp lệ',
    },
    types: {
      EQH: 'Equilibrium High',
      EQL: 'Equilibrium Low',
      BUY_SIDE_LIQUIDITY: 'Buy Side Liquidity',
      SELL_SIDE_LIQUIDITY: 'Sell Side Liquidity',
    },
    help: {
      title: 'Hướng dẫn: Liquidity Analysis',
      content: `
        <h3>Equilibrium Levels (EQH/EQL) là gì?</h3>
        <p>EQH (Equilibrium High) và EQL (Equilibrium Low) là các mức giá quan trọng nơi giá đã tích lũy và có thể đóng vai trò là hỗ trợ/kháng cự.</p>
        
        <h3>Liquidity Sweeps:</h3>
        <ul>
          <li><strong>Buy-side Sweep:</strong> Giá tạo wick dưới EQL rồi đóng lại trên EQL - cho thấy liquidity đã bị "sweep"</li>
          <li><strong>Sell-side Sweep:</strong> Giá tạo wick trên EQH rồi đóng lại dưới EQH - cho thấy liquidity đã bị "sweep"</li>
        </ul>
        
        <h3>Ý nghĩa:</h3>
        <p>Khi liquidity bị sweep, thường sẽ có một động thái giá mạnh theo hướng ngược lại. Đây là cơ hội giao dịch tốt.</p>
        
        <h3>Status:</h3>
        <ul>
          <li><strong>Fresh:</strong> Level chưa bị test, vẫn còn hiệu lực</li>
          <li><strong>Tested:</strong> Level đã bị test một lần, vẫn có thể hoạt động</li>
          <li><strong>Broken:</strong> Level đã bị phá vỡ, không còn hiệu lực</li>
        </ul>
      `,
    },
  },

  // POI Tab
  poi: {
    title: 'Points of Interest',
    count: 'POIs',
    noPoi: 'Không có POIs được phát hiện',
    types: {
      OB: 'Order Block',
      FVG: 'Fair Value Gap',
      BREAKER: 'Breaker Block',
      MITIGATION: 'Mitigation Block',
    },
    directions: {
      bullish: 'Tăng',
      bearish: 'Giảm',
    },
    freshness: {
      fresh: 'Mới',
      consumed: 'Đã sử dụng',
    },
    touches: 'Lần chạm',
    fillRatio: 'Tỷ lệ lấp đầy',
    help: {
      title: 'Hướng dẫn: Points of Interest (POI)',
      content: `
        <h3>POI là gì?</h3>
        <p>Points of Interest (POI) là các vùng giá quan trọng nơi các nhà giao dịch lớn (Smart Money) có thể đặt lệnh.</p>
        
        <h3>Order Block (OB):</h3>
        <p>Là cây nến cuối cùng trước một động thái giá mạnh (displacement). OB bullish là cây nến giảm cuối cùng trước khi giá tăng mạnh. OB bearish là cây nến tăng cuối cùng trước khi giá giảm mạnh.</p>
        
        <h3>Fair Value Gap (FVG):</h3>
        <p>Là khoảng trống giữa các cây nến, nơi không có giao dịch nào xảy ra. FVG thường được "lấp đầy" sau đó.</p>
        
        <h3>Freshness (Độ mới):</h3>
        <ul>
          <li><strong>Fresh:</strong> POI chưa bị chạm, vẫn còn hiệu lực cao</li>
          <li><strong>Consumed:</strong> POI đã bị chạm nhiều lần hoặc đã được lấp đầy</li>
        </ul>
        
        <h3>Touches & Fill Ratio:</h3>
        <ul>
          <li><strong>Touches:</strong> Số lần giá chạm vào POI</li>
          <li><strong>Fill Ratio:</strong> Tỷ lệ POI đã bị lấp đầy (0-100%)</li>
        </ul>
        
        <h3>Cách sử dụng:</h3>
        <p>POI fresh có giá trị cao hơn. Tìm entry khi giá quay lại test POI fresh, đặc biệt là khi kết hợp với BOS/CHoCH.</p>
      `,
    },
  },

  // Setups Tab
  setups: {
    title: 'Trading Setups',
    count: 'Setups',
    noSetups: 'Không có trading setups khả dụng',
    status: {
      title: 'Trạng thái',
      valid: 'Hợp lệ',
      wait: 'Chờ',
      triggered: 'Đã kích hoạt',
      invalid: 'Không hợp lệ',
    },
    entryZone: 'Vùng Entry',
    stopLoss: 'Stop Loss',
    targets: 'Targets',
    confidence: 'Độ tin cậy',
    rrMin: 'R:R Tối thiểu',
    reasons: 'Lý do',
    help: {
      title: 'Hướng dẫn: Trading Setups',
      content: `
        <h3>Trading Setup là gì?</h3>
        <p>Setup là kế hoạch giao dịch hoàn chỉnh được tạo ra từ sự kết hợp của các tín hiệu SMC (BOS, CHoCH, Sweep, POI).</p>
        
        <h3>Các loại Setup:</h3>
        <ul>
          <li><strong>Sweep → CHoCH → POI:</strong> Liquidity sweep, sau đó CHoCH, và entry tại POI fresh</li>
          <li><strong>BOS continuation → POI pullback:</strong> BOS xác nhận xu hướng, chờ pullback về POI để entry</li>
        </ul>
        
        <h3>Entry Zone:</h3>
        <p>Vùng giá nơi bạn nên đặt lệnh. Có thể là limit order trong zone hoặc market order khi trigger.</p>
        
        <h3>Stop Loss:</h3>
        <p>Mức giá để cắt lỗ nếu setup không thành công. Thường đặt dưới OB (cho long) hoặc trên OB (cho short).</p>
        
        <h3>Targets:</h3>
        <ul>
          <li><strong>TP (Take Profit):</strong> Mục tiêu lợi nhuận</li>
          <li><strong>LIQUIDITY:</strong> Target tại liquidity level</li>
          <li><strong>SWING:</strong> Target tại swing point</li>
        </ul>
        
        <h3>R:R (Risk:Reward):</h3>
        <p>Tỷ lệ rủi ro/lợi nhuận tối thiểu. Ví dụ R:R 2.0 nghĩa là lợi nhuận tiềm năng gấp đôi rủi ro.</p>
        
        <h3>Status:</h3>
        <ul>
          <li><strong>Valid:</strong> Setup hợp lệ, sẵn sàng giao dịch</li>
          <li><strong>Wait:</strong> Chờ trigger hoặc xác nhận thêm</li>
          <li><strong>Triggered:</strong> Đã kích hoạt, đang trong giao dịch</li>
          <li><strong>Invalid:</strong> Setup không còn hợp lệ, đã bị invalidation</li>
        </ul>
      `,
    },
  },

  // Method Tab
  method: {
    title: 'Phương pháp & Hệ thống',
    smc: {
      title: 'Smart Money Concepts (SMC)',
      description: 'SMC là phương pháp phân tích kỹ thuật dựa trên hành vi của các nhà giao dịch lớn (Smart Money) trong thị trường. Phương pháp này tập trung vào việc xác định các điểm vào lệnh chất lượng cao dựa trên cấu trúc thị trường, thanh khoản và các vùng giá quan trọng.',
      principles: [
        'Phân tích cấu trúc thị trường (Market Structure)',
        'Xác định thanh khoản (Liquidity)',
        'Tìm các điểm quan trọng (Points of Interest)',
        'Tạo kế hoạch giao dịch dựa trên sự kết hợp các yếu tố'
      ]
    },
    formulas: {
      title: 'Công thức đang áp dụng',
      swingDetection: {
        title: 'Swing Detection (Fractal)',
        formula: 'Fractal Length = 3',
        description: 'Phát hiện swing high/low bằng cách so sánh giá với 3 cây nến trước và sau. Một swing high được xác định khi high[i] > high[i-1, i-2, i+1, i+2].'
      },
      bos: {
        title: 'Break of Structure (BOS)',
        formula: 'BOS = Price breaks previous swing high/low',
        description: 'BOS xảy ra khi giá phá vỡ swing high (bullish BOS) hoặc swing low (bearish BOS) trước đó, cho thấy sự thay đổi trong xu hướng.'
      },
      choch: {
        title: 'Change of Character (CHoCH)',
        formula: 'CHoCH = BOS after opposite BOS',
        description: 'CHoCH là sự đảo chiều của xu hướng. Sau một bearish BOS, bullish CHoCH xảy ra khi giá phá vỡ swing high. Ngược lại, sau bullish BOS, bearish CHoCH xảy ra khi giá phá vỡ swing low.'
      },
      liquidity: {
        title: 'Liquidity Sweep',
        formula: 'Sweep = Wick beyond level + Close back inside',
        description: 'Liquidity sweep xảy ra khi giá tạo wick vượt qua một mức hỗ trợ/kháng cự (EQH/EQL) nhưng sau đó đóng lại bên trong, cho thấy thanh khoản đã bị "sweep".'
      },
      orderBlock: {
        title: 'Order Block (OB)',
        formula: 'OB = Last opposite candle before displacement',
        description: 'Order Block là cây nến cuối cùng trước một động thái giá mạnh (displacement). OB bullish là cây nến giảm cuối cùng trước khi giá tăng mạnh.'
      },
      fvg: {
        title: 'Fair Value Gap (FVG)',
        formula: 'FVG = Gap between candle bodies',
        description: 'FVG là khoảng trống giữa các cây nến, nơi không có giao dịch nào xảy ra. FVG thường được "lấp đầy" sau đó.'
      }
    },
    system: {
      title: 'Tổng quan hệ thống',
      architecture: {
        title: 'Kiến trúc hệ thống',
        description: 'Hệ thống được xây dựng theo mô hình modular với các thành phần độc lập:',
        components: [
          {
            name: 'Data Provider (Bybit)',
            description: 'Lấy dữ liệu nến từ Bybit V5 API (REST + WebSocket)'
          },
          {
            name: 'SMC Engine',
            description: 'Phân tích dữ liệu và tạo signals, levels, POIs, setups'
          },
          {
            name: 'Web UI',
            description: 'Hiển thị kết quả phân tích với realtime updates'
          }
        ]
      },
      workflow: {
        title: 'Quy trình xử lý',
        steps: [
          '1. Fetch candles từ Bybit (200 nến M15)',
          '2. Detect swings sử dụng fractal (len=3)',
          '3. Phân tích market structure (BOS/CHoCH)',
          '4. Xác định equilibrium levels (EQH/EQL)',
          '5. Phát hiện liquidity sweeps',
          '6. Tìm Order Blocks và Fair Value Gaps',
          '7. Tính toán freshness của POIs',
          '8. Tạo trading setups dựa trên confluence',
          '9. Validate output theo schema',
          '10. Hiển thị kết quả trên UI'
        ]
      },
      techStack: {
        title: 'Công nghệ sử dụng',
        items: [
          'Node.js 20+',
          'TypeScript',
          'Next.js 14 (App Router)',
          'pnpm workspace (monorepo)',
          'Bybit V5 API',
          'WebSocket cho realtime',
          'AJV cho schema validation'
        ]
      },
      currentConfig: {
        title: 'Cấu hình hiện tại',
        items: [
          'Symbol: BTCUSDT',
          'Market: Linear Perpetual',
          'Timeframe: M15 (15 phút)',
          'Candles: 200 nến',
          'Realtime: WebSocket kline.15.BTCUSDT',
          'Confirm: Chỉ xử lý khi confirm=true'
        ]
      }
    }
  },
};
