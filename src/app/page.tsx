'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Spin } from 'antd';

// 创建一个简单的加载组件（不使用主题，使用默认样式）
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

// 采用动态加载以保持客户端 Canvas/Video 实例的正确初始化
const LayOut = dynamic(() => import('@/frontend/components/layout/LayOut'), {
  ssr: false,
  loading: LoadingComponent,
});

export default function RootPage() {
  return <LayOut />;
}
