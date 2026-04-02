import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "해외주식 MAU 인사이트 대시보드 v2",
  description: "해외주식 앱 MAU · 퍼널 · 코호트 · 인사이트 분석",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
