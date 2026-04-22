/**
 * @file AntdConfig.tsx
 * @description Ant Design 全局配置组件，读取 ThemeContext 中的主题配置并注入 ConfigProvider
 * @module 主题配置
 */

"use client";

// 必须在所有 antd 模块之前导入，在 antd 版本检查执行前 patch React.version
import '@/frontend/utils/antdReactPatch';

import React from 'react';
import { ConfigProvider, App, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeContext } from './ThemeContext';
import { AuthProvider } from './AuthContext';

/**
 * Ant Design 全局配置组件
 *
 * 从 ThemeContext 读取主题配置（深色模式、主色调、圆角、字体大小、紧凑模式），
 * 注入 antd ConfigProvider。未挂载时隐藏内容以防止水合期间的样式闪烁。
 *
 * @param children - 子节点
 */
export const AntdConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const context = React.useContext(ThemeContext);
    
    if (!context) return <>{children}</>;

    const { darkMode, colorPrimary, borderRadius, fontSize, compactAlgorithm, mounted } = context;

    // 防止水合期间的样式闪烁：未挂载时不渲染或显示占位
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    return (
        <ConfigProvider
            locale={zhCN}
            warning={{ compatible: false }}
            theme={{
                algorithm: [
                    darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    compactAlgorithm ? theme.compactAlgorithm : undefined
                ].filter(Boolean) as any,
                token: {
                    colorPrimary: colorPrimary,
                    borderRadius: borderRadius,
                    fontSize: fontSize,
                },
            }}
        >
        <App><AuthProvider>{children}</AuthProvider></App>
        </ConfigProvider>
    );
};
