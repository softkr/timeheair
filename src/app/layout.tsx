import type { Metadata } from 'next';
import { AntdRegistry } from '@/lib/AntdRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: '타임헤어 관리 시스템',
  description: '미용실 좌석, 예약, 매출 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
