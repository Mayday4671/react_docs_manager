"use client";

// 必须在所有 antd 模块之前导入，在 antd 版本检查执行前 patch React.version
import '@/frontend/utils/antdReactPatch';

import React from 'react';
import { ConfigProvider, App, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeContext } from './ThemeContext';

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
            <App>{children}</App>
        </ConfigProvider>
    );
};
