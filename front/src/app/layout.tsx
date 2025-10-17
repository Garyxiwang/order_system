import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@ant-design/v5-patch-for-react-19";
import "./globals.css";
import LocaleProvider from "@/components/LocaleProvider";
import Script from "next/script";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "前端下单系统",
  description: "基于Next.js、TypeScript和Ant Design构建的订单系统",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

import AppLayout from "@/components/layout/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NODE_ENV === 'production' && (
          <Script id="chunk-error-reloader" strategy="beforeInteractive">
            {`
            (function () {
              if (typeof window === 'undefined') return;
              var FLAG = 'chunk-error-reload-done';
              var LAST_TS_KEY = 'chunk-error-reload-last';
              var TTL_MS = 5 * 60 * 1000; // 5分钟

              function shouldReload() {
                var done = sessionStorage.getItem(FLAG) === '1';
                if (done) return false;
                var last = Number(sessionStorage.getItem(LAST_TS_KEY) || '0');
                var now = Date.now();
                if (!last || (now - last) > TTL_MS) return true;
                return false;
              }

              function markReload() {
                try {
                  sessionStorage.setItem(FLAG, '1');
                  sessionStorage.setItem(LAST_TS_KEY, String(Date.now()));
                } catch (_) {}
              }

              function reloadOnce() {
                if (!shouldReload()) return;
                markReload();
                window.location.reload();
              }

              function isChunkScript(t) {
                return t && t.tagName === 'SCRIPT' && t.src && t.src.indexOf('/_next/static/chunks/') !== -1;
              }

              // 监听脚本资源加载错误（chunk 404/失败）
              window.addEventListener('error', function (e) {
                try {
                  var t = e.target || e.srcElement;
                  if (isChunkScript(t)) {
                    reloadOnce();
                  }
                } catch (_) {}
              }, true);

              // 监听未处理的 Promise 拒绝（Webpack ChunkLoadError）
              window.addEventListener('unhandledrejection', function (event) {
                var r = event && event.reason;
                var msg = r && (r.message || r.toString());
                if (r && (r.name === 'ChunkLoadError' || (typeof msg === 'string' && msg.indexOf('Loading chunk') !== -1))) {
                  reloadOnce();
                }
              });
            })();
          `}
          </Script>
        )}
        <LocaleProvider>
          <AppLayout>{children}</AppLayout>
        </LocaleProvider>
      </body>
    </html>
  );
}
