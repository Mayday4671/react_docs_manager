/**
 * @file layout.tsx
 * @description Next.js 根布局，注册 Ant Design 服务端渲染支持、主题上下文和全局样式
 * @module 应用入口
 */
import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/frontend/context/ThemeContext';
import { AntdConfig } from '@/frontend/context/AntdConfig';
import '@/frontend/styles/globals.css';

/** Next.js 页面元数据，用于 SEO 和浏览器标签页标题 */
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
