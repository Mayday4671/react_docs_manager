/**
 * @file ThemeContext.tsx
 * @description 全局主题上下文，管理深色模式、布局方式、主题色等外观配置，并持久化到 localStorage
 * @module 主题配置
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

/** 布局类型：side-侧边栏 / top-顶部导航 / mix-混合布局 */
type LayoutType = 'side' | 'top' | 'mix';

/**
 * 主题上下文数据结构
 */
interface ThemeContextType {
    /** 是否启用深色模式 */
    darkMode: boolean;
    /** 切换深色/浅色模式 */
    toggleTheme: () => void;
    /** 当前布局类型 */
    layout: LayoutType;
    /** 设置布局类型 */
    setLayout: (layout: LayoutType) => void;
    /** 主题主色调（十六进制颜色值） */
    colorPrimary: string;
    /** 设置主题主色调 */
    setColorPrimary: (color: string) => void;
    /** 组件圆角大小（px） */
    borderRadius: number;
    /** 设置组件圆角大小 */
    setBorderRadius: (radius: number) => void;
    /** 是否启用紧凑模式 */
    compactAlgorithm: boolean;
    /** 设置是否启用紧凑模式 */
    setCompactAlgorithm: (compact: boolean) => void;
    /** 基础字体大小（px） */
    fontSize: number;
    /** 设置基础字体大小 */
    setFontSize: (size: number) => void;
    /** 组件是否已挂载（用于防止 SSR 水合不一致） */
    mounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题上下文 Provider 组件
 *
 * 负责初始化主题配置（从 localStorage 读取），并在状态变更时同步持久化。
 * 同时将主题变量写入 CSS 自定义属性，供全局样式使用。
 *
 * @param children - 子节点
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 关键：防止 SSR 期间访问 localStorage
    /** 是否已完成客户端挂载，防止 SSR 水合期间访问 localStorage */
    const [mounted, setMounted] = useState(false);
    /** 是否启用深色模式 */
    const [darkMode, setDarkMode] = useState(false);
    /** 当前布局类型 */
    const [layout, setLayout] = useState<LayoutType>('side');
    /** 主题主色调 */
    const [colorPrimary, setColorPrimary] = useState('#1677ff');
    /** 组件圆角大小 */
    const [borderRadius, setBorderRadius] = useState(6);
    /** 是否启用紧凑模式 */
    const [compactAlgorithm, setCompactAlgorithm] = useState(false);
    /** 基础字体大小 */
    const [fontSize, setFontSize] = useState(14);

    // 初始加载
    useEffect(() => {
        /**
         * 从 localStorage 读取已保存的配置值，解析失败时返回默认值
         * @param key - localStorage 键名
         * @param def - 解析失败时的默认值
         * @returns 解析后的值或默认值
         */
        const getSaved = (key: string, def: any) => {
            const val = localStorage.getItem(key);
            try { return val ? JSON.parse(val) : def; } catch { return def; }
        };

        setDarkMode(getSaved('theme-darkMode', false));
        setLayout(getSaved('theme-layout', 'side'));
        setColorPrimary(getSaved('theme-colorPrimary', '#1677ff'));
        setBorderRadius(getSaved('theme-borderRadius', 6));
        setCompactAlgorithm(getSaved('theme-compactAlgorithm', false));
        setFontSize(getSaved('theme-fontSize', 14));
        setMounted(true);
    }, []);

    // 状态持久化
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('theme-darkMode', JSON.stringify(darkMode));
        localStorage.setItem('theme-layout', JSON.stringify(layout));
        localStorage.setItem('theme-colorPrimary', JSON.stringify(colorPrimary));
        localStorage.setItem('theme-borderRadius', JSON.stringify(borderRadius));
        localStorage.setItem('theme-compactAlgorithm', JSON.stringify(compactAlgorithm));
        localStorage.setItem('theme-fontSize', JSON.stringify(fontSize));
        
        const root = document.documentElement;
        root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        root.style.setProperty('--primary-color', colorPrimary);
        root.style.setProperty('--primary-color-bg', `${colorPrimary}15`);
        root.style.setProperty('--bg-layout', darkMode ? '#000000' : '#f0f2f5');
        root.style.setProperty('--bg-container', darkMode ? '#141414' : '#ffffff');
        root.style.setProperty('--border-color', darkMode ? '#303030' : '#d9d9d9');
    }, [darkMode, layout, colorPrimary, borderRadius, compactAlgorithm, fontSize, mounted]);

    /**
     * 切换深色/浅色模式
     */
    const toggleTheme = () => setDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{
            darkMode, toggleTheme, layout, setLayout, colorPrimary, setColorPrimary,
            borderRadius, setBorderRadius, compactAlgorithm, setCompactAlgorithm,
            fontSize, setFontSize, mounted
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * 获取主题上下文的自定义 Hook
 *
 * @returns 主题上下文对象
 * @throws 若在 ThemeProvider 外部调用则抛出错误
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
