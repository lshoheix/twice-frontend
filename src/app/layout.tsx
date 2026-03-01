import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOOZZON Q",
  description: "Minimal MVP for engagement, quiz, and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
