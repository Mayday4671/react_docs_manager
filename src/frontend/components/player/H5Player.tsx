import React, { useEffect, useRef, useState } from 'react';
import {
    StepBackwardOutlined,
    FullscreenOutlined,
    VideoCameraOutlined, 
    PlayCircleOutlined, 
    SettingOutlined, 
    SoundOutlined, 
    MutedOutlined, 
    CameraOutlined, 
    ExpandOutlined, 
    AppstoreOutlined,
    PlaySquareOutlined,
    StopOutlined,
    AudioOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    FastForwardOutlined,
    ControlOutlined
} from '@ant-design/icons';
import { Card, Typography, Button, Space, Input, Row, Col, message, Slider, Tabs, Segmented, Tooltip, Divider, Tag, theme } from 'antd';

// Ant Design 组件解构
const { Text } = Typography;

/**
 * H5Player 插件实例接口定义
 * 包含常用的 JS 调用方法，支持 JSDoc 悬浮查看
 */
interface H5PlayerInstance {
    /** 播放器尺寸自适应 */
    JS_Resize: () => void;
    /** 排布窗口（分屏） */
    JS_ArrangeWindow: (num: number) => Promise<void>;
    /** 整体全屏 */
    JS_FullScreenDisplay: (isFull: boolean) => Promise<void>;
    /** 单窗口全屏 */
    JS_FullScreenSingle: (index: number) => Promise<void>;
    /** 播放视频 */
    JS_Play: (url: string, options: any, index: number, startTime?: string, endTime?: string) => Promise<void>;
    /** 停止当前选中窗口播放 */
    JS_Stop: () => Promise<void>;
    /** 停止所有窗口播放 */
    JS_StopRealPlayAll: () => Promise<void>;
    /** 设置链路追踪 */
    JS_SetTraceId: (index: number, enable: boolean) => void;
    /** 获取链路追踪 ID */
    JS_GetTraceId: (index: number) => Promise<string>;
    /** 开始对讲 */
    JS_StartTalk: (url: string, options: any) => Promise<void>;
    /** 停止对讲 */
    JS_StopTalk: () => Promise<void>;
    /** 暂停播放 */
    JS_Pause: (index: number) => Promise<void>;
    /** 恢复播放 */
    JS_Resume: (index: number) => Promise<void>;
    /** 回放定位 */
    JS_Seek: (index: number, startTime: string, endTime: string) => Promise<void>;
    /** 慢放 */
    JS_Slow: () => Promise<number>;
    /** 快放 */
    JS_Fast: () => Promise<number>;
    /** 单帧前进 */
    JS_FrameForward: (index: number) => Promise<void>;
    /** 单帧后退 */
    JS_FrameBack: (index: number) => Promise<void>;
    /** 开启声音 */
    JS_OpenSound: () => Promise<void>;
    /** 关闭声音 */
    JS_CloseSound: () => Promise<void>;
    /** 设置音量 */
    JS_SetVolume: (index: number, volume: number) => Promise<void>;
    /** 抓图 */
    JS_CapturePicture: (index: number, name: string, type: string) => Promise<void>;
    /** 开始录制 */
    JS_StartSaveEx: (index: number, fileName: string, typeCode: number, options: any) => Promise<void>;
    /** 停止录制 */
    JS_StopSave: (index: number) => Promise<void>;
    /** 电子放大开启 */
    JS_EnableZoom: (index: number) => Promise<void>;
    /** 电子放大关闭 */
    JS_DisableZoom: (index: number) => Promise<void>;
    /** 开启/关闭智能信息 */
    JS_RenderALLPrivateData: (index: number, open: boolean) => Promise<void>;
    /** 当前选中窗口索引 */
    currentWindowIndex: number;
}

// 声明全局变量以支持第三方 H5Player 脚本
declare global {
  interface Window {
    JSPlugin: any;
  }
}

/**
 * H5Player 组件
 * 集成海康视频 H5Player 插件，提供实时预览、回放及控制功能
 */
