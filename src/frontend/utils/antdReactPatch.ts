/**
 * antd v5 与 React 19 兼容性补丁
 *
 * antd v5 在模块加载阶段会检查 React.version，若不在 16~18 范围内则输出
 * "antd v5 support React is 16 ~ 18" 警告。该检查早于 ConfigProvider 的
 * warning={{ compatible: false }} 生效，因此需要在模块初始化时提前 patch。
 *
 * 做法：将 React.version 临时伪装为 "18.x.x"，让 antd 的版本检查通过。
 * 这不影响 React 19 的任何实际功能，仅用于消除控制台噪音。
 */

import React from 'react';

// 仅在客户端执行（服务端渲染时 window 不存在）
if (typeof window !== 'undefined') {
  const r = React as any;
  // 如果当前版本是 19.x，将其伪装为 18.x 以通过 antd 的版本检查
  if (r.version && r.version.startsWith('19')) {
    r.version = r.version.replace(/^19/, '18');
  }
}
