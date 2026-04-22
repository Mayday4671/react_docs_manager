/**
 * @file ThemeSettings.tsx
 * @description 主题设置抽屉组件，提供主题预设、主题色、字号、圆角、导航模式等个性化配置
 * @module 布局
 */

import React from 'react';
import { Divider, ColorPicker, Typography, theme, Tooltip, Row, Col, Switch, Slider } from 'antd';
import { CheckOutlined, SettingOutlined, CloseOutlined } from '@ant-design/icons';
import { useTheme } from '@/frontend/context/ThemeContext';

const { Text, Title } = Typography;
/**
 * 主题设置抽屉组件的 Props
 */
interface ThemeSettingsProps {
  /** 抽屉是否处于打开状态 */
  open: boolean;
  /** 关闭抽屉的回调 */
  onClose: () => void;
  /** 切换抽屉开关状态的回调（用于手柄按钮） */
  onToggle: () => void;
}
/**
 * 主题设置抽屉组件
 *
 * 从页面右侧滑入的主题配置面板，支持预设主题切换、主题色选择、
 * 字号调整、圆角大小、紧凑模式及导航布局模式等设置。
 *
 * @param open - 抽屉是否打开
 * @param onClose - 关闭抽屉的回调
 * @param onToggle - 切换抽屉开关状态的回调
 */
