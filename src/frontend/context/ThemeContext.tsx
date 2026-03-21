"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type LayoutType = 'side' | 'top' | 'mix';

interface ThemeContextType {
    darkMode: boolean;
    toggleTheme: () => void;
    layout: LayoutType;
    setLayout: (layout: LayoutType) => void;
    colorPrimary: string;
    setColorPrimary: (color: string) => void;
    borderRadius: number;
    setBorderRadius: (radius: number) => void;
    compactAlgorithm: boolean;
    setCompactAlgorithm: (compact: boolean) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    mounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 关键：防止 SSR 期间访问 localStorage
    const [mounted, setMounted] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [layout, setLayout] = useState<LayoutType>('side');
    const [colorPrimary, setColorPrimary] = useState('#1677ff');
    const [borderRadius, setBorderRadius] = useState(6);
    const [compactAlgorithm, setCompactAlgorithm] = useState(false);
    const [fontSize, setFontSize] = useState(14);

    // 初始加载
    useEffect(() => {
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

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
