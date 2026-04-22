/**
 * @file page.tsx
 * @description 应用根页面，动态加载主布局组件 LayOut，避免 SSR 导致的客户端实例问题
 * @module 应用入口
 */
'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

/**
 * 全屏加载占位组件，在 LayOut 动态加载期间显示。
 * 不依赖主题 token，使用固定样式避免加载时的样式闪烁。
 */
const LoadingComponent = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    zIndex: 9999
  }}>
    <Spin size="large" />
    <div style={{ marginTop: 16, color: '#666', fontSize: 14 }}>系统初始化中...</div>
  </div>
);

/**
 * 动态加载主布局组件，禁用 SSR。
 * 原因：LayOut 内含 Canvas/Video 等客户端专属 API，SSR 会导致 hydration 错误。
 */
const LayOut = dynamic(() => import('@/frontend/components/layout/LayOut'), {
  ssr: false,
  loading: LoadingComponent,
});

export default function RootPage() {
  return <LayOut />;
}