const ThemeSettings: React.FC<ThemeSettingsProps> = ({ open, onClose, onToggle }) => {
  const { 
    darkMode, toggleTheme, 
    layout, setLayout, 
    colorPrimary, setColorPrimary,
    borderRadius, setBorderRadius,
    compactAlgorithm, setCompactAlgorithm,
    fontSize, setFontSize
  } = useTheme();

  const { token } = theme.useToken();

  /** 主题预设列表，包含暗黑模式标志、主色及卡片预览色 */
  const themePresets = [
    { 
      key: 'default', 
      name: '默认', 
      dark: false, 
      color: '#1677ff',
      cardBg: '#e8e8e8',
      cardContent: '#ffffff'
    },
    { 
      key: 'dark', 
      name: '暗黑', 
      dark: true, 
      color: '#1677ff',
      cardBg: '#2f2f2f',
      cardContent: '#141414'
    },
    { 
      key: 'green', 
      name: '知识协作', 
      dark: false, 
      color: '#00b96b',
      cardBg: '#a5ecc7', // Light Green Tint
      cardContent: '#ffffff'
    },
    { 
      key: 'pink', 
      name: '桃花缘', 
      dark: false, 
      color: '#eb2f96',
      cardBg: '#ffadd2', // Light Pink Tint
      cardContent: '#ffffff'
    },
    { 
      key: 'v4', 
      name: 'V4 主题', 
      dark: false, 
      color: '#1890ff',
      cardBg: '#91caff', // Light Blue Tint
      cardContent: '#ffffff'
    },
  ];

  /** 主题色预设列表，来自 Ant Design 官方色板 */
  const colorPresets = [
    { color: '#1677FF', name: 'Tech Blue' },
    { color: '#722ED1', name: 'Geek Purple' },
    { color: '#13C2C2', name: 'Cyan' },
    { color: '#52C41A', name: 'Polar Green' },
    { color: '#EB2F96', name: 'Magenta' },
    { color: '#F5222D', name: 'Dust Red' },
    { color: '#FA8C16', name: 'Sunset Orange' },
    { color: '#FADB14', name: 'Sunrise Yellow' },
    { color: '#FA541C', name: 'Volcano' },
    { color: '#2F54EB', name: 'Geek Blue' },
  ];
  /**
   * 处理预设主题点击，同步切换暗黑模式和主题色
   * @param preset - 被点击的预设主题对象
   */
  const handlePresetClick = (preset: typeof themePresets[0]) => {
      if (darkMode !== preset.dark) {
          toggleTheme();
      }
      setColorPrimary(preset.color);
  };
  /**
   * 渲染主题预设卡片
   * @param preset - 预设主题对象
   * @returns 可点击的预设卡片 JSX 元素
   */
  const renderPresetCard = (preset: typeof themePresets[0]) => {
      const isSelected = darkMode === preset.dark && colorPrimary.toLowerCase() === preset.color.toLowerCase();
      
      return (
        <div 
          key={preset.key}
          onClick={() => handlePresetClick(preset)}
          style={{
              cursor: 'pointer',
              position: 'relative'
          }}
        >
           <div style={{
               borderRadius: 8,
               border: `2px solid ${isSelected ? token.colorPrimary : 'transparent'}`,
               overflow: 'hidden',
               transition: 'all 0.3s',
               height: 60, // Slightly taller to match screenshot aspect ratio
               position: 'relative',
               backgroundColor: preset.cardBg,
           }}>
               <div style={{
                   position: 'absolute',
                   bottom: 0,
                   right: 0,
                   width: '75%',
                   height: '80%',
                   backgroundColor: preset.cardContent,
                   borderTopLeftRadius: 8,
                   boxShadow: '0 0 4px rgba(0,0,0,0.05)'
               }}>
               </div>
           </div>
           <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: token.colorTextSecondary }}>
               {isSelected && <CheckOutlined style={{ marginRight: 4, color: token.colorPrimary }} />}
               {preset.name}
           </div>
        </div>
      );
  };
  /**
   * 渲染导航布局模式卡片
   * @param type - 布局类型：side-侧边 / top-顶部 / mix-混合
   * @param title - 卡片 Tooltip 提示文字
   * @returns 可点击的布局卡片 JSX 元素
   */
  const renderLayoutCard = (type: 'side' | 'top' | 'mix', title: string) => {
      const isSelected = layout === type;
      return (
        <div 
          onClick={() => setLayout(type)}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
             <Tooltip title={title}>
                <div style={{
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? token.colorPrimary : 'transparent'}`,
                    padding: 4,
                    backgroundColor: token.colorBgContainer,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    gap: 4
                }}>
                    {type === 'side' && (
                        <>
                            <div style={{ width: 12, height: 32, background: token.colorPrimary, opacity: 0.5, borderRadius: 2 }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 8, background: token.colorFillSecondary, borderRadius: 2 }}></div>
                                <div style={{ flex: 1, background: token.colorFillTertiary, borderRadius: 2 }}></div>
                            </div>
                        </>
                    )}
                    {type === 'top' && (
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                             <div style={{ height: 8, background: token.colorPrimary, opacity: 0.5, borderRadius: 2 }}></div>
                             <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                                 <div style={{ width: 12, background: token.colorFillSecondary, borderRadius: 2 }}></div>
                                 <div style={{ flex: 1, background: token.colorFillTertiary, borderRadius: 2 }}></div>
                             </div>
                        </div>
                    )}
                    {type === 'mix' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ height: 8, background: token.colorPrimary, opacity: 0.5, borderRadius: 2 }}></div>
                            <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                                <div style={{ width: 12, background: token.colorFillSecondary, borderRadius: 2 }}></div>
                                <div style={{ flex: 1, background: token.colorFillTertiary, borderRadius: 2 }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </Tooltip>
            {isSelected && (
                 <div style={{ position: 'absolute', bottom: -8, right: -8, color: token.colorPrimary }}>
                     <CheckOutlined />
                 </div>
            )}
        </div>
      );
  };

  return (
    <>
        {/*  */}
        {open && (
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)', // 
                    zIndex: 1000,
                    pointerEvents: 'none' // Don't block clicks if we want transparency, or 'auto' if we want to close on mask click
                }}
            />
        )}
        
        {/* 抽屉手柄 */}
        <div
            className={`theme-settings-drawer-handle ${open ? 'handle-open' : ''}`}
            onClick={onToggle}
            style={{
                right: open ? 378 : undefined,
                // Safest to keep bg color inline to react instantly to state change.
                backgroundColor: token.colorPrimary, 
            }}
        >
            {open ? <CloseOutlined /> : <SettingOutlined />}
        </div>
        
        {/* 抽屉容器 */}
        <div
            className="theme-settings-drawer"
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 378,
                backgroundColor: token.colorBgElevated,
                zIndex: 1001,
                boxShadow: '-6px 0 16px 0 rgba(0, 0, 0, 0.08), -3px 0 6px -4px rgba(0, 0, 0, 0.12), -9px 0 28px 8px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: open ? 'translateX(0)' : 'translateX(100%)',
            }}
        >

        {/* 内容容器 */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 头部 */}
            <div style={{ 
                padding: '16px 24px', 
                borderBottom: `1px solid ${token.colorSplit}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ fontWeight: 500, fontSize: 16 }}>定制主题</div>
                <div onClick={onClose} style={{ cursor: 'pointer', color: token.colorTextSecondary }}>
                    <CloseOutlined />
                </div>
            </div>

            {/* 可滚动内容 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                {/* 我的主题 */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>我的主题</Title>
                    <Row gutter={[12, 12]}>
                        {themePresets.map(preset => (
                            <Col span={8} key={preset.key}>
                                {renderPresetCard(preset)}
                            </Col>
                        ))}
                    </Row>
                </div>

                <Divider />

                {/* 主题色 */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>主题色</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {colorPresets.map((preset) => (
                            <Tooltip title={preset.name} key={preset.color}>
                                <div
                                    onClick={() => setColorPrimary(preset.color)}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        backgroundColor: preset.color,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    {colorPrimary.toLowerCase() === preset.color.toLowerCase() && (
                                        <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />
                                    )}
                                </div>
                            </Tooltip>
                        ))}
                        {/* 自定义颜色 */}
                        <ColorPicker
                            value={colorPrimary}
                            onChange={(color) => setColorPrimary(color.toHexString())}
                        >
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(to bottom right, red, yellow, lime, cyan, blue, magenta)'
                                }}
                            />
                        </ColorPicker>
                    </div>
                </div>

                <Divider />

                {/* 尺寸 */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>尺寸</Title>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* 紧凑模式 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>紧凑模式</Text>
                            <Switch 
                                checked={compactAlgorithm} 
                                onChange={setCompactAlgorithm} 
                            />
                        </div>
                        
                        {/* 基础字号 */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>基础字号</Text>
                                <Text type="secondary">{fontSize}px</Text>
                            </div>
                            <Slider
                                min={12}
                                max={20}
                                value={fontSize}
                                onChange={setFontSize}
                                tooltip={{ open: false }}
                            />
                        </div>
                    </div>
                </div>

                <Divider />

                {/* 导航模式 */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>导航模式</Title>
                    <Row gutter={16}>
                        <Col span={8}>
                            {renderLayoutCard('side', '侧边菜单布局')}
                        </Col>
                        <Col span={8}>
                            {renderLayoutCard('top', '顶部菜单布局')}
                        </Col>
                        <Col span={8}>
                            {renderLayoutCard('mix', '混合菜单布局')}
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* 其他设置 */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>其他设置</Title>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>圆角大小</Text>
                            <div style={{ width: 120 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: -4 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>0</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>16</Text>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={16}
                                        value={borderRadius}
                                        onChange={(e) => setBorderRadius(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            accentColor: token.colorPrimary,
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </>
  );
};

export default ThemeSettings;
