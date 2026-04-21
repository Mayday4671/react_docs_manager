import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Typography, Space, theme, message, Button, Grid } from 'antd';
import { 
    VideoCameraOutlined, 
    UserOutlined, 
    CloudUploadOutlined, 
    SettingOutlined,
    ArrowRightOutlined,
    StarFilled,
    BellFilled,
    RocketFilled,
    InfoCircleFilled,
    ExclamationCircleFilled
} from '@ant-design/icons';
import { Area, Pie } from '@ant-design/plots';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

/**
 * 首页 Dashboard 组件
 * 包含快捷入口、业务数据图表展示
 */
const Home: React.FC = () => {
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const noticeBodyRef = useRef<HTMLDivElement>(null);
    const changelogBodyRef = useRef<HTMLDivElement>(null);
    
    const [visibleCounts, setVisibleCounts] = useState({ notice: 5, changelog: 5 });

    // 状态判定
    const isMobile = !screens.md;
    const isSmallest = !screens.sm;

    const cardStyle: React.CSSProperties = {
        borderRadius: 12,
        border: `1px solid ${token.colorPrimary}15`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.01)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    };

    useEffect(() => {
        const ITEM_HEIGHT = 50;
        if (typeof window === 'undefined') return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            if (isMobile) return;

            // 防抖处理，避免频繁更新
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                for (let entry of entries) {
                    if (entry.target === noticeBodyRef.current || entry.target === changelogBodyRef.current) {
                        const h = entry.contentRect.height;
                        const count = Math.floor((h - 4) / ITEM_HEIGHT);
                        if (entry.target === noticeBodyRef.current) {
                            setVisibleCounts(prev => ({ ...prev, notice: Math.max(1, count) }));
                        } else if (entry.target === changelogBodyRef.current) {
                            setVisibleCounts(prev => ({ ...prev, changelog: Math.max(1, count) }));
                        }
                    }
                }
            }, 150);
        };

        const observer = new ResizeObserver(handleResize);

        if (noticeBodyRef.current) observer.observe(noticeBodyRef.current);
        if (changelogBodyRef.current) observer.observe(changelogBodyRef.current);
        // 监听主容器尺寸变化以触发列表区域重计算
        const mainContainer = document.getElementById('home-main-container');
        if (mainContainer) observer.observe(mainContainer);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            observer.disconnect();
        };
    }, [isMobile]);

    const handleCardClick = (key: string) => {
        if (!key || key === 'settings') {
            message.info('该功能正在开发中...');
            return;
        }
        const event = new CustomEvent('switchTab', { detail: { key } });
        window.dispatchEvent(event);
    };

    const quickLinks = [
        { title: '视频预览', desc: '实时监控与分屏', icon: <VideoCameraOutlined />, color: '#52c41a', key: 'h5-player' },
        { title: '用户中心', desc: '系统用户管理', icon: <UserOutlined />, color: '#1890ff', key: '1' },
        { title: '文件上传', desc: '媒体资源导入', icon: <CloudUploadOutlined />, color: '#722ed1', key: '3' },
        { title: '系统设置', desc: '参数个性化配置', icon: <SettingOutlined />, color: '#fa8c16', key: 'settings' },
    ];

    const areaData = useMemo(() => [
        { time: '00:00', value: 120 }, { time: '04:00', value: 60 }, { time: '08:00', value: 380 },
        { time: '12:00', value: 350 }, { time: '16:00', value: 520 }, { time: '20:00', value: 390 },
        { time: '24:00', value: 180 },
    ], []);

    const pieData = useMemo(() => [
        { type: '在线', value: 45 }, { type: '离线', value: 12 }, { type: '异常', value: 8 }
    ], []);

    const allNotices = [
        { id: 1, title: '关于系统 V4 版本全面升级的通知', date: '2024-05-20', type: 'new', icon: <BellFilled /> },
        { id: 2, title: '端午节期间服务器例行维护公告', date: '2024-05-18', type: 'info', icon: <InfoCircleFilled /> },
        { id: 3, title: '安全提醒：请定期修改您的登录密码', date: '2024-05-15', type: 'warning', icon: <ExclamationCircleFilled /> },
        { id: 4, title: '系统性能深度优化指南已上线', date: '2024-05-12', type: 'info', icon: <RocketFilled /> },
        { id: 5, title: '新增 H5Player 多路并发预览支持', date: '2024-05-10', type: 'new', icon: <BellFilled /> },
    ];

    const allChangelogs = [
        { version: 'V4.2.5', date: '2024-05-20', desc: '首页布局实时响应优化', icon: <RocketFilled /> },
        { version: 'V4.2.0', date: '2024-05-18', desc: '修复图表缩放重绘延迟问题', icon: <StarFilled /> },
        { version: 'V4.1.0', date: '2024-05-15', desc: '适配全端自适应形态切换', icon: <StarFilled /> },
    ];

    return (
        <div id="home-main-container" style={{ 
            padding: isMobile ? '8px' : '16px', 
            height: isMobile ? 'auto' : '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            overflowX: 'hidden',
            overflowY: isMobile ? 'auto' : 'hidden',
            boxSizing: 'border-box',
            backgroundColor: token.colorBgLayout, // 使用动态布局背景
            minWidth: 0
        }}>
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 8 : 16, fontWeight: 600, flexShrink: 0 }}>控制台数字化大屏</Title>
            
            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ marginBottom: isMobile ? 12 : 16, flexShrink: 0 }}>
                {quickLinks.map((item, index) => (
                    <Col xs={12} sm={12} lg={6} key={index}>
                        <Card hoverable onClick={() => handleCardClick(item.key)} style={cardStyle} styles={{ body: { padding: isMobile ? '12px' : '16px' } }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ 
                                    width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 10, backgroundColor: `${item.color}10`, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontSize: isMobile ? 18 : 22, color: item.color, marginRight: isMobile ? 8 : 12, flexShrink: 0 
                                }}>{item.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text strong style={{ fontSize: isMobile ? 13 : 14, display: 'block' }} ellipsis>{item.title}</Text>
                                    {!isSmallest && <Paragraph type="secondary" style={{ fontSize: 11, marginBottom: 0 }} ellipsis>{item.desc}</Paragraph>}
                                </div>
                                {!isMobile && <ArrowRightOutlined style={{ color: token.colorTextDescription, opacity: 0.3, fontSize: 12 }} />}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ marginBottom: isMobile ? 12 : 16, flex: isMobile ? 'none' : 1.2, minHeight: 0 }}>
                <Col xs={24} lg={16} style={{ height: isMobile ? 260 : '100%' }}>
                    <Card title="访问趋势压力 (24h)" style={cardStyle} styles={{ body: { flex: 1, padding: '8px 12px', minHeight: 0, overflow: 'hidden' } }}>
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <Area 
                                data={areaData} 
                                xField="time" 
                                yField="value" 
                                autoFit 
                                padding={[20, 20, 35, 35]} 
                                colorField="#1890ff"
                                {...({
                                    shapeField: 'smooth',
                                    style: {
                                        fill: 'linear-gradient(-90deg, rgba(24,144,255,0.25) 0%, rgba(24,144,255,0.02) 100%)',
                                        stroke: '#1890ff',
                                        strokeWidth: 2,
                                    },
                                    axis: {
                                        x: {
                                            line: true,
                                            lineStroke: '#e8e8e8',
                                            labelFontSize: 11,
                                            labelFill: '#8c8c8c',
                                            tickStroke: '#e8e8e8',
                                        },
                                        y: {
                                            labelFontSize: 11,
                                            labelFill: '#8c8c8c',
                                            gridStroke: '#f0f0f0',
                                            gridStrokeDasharray: '3,3',
                                        },
                                    },
                                    interaction: {
                                        tooltip: {
                                            crosshairs: true,
                                            crosshairsStroke: '#1890ff',
                                            crosshairsStrokeOpacity: 0.25,
                                        },
                                    },
                                    animate: { enter: { type: 'fadeIn', duration: 800 } },
                                } as any)}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8} style={{ height: isMobile ? 260 : '100%' }}>
                    <Card title="设备状态概览" style={cardStyle} styles={{ body: { flex: 1, padding: '8px 12px', minHeight: 0, overflow: 'hidden' } }}>
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <Pie 
                                data={pieData} 
                                angleField="value" 
                                colorField="type" 
                                radius={0.85} 
                                innerRadius={0.6} 
                                autoFit 
                                padding={[10, 10, 10, 10]} 
                                {...({
                                    theme: { paletteQualitative10: ['#1890ff', '#d9d9d9', '#ff4d4f'] },
                                    label: {
                                        text: 'type',
                                        position: 'outside',
                                        fontSize: 12,
                                        fill: '#595959',
                                        connector: true,
                                    },
                                    legend: {
                                        color: {
                                            position: 'bottom',
                                            layout: { justifyContent: 'center' },
                                            itemLabelFontSize: 12,
                                        },
                                    },
                                    statistic: {
                                        title: { content: '设备总数', style: { fontSize: 12, color: '#8c8c8c' } },
                                        content: { content: '65', style: { fontSize: 22, fontWeight: 700, color: '#262626' } },
                                    },
                                    interaction: {
                                        elementHighlight: true,
                                    },
                                    animate: { enter: { type: 'waveIn', duration: 800 } },
                                } as any)}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
            
            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ flex: isMobile ? 'none' : 1, minHeight: 0 }}>
                <Col xs={24} lg={12} style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card title="通知公告" style={cardStyle} extra={<Button type="link" size="small">更多</Button>} styles={{ body: { flex: 1, padding: isMobile ? '8px 12px 12px' : '12px 16px', minHeight: 0, overflow: 'hidden' } }}>
                        <div ref={noticeBodyRef} style={{ height: '100%', overflow: 'hidden' }}>
                            {allNotices.slice(0, isMobile ? allNotices.length : visibleCounts.notice).map(item => {
                                const colors: any = { 
                                    new: { icon: '#ff4d4f' }, 
                                    warning: { icon: '#faad14' }, 
                                    info: { icon: token.colorPrimary } 
                                };
                                const style = colors[item.type] || colors.info;
                                // 动态背景：图标颜色的 10% 透明度
                                const itemBg = `${style.icon}15`; 
                                return (
                                    <div key={item.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: isMobile ? '8px 10px' : '10px 12px', 
                                        marginBottom: isMobile ? 6 : 8, 
                                        borderRadius: 8, 
                                        backgroundColor: itemBg, 
                                        borderLeft: `4px solid ${style.icon}`, 
                                        transition: 'all 0.3s', 
                                        height: 42, 
                                        overflow: 'hidden' 
                                    }} className="alert-item-hover">
                                        <div style={{ fontSize: isMobile ? 14 : 16, marginRight: 10, display: 'flex', color: style.icon }}>{item.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong style={{ fontSize: 13 }} ellipsis>{item.title}</Text>
                                                {!isSmallest && <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{item.date}</Text>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card title="更新日志" style={cardStyle} extra={<Button type="link" size="small">详细</Button>} styles={{ body: { flex: 1, padding: isMobile ? '8px 12px 12px' : '12px 16px', minHeight: 0, overflow: 'hidden' } }}>
                        <div ref={changelogBodyRef} style={{ height: '100%', overflow: 'hidden' }}>
                            {allChangelogs.slice(0, isMobile ? allChangelogs.length : visibleCounts.changelog).map((item, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: isMobile ? '8px 10px' : '10px 12px', 
                                    marginBottom: isMobile ? 6 : 8, 
                                    borderRadius: 8, 
                                    backgroundColor: `${token.colorSuccess}15`, 
                                    borderLeft: `4px solid ${token.colorSuccess}`, 
                                    transition: 'all 0.3s', 
                                    height: 42, 
                                    overflow: 'hidden' 
                                }} className="alert-item-hover">
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: `${token.colorSuccess}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, color: token.colorSuccess, flexShrink: 0 }}>{item.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Space size={4} style={{ minWidth: 0 }}>
                                                <Text strong style={{ color: token.colorSuccess, fontSize: 13 }}>{item.version}</Text>
                                                {!isSmallest && <div style={{ padding: '0 4px', background: `${token.colorSuccess}15`, borderRadius: 4, fontSize: 10, color: token.colorSuccess, flexShrink: 0 }}>Update</div>}
                                            </Space>
                                            {!isSmallest && <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>{item.date}</Text>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .alert-item-hover:hover { filter: brightness(0.98); transform: translateX(2px); }
                ${!isMobile ? 'html, body, #root { height: 100vh !important; overflow: hidden !important; }' : ''}
            `}</style>
        </div>
    );
};

export default Home;