const H5Player: React.FC = () => {
    // 播放器实例引用
    const playerRef = useRef<H5PlayerInstance | null>(null);
    // 播放器容器引用
    const containerRef = useRef<HTMLDivElement>(null);
    // Ant Design 主题 Token
    const { token } = theme.useToken();
    // 脚本加载状态
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    // 当前分屏数量
    const [splitNum, setSplitNum] = useState<string | number>(2); 
    
    // 动态注入样式 - 兼容暗黑模式及主题色适配
    const segmentedStyle = `
        .player-segmented.ant-segmented .ant-segmented-item-selected {
            background-color: ${token.colorPrimary} !important;
            color: #fff !important;
        }
        .player-segmented.ant-segmented .ant-segmented-thumb {
            background-color: ${token.colorPrimary} !important;
        }
        .player-segmented.ant-segmented .ant-segmented-item-selected .ant-segmented-item-label {
            color: #fff !important;
        }
        .player-segmented.ant-segmented .ant-segmented-item-selected .anticon {
            color: #fff !important;
        }
        .player-segmented.ant-segmented .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
            color: ${token.colorPrimary} !important;
        }
        /* 移除按钮点击后的聚焦边框（黑色环绕） */
        .ant-btn:focus-visible, 
        .ant-segmented-item:focus-visible, 
        button:focus, 
        div:focus {
            outline: none !important;
            box-shadow: none !important;
        }
        /* 强制视频播放器内部元素圆角 - 全方位 */
        #player canvas, 
        #player video,
        #player .h5player-container {
            border-radius: 8px !important;
            overflow: hidden !important;
        }
    `; 
    
    // 状态量定义
    // 实时预览地址
    const [realplayUrl, setRealplayUrl] = useState('wss://10.19.147.57:6014/proxy/10.19.147.57:559/EUrl/KjuVUic'); 
    // 对讲地址 
    const [talkUrl, setTalkUrl] = useState('wss://10.19.147.57:6014/proxy/10.19.147.57:559/EUrl/KjuVUic');       
    // 回放地址
    const [playbackUrl, setPlaybackUrl] = useState('wss://10.19.147.57:6014/proxy/10.19.147.57:559/EUrl/KjuVUic'); 
    // 回放开始时间
    const [playbackStartTime, setPlaybackStartTime] = useState<string>('2023-08-16T00:00:00');                   
    // 回放结束时间
    const [playbackEndTime, setPlaybackEndTime] = useState<string>('2023-08-16T23:00:00');                     
    // 定位开始时间
    const [playbackSeekStart, setPlaybackSeekStart] = useState<string>('2023-08-16T10:00:00');                   
    // 播放速率
    const [playbackRate, setPlaybackRate] = useState(1);                                                            
    // 静音状态
    const [muted, setMuted] = useState(true);                                                                    
    // 音量
    const [volume, setVolume] = useState(50);                                                                   
    // 控制台当前激活页签
    const [activeTab, setActiveTab] = useState('1');                                                           

    /**
     * 初始化播放器
     * 配置海康 H5Player 插件
     */
    useEffect(() => {
        const initPlayer = () => {
            if (!window.JSPlugin) return;
            const player = new window.JSPlugin({
                szId: 'player',                  // 挂载容器 ID
                szBasePath: '/lib/h5player/',    // 核心库路径
                iMaxSplit: 4,                    // 最大分屏数
                iCurrentSplit: 2,                // 初始化分屏数
                openDebug: true,                 // 开启调试模式
                mseWorkerEnable: false,          // MSE Worker 状态
                bSupporDoubleClickFull: true,    // 支持双击全屏
                oStyle: {
                    borderSelect: token.colorPrimary, // 选中窗口边框颜色跟随主题
                }
            });
            playerRef.current = player;
            window.addEventListener('resize', handleResize);
        };

        // 动态加载 H5Player 脚本
        const script = document.createElement('script');
        script.src = '/lib/h5player/h5player.min.js';
        script.async = true;
        script.onload = () => {
            console.log('H5Player Script Loaded');
            setIsScriptLoaded(true);
            initPlayer();
        };
        script.onerror = () => message.error('Failed to load H5Player script');
        
        // 脚本去重加载
        if (window.JSPlugin) {
            initPlayer();
        } else {
            document.body.appendChild(script);
        }

        return () => {
             if (playerRef.current) playerRef.current = null;
             if (document.body.contains(script)) {
                 document.body.removeChild(script);
             }
             window.removeEventListener('resize', handleResize);
        };
    }, [token.colorPrimary]); // 主题色变更时重新初始化以应用更新

    /**
     * V22 核心优化：引入防抖（Debounce）Resize 机制
     * 解决侧边栏切换、Tab 切换瞬间导致的“画面闪烁”与“布局抖动”问题
     */
    useEffect(() => {
        if (!containerRef.current) return;

        let resizeTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new ResizeObserver(() => {
            if (resizeTimer) clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                requestAnimationFrame(() => {
                    playerRef.current?.JS_Resize();
                });
            }, 100);
        });

        observer.observe(containerRef.current);

        return () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            observer.disconnect();
        };
    }, []);

    /**
     * 监听全屏状态变化
     * 解决全屏退出后容器高度溢出出现滚动条的问题
     */
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                // 退出全屏后延迟触发 resize 确保布局刷新
                setTimeout(() => {
                    playerRef.current?.JS_Resize();
                }, 100);
            }
        };
        // 监听全屏状态变化
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        // Safari 兼容
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            // 移除事件监听
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            // Safari 兼容
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // 窗口尺寸变更处理
    const handleResize = () => playerRef.current?.JS_Resize();

    /**
     * 控制逻辑区
     */
    
    // 分屏排布切换
    const handleArrangeWindow = (value: string | number) => {
        const num = Number(value);
        setSplitNum(num);
        playerRef.current?.JS_ArrangeWindow(num);
    };

    // 整体全屏
    const handleWholeFullScreen = () => playerRef.current?.JS_FullScreenDisplay(true);
    // 选中窗口全屏
    const handleSingleFullScreen = () => {
        const index = playerRef.current?.currentWindowIndex || 0;
        playerRef.current?.JS_FullScreenSingle(index);
    };

    // 开始预览
    const handleRealplay = () => {
        if (!playerRef.current) return;
        const index = playerRef.current.currentWindowIndex;
        playerRef.current.JS_Play(realplayUrl, { playURL: realplayUrl, mode: 0 }, index).then(
            () => message.success('开始预览'),
            () => message.error('预览失败')
        );
    };

    // 停止当前播放
    const handleStopPlay = () => {
        playerRef.current?.JS_Stop().then(() => setPlaybackRate(1));
    };

    // 停止所有窗口
    const handleStopAll = () => {
        playerRef.current?.JS_StopRealPlayAll().then(() => setPlaybackRate(1));
    };

    // 开启对讲
    const handleTalkStart = () => {
        playerRef.current?.JS_StartTalk(talkUrl, {}).then(
            () => message.success('开始对讲'),
            () => message.error('对讲失败')
        );
    };

    // 停止对讲
    const handleTalkStop = () => playerRef.current?.JS_StopTalk();

    /**
     * 录像回放逻辑
     */
    const handlePlaybackStart = () => {
        if (!playerRef.current) return;
        const index = playerRef.current.currentWindowIndex;
        // 格式化时间符合插件要求
        const start = playbackStartTime + ".000+08:00";
        const end = playbackEndTime + ".000+08:00";
        playerRef.current.JS_Play(playbackUrl, { playURL: playbackUrl, mode: 0 }, index, start, end).then(
            () => { setPlaybackRate(1); message.success('录像回放启动'); },
            () => message.error('回放失败')
        );
    };
    /**
     * 暂停回放
     */
    const handlePlaybackPause = () => playerRef.current?.JS_Pause(playerRef.current?.currentWindowIndex || 0);
    /**
     * 恢复回放
     */
    const handlePlaybackResume = () => playerRef.current?.JS_Resume(playerRef.current?.currentWindowIndex || 0);
    /**
     * 定位回放
     */
    const handleSeekTo = () => {
        const index = playerRef.current?.currentWindowIndex || 0;
        const seek = playbackSeekStart + ".000+08:00";
        const end = playbackEndTime + ".000+08:00";
        playerRef.current?.JS_Seek(index, seek, end);
    };
    /**
     * 慢放
     */
    const handleSlow = () => playerRef.current?.JS_Slow().then(rate => setPlaybackRate(rate));
    /**
     * 快放
     */
    const handleFast = () => playerRef.current?.JS_Fast().then(rate => setPlaybackRate(rate));
    /**
     * 单帧前进
     */
    const handleFrameForward = () => playerRef.current?.JS_FrameForward(playerRef.current?.currentWindowIndex || 0);
    /**
     * 单帧后退
     */
    const handleFrameBack = () => playerRef.current?.JS_FrameBack(playerRef.current?.currentWindowIndex || 0);

    /**
     * 音频与工具函数
     */
    const handleToggleSound = () => {
        if (muted) {
            playerRef.current?.JS_OpenSound().then(() => setMuted(false));
        } else {
            playerRef.current?.JS_CloseSound().then(() => setMuted(true));
        }
    };
    /**
     * 设置音量
     */
    const handleSetVolume = (val: number) => {
        setVolume(val);
        playerRef.current?.JS_SetVolume(playerRef.current?.currentWindowIndex || 0, val);
    };
    /**
     * 抓图
     */
    const handleCapture = (type: 'JPEG' | 'BMP') => {
        playerRef.current?.JS_CapturePicture(playerRef.current?.currentWindowIndex || 0, 'capture', type)
            .then(() => message.success('抓图成功'));
    };
    /**
     * 电子放大开启
     */
    const handleEnlarge = () => playerRef.current?.JS_EnableZoom(playerRef.current?.currentWindowIndex || 0);
    /**
     * 电子放大关闭
     */
    const handleEnlargeClose = () => playerRef.current?.JS_DisableZoom(playerRef.current?.currentWindowIndex || 0);

    // 控制台页签定义
    const tabItems = [
        {
            key: '1',
            label: <span><VideoCameraOutlined /> 实时预览</span>,
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space.Compact style={{ width: '100%' }}>
                        <Button icon={<VideoCameraOutlined />} />
                        <Input 
                            value={realplayUrl} 
                            onChange={e => setRealplayUrl(e.target.value)} 
                            placeholder="请输入 WebSocket URL"
                        />
                    </Space.Compact>
                    <Space.Compact style={{ width: '100%' }}>
                        <Button icon={<AudioOutlined />} />
                        <Input 
                            placeholder="对讲 URL"
                            value={talkUrl} 
                            onChange={e => setTalkUrl(e.target.value)} 
                        />
                    </Space.Compact>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row gutter={[12, 12]}>
                        <Col span={12}><Button type="primary" block icon={<PlayCircleOutlined />} onClick={handleRealplay}>开始预览</Button></Col>
                        <Col span={12}><Button danger block icon={<StopOutlined />} onClick={handleStopPlay}>停止播放</Button></Col>
                        <Col span={12}><Button type="primary" ghost block icon={<AudioOutlined />} onClick={handleTalkStart}>开始对讲</Button></Col>
                        <Col span={12}><Button block icon={<MutedOutlined />} onClick={handleTalkStop}>结束对讲</Button></Col>
                        <Col span={24}><Button danger block onClick={handleStopAll}>停止所有窗口</Button></Col>
                    </Row>
                </Space>
            )
        },
        {
            key: '2',
            label: <span><PlaySquareOutlined /> 录像回放</span>,
            children: (
                 <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space.Compact style={{ width: '100%' }}>
                        <Button icon={<PlaySquareOutlined />} />
                        <Input value={playbackUrl} onChange={e => setPlaybackUrl(e.target.value)} />
                    </Space.Compact>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Input prefix={<ClockCircleOutlined />} value={playbackStartTime} onChange={e => setPlaybackStartTime(e.target.value)} placeholder="开始时间" />
                        </Col>
                        <Col span={12}>
                             <Input prefix={<ClockCircleOutlined />} value={playbackEndTime} onChange={e => setPlaybackEndTime(e.target.value)} placeholder="结束时间" />
                        </Col>
                    </Row>
                    <Row gutter={[8, 8]}>
                        <Col span={8}><Button type="primary" block onClick={handlePlaybackStart}>回放</Button></Col>
                        <Col span={8}><Button block onClick={handlePlaybackPause}>暂停</Button></Col>
                        <Col span={8}><Button block onClick={handlePlaybackResume}>恢复</Button></Col>
                    </Row>
                    
                    <Card size="small" title="播放控制" styles={{ body: { padding: '12px' } }}>
                        <Space wrap size="small">
                            <Tooltip title="慢放"><Button icon={<StepBackwardOutlined />} onClick={handleSlow} /></Tooltip>
                            <Tag color="blue">{playbackRate}x</Tag>
                            <Tooltip title="快放"><Button icon={<FastForwardOutlined />} onClick={handleFast} /></Tooltip>
                            <Divider type="vertical" />
                            <Tooltip title="单帧后退"><Button onClick={handleFrameBack}>&lt;</Button></Tooltip>
                            <Tooltip title="单帧前进"><Button onClick={handleFrameForward}>&gt;</Button></Tooltip>
                        </Space>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                             <Input size="small" value={playbackSeekStart} onChange={e => setPlaybackSeekStart(e.target.value)} style={{ flex: 1 }} />
                             <Button size="small" type="primary" ghost onClick={handleSeekTo}>Seek</Button>
                        </div>
                    </Card>
                </Space>
            )
        },
        {
            key: '3',
            label: <span><SettingOutlined /> 工具箱</span>,
            children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                     <Card size="small" title="音频控制">
                        <Row align="middle" gutter={16}>
                            <Col flex="40px">
                                <Button 
                                    type="text" 
                                    icon={muted ? <MutedOutlined /> : <SoundOutlined />} 
                                    onClick={handleToggleSound}
                                />
                            </Col>
                            <Col flex="auto">
                                <Slider value={volume} onChange={handleSetVolume} disabled={muted} />
                            </Col>
                        </Row>
                     </Card>
                     
                     <Card size="small" title="画面操作" style={{ marginTop: 12 }}>
                        <Space wrap>
                            <Button icon={<CameraOutlined />} onClick={() => handleCapture('JPEG')}>JPEG</Button>
                            <Button icon={<CameraOutlined />} onClick={() => handleCapture('BMP')}>BMP</Button>
                            <Button icon={<ZoomInOutlined />} onClick={handleEnlarge}>电子放大</Button>
                            <Button icon={<ZoomOutOutlined />} onClick={handleEnlargeClose}>关闭放大</Button>
                             <Button icon={<InfoCircleOutlined />} onClick={() => playerRef.current?.JS_RenderALLPrivateData(0, true)}>开启智能信息</Button>
                        </Space>
                     </Card>
                </Space>
            )
        }
    ];

    /**
     * 渲染视图
     */
    return (
        <Row gutter={24} style={{ height: 'calc(100vh - 190px)', overflow: 'hidden' }}> 
            {/* 视频展示区 */}
            <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Card 
                    styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
                    style={{ flex: 1, overflow: 'hidden', maxHeight: '100%' }}
                >
                    <style>{segmentedStyle}</style>
                    {/* 视频包装器 - 实现全方位圆角裁剪 */}
                    <div style={{
                        flex: '1 1 auto',
                        borderRadius: '12px',      // 外层大圆角
                        minHeight: '300px',
                        maxHeight: 'calc(100% - 70px)', 
                        margin: '4px 4px 0 4px',   // 留出间隙展现圆角效果
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#000'
                    }}>
                        {/* 播放器实际挂载点 */}
                        <div 
                            id="player" 
                            ref={containerRef}
                            style={{ 
                                height: '100%',
                                width: '100%',
                            }}
                        ></div>
                    </div>
                    {/* 底部控制工具栏 */}
                    <div style={{ 
                        padding: '12px 24px', 
                        borderTop: `1px solid ${token.colorBorderSecondary}`, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: token.colorBgContainer,
                        borderRadius: '0 0 8px 8px' // 底部两角圆润配合 Card
                    }}>
                        <Space>
                            <Text strong>分屏:</Text>
                            <Segmented 
                                className="player-segmented"
                                options={[
                                    { label: <Tooltip title="1x1"><AppstoreOutlined /> 1</Tooltip>, value: 1 },
                                    { label: <Tooltip title="2x2"><AppstoreOutlined /> 4</Tooltip>, value: 2 },
                                    { label: <Tooltip title="3x3"><AppstoreOutlined /> 9</Tooltip>, value: 3 },
                                    { label: <Tooltip title="4x4"><AppstoreOutlined /> 16</Tooltip>, value: 4 },
                                ]} 
                                value={splitNum} 
                                onChange={handleArrangeWindow}
                            />
                        </Space>
                        <Space>
                            <Tooltip title="单窗口全屏"><Button icon={<ExpandOutlined />} onClick={handleSingleFullScreen} /></Tooltip>
                            <Tooltip title="整体全屏"><Button type="primary" icon={<FullscreenOutlined />} onClick={handleWholeFullScreen}>全屏</Button></Tooltip>
                        </Space>
                    </div>
                </Card>
            </Col>
            
            {/* 右侧控制面板 */}
            <Col xs={24} lg={8}>
                <Card 
                    style={{ height: '100%' }} 
                    styles={{ body: { padding: '0 16px 16px' } }}
                    title={<Space><ControlOutlined /><span>控制台</span></Space>}
                >
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                </Card>
            </Col>
        </Row>
    );
};

export default H5Player;
