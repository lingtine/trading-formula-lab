import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trading Formula Lab - Phân tích SMC',
  description: 'Phân tích Smart Money Concepts cho BTCUSDT'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <a href="#main-content" className="skip-link">
          Chuyển tới nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
