import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/frontend/context/ThemeContext';
import { AntdConfig } from '@/frontend/context/AntdConfig';
import '@/frontend/styles/globals.css';

export const metadata = {
  title: 'Next.js Standard Admin',
  description: 'Enterprise level admin dashboard standardized by Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AntdConfig>
              {children}
            </AntdConfig>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
