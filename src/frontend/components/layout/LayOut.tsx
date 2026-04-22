/**
 * @file LayOut.tsx
 * @description 应用主布局组件，包含侧边栏菜单、顶部导航、多标签页管理及主题设置入口
 * @module 布局
 */

import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  HomeOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  SettingOutlined,
  TeamOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BellOutlined,
  RocketOutlined,
  FileOutlined,
  MenuOutlined,
  ApiOutlined,
  FolderOpenOutlined,
  BookOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Tabs, Breadcrumb, Spin, Tooltip } from "antd";
import type { MenuProps } from 'antd';
const reactLogo = "/react.svg";
import "@/frontend/styles/globals.css"; 
import "@/frontend/styles/LayOut.css";
import { useTheme } from "@/frontend/context/ThemeContext";
import ThemeSettings from "./ThemeSettings";
import { getComponentByKey } from "@/frontend/config/componentMap";
import GlobalSearch from "@/frontend/components/search/GlobalSearch";

const { Header, Sider, Content } = Layout;

/**
 * 数据库菜单项数据结构
 */
interface DbMenuItem {
  /** 菜单唯一标识 */
  id: number;
  /** 菜单路由 key，对应 componentMap 中的组件 key */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 菜单图标名称，对应 iconMap 中的 key */
  icon?: string;
  /** 父菜单 ID，undefined 表示顶级菜单 */
  parentId?: number;
  /** 排序序号，数值越小越靠前 */
  orderNum: number;
  /** 子菜单列表（由后端关联查询返回） */
  children?: DbMenuItem[];
}

/**
 * 图标名称到 React 节点的映射表，用于将数据库中存储的图标字符串转换为 Ant Design 图标组件
 */
const iconMap: Record<string, React.ReactNode> = {
    HomeOutlined: <HomeOutlined />,
    UserOutlined: <UserOutlined />,
    VideoCameraOutlined: <VideoCameraOutlined />,
    UploadOutlined: <UploadOutlined />,
    ToolOutlined: <ToolOutlined />,
    PlayCircleOutlined: <PlayCircleOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    SettingOutlined: <SettingOutlined />,
    TeamOutlined: <TeamOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
    BellOutlined: <BellOutlined />,
    RocketOutlined: <RocketOutlined />,
    FileOutlined: <FileOutlined />,
    MenuOutlined: <MenuOutlined />,
    ApiOutlined: <ApiOutlined />,
    FolderOpenOutlined: <FolderOpenOutlined />,
    BookOutlined: <BookOutlined />,
};

/**
 * 将数据库菜单数据转换为 Ant Design Menu 组件所需的 items 格式。
 * 递归处理子菜单，图标名称通过 iconMap 映射为 React 节点。
 *
 * @param data - 数据库菜单项列表（支持嵌套）
 * @returns Ant Design MenuProps['items'] 格式的菜单配置
 */
const transformMenuData = (data: DbMenuItem[]): MenuProps['items'] => {
    return data.map(item => {
        const menuItem: any = {
            key: item.key,
            icon: item.icon ? iconMap[item.icon] : null,
            label: item.label,
        };
        if (item.children && item.children.length > 0) {
            menuItem.children = transformMenuData(item.children);
        }
        return menuItem;
    });
};

/**
 * 根据当前激活的菜单 key 在菜单树中查找面包屑路径。
 *
 * @param data - 菜单树数据
 * @param targetKey - 目标菜单项的 key
 * @returns 面包屑路径数组（从根到目标节点），未找到时返回 null
 */
const findBreadcrumbPath = (data: DbMenuItem[], targetKey: string): { title: string }[] | null => {
    for (const item of data) {
        if (item.key === targetKey) {
            return [{ title: item.label }];
        }
        if (item.children) {
            const childPath = findBreadcrumbPath(item.children, targetKey);
            if (childPath) {
                return [{ title: item.label }, ...childPath];
            }
        }
    }
    return null;
};
/**
 * 多标签页标签项数据结构
 */
interface TabItem {
    /** 标签页显示标题（支持 ReactNode，可含图标） */
    label: React.ReactNode;
    /** 标签页唯一 key，与菜单 key 对应 */
    key: string;
    /** 标签页内容区渲染的组件 */
    children: React.ReactNode;
    /** 是否可关闭，首页标签不可关闭 */
    closable: boolean;
    /** 标签页图标 */
    icon?: React.ReactNode;
}

/**
 * 应用主布局组件
 *
 * 提供侧边栏菜单导航、顶部 Header、多标签页内容区、主题设置面板和全局搜索功能。
 * 支持 side / top / mix 三种布局模式，通过 ThemeContext 切换。
 *
 * @returns 完整的应用布局 JSX
 */
const LayOut: React.FC = () => {
  /** 侧边栏折叠状态 */
  const [collapsed, setCollapsed] = useState(false);
  /** 主题设置面板是否打开 */
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 从服务端加载的菜单树数据 */
  const [menuData, setMenuData] = useState<DbMenuItem[]>([]);
  /** 菜单数据加载状态 */
  const [loading, setLoading] = useState(true);
  /** 系统名称，从系统配置接口获取 */
  const [systemName, setSystemName] = useState('My App');
  /** 全局搜索弹窗是否打开 */
  const [searchOpen, setSearchOpen] = useState(false);
  
  const {
    token, // 获取完整token
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { layout, darkMode } = useTheme();

  /** 初始标签页列表，包含不可关闭的首页标签 */
  const initialPanes: TabItem[] = [
    { label: '首页', key: 'home', children: getComponentByKey('home'), closable: false, icon: <HomeOutlined /> },
  ];
  /** 当前激活的标签页 key */
  const [activeKey, setActiveKey] = useState(initialPanes[0].key);
  /** 已打开的标签页列表 */
  const [items, setItems] = useState<TabItem[]>(initialPanes);
  
  // 监听 activeKey 变化，更新浏览器标题
  useEffect(() => {
    const currentTab = items.find(item => item.key === activeKey);
    if (currentTab && typeof document !== 'undefined') {
      const title = typeof currentTab.label === 'string' ? currentTab.label : '页面';
      document.title = `${title} - ${systemName}`;
    }
  }, [activeKey, items, systemName]);
  
  /** 右键菜单状态：位置坐标、是否可见、目标标签页 key */
  const [contextMenu, setContextMenu] = useState<{
      position: { x: number; y: number };
      visible: boolean;
      targetKey: string;
  }>({
      position: { x: 0, y: 0 },
      visible: false,
      targetKey: '',
  });

  /**
   * 从服务端拉取菜单数据并更新 state。
   * 失败时降级为空菜单，不阻断页面渲染。
   */
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch menu data');
        }
        const data = await response.json();
        setMenuData(data);
      } catch (error) {
        console.error('Error fetching menu data:', error);
        // 如果API失败，可以设置一个默认的菜单或显示错误
        setMenuData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  /**
   * 从服务端拉取系统配置，提取 system.name 更新浏览器标题前缀。
   * 每 30 秒轮询一次，确保配置变更后自动生效。
   */
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const response = await fetch('/api/configs');
        if (response.ok) {
          const data = await response.json();
          const systemNameConfig = data.data?.find((config: any) => config.configKey === 'system.name');
          if (systemNameConfig) {
            setSystemName(systemNameConfig.configValue);
          }
        }
      } catch (error) {
        console.error('Error fetching system config:', error);
      }
    };

    fetchSystemConfig();
    
    // 每30秒刷新一次系统配置
    const interval = setInterval(fetchSystemConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * 注册全局快捷键 Ctrl+K（Mac 为 Cmd+K），触发全局搜索弹窗。
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * 动态注入 CSS 变量，将 Ant Design 主题色同步到 antd 表格滚动条样式。
   * 深色模式和浅色模式使用不同的滚动条轨道背景色。
   */
  useEffect(() => {
    const styleId = 'antd-table-scrollbar-override';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .ant-table-wrapper .ant-table {
        scrollbar-color: ${token.colorPrimary} ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} !important;
        scrollbar-width: thin !important;
      }
      .ant-table-wrapper .ant-table-body {
        scrollbar-color: ${token.colorPrimary} ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} !important;
        scrollbar-width: thin !important;
      }
    `;
    return () => {
      styleEl?.remove();
    };
  }, [token.colorPrimary, darkMode]);

  /**
 * 监听点击事件与导航事件
 */
  useEffect(() => {
    // 处理导航跳转事件
    const handleSwitchTab = (e: any) => {
        const { key } = e.detail || {};
        if (key) {
            // 模拟菜单点击逻辑来跳转
            onMenuClick?.({ key } as any);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // 如果点击的是右键菜单内部，则不关闭
        if (target.closest('.custom-context-menu')) {
            return;
        }

        // 关闭右键菜单
        setContextMenu(prev => ({ ...prev, visible: false }));
        
        if (!settingsOpen) return;
        // 关闭设置面板
        if (target.closest('.theme-settings-drawer') || 
            target.closest('.ant-color-picker-popover') ||
            target.closest('.ant-popover') ||
            target.closest('.ant-dropdown') ||
            target.closest('.ant-select-dropdown') ||
            target.closest('.ant-picker-dropdown')) {
            return;
        }
        setSettingsOpen(false);
    };

    // V23 Next.js Standard: 仅在客户端执行 DOM/Window 操作
    if (typeof window !== 'undefined') {
        window.addEventListener('switchTab', handleSwitchTab);
        document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('switchTab', handleSwitchTab);
            document.removeEventListener('mousedown', handleClickOutside);
        }
    };
  }, [settingsOpen, items, activeKey]); // menuItems 不是独立变量，从依赖中移除

  /**
   * 菜单点击事件处理器。
   *
   * 根据点击的菜单 key 查找菜单项信息，若对应标签页不存在则新建，
   * 最终将 activeKey 切换到目标标签页。
   *
   * @param e - Ant Design Menu 点击事件对象，包含 key 属性
   */
  const onMenuClick: MenuProps['onClick'] = (e) => {
      // 获取菜单项key
      const { key } = e;
      
      // 简化的查找函数 - 扁平化搜索所有菜单项
      const findMenuItemByKey = (key: string): { label: string; icon: React.ReactNode } => {
        // 递归函数来扁平化菜单数据
        const flattenMenus = (items: DbMenuItem[]): DbMenuItem[] => {
          const result: DbMenuItem[] = [];
          for (const item of items) {
            result.push(item);
            if (item.children && item.children.length > 0) {
              result.push(...flattenMenus(item.children));
            }
          }
          return result;
        };
        
        // 获取扁平化的菜单列表
        const flatMenus = flattenMenus(menuData);
        
        // 查找匹配的菜单项
        const foundItem = flatMenus.find(item => item.key === key);
        
        if (foundItem) {
          return {
            label: foundItem.label,
            icon: foundItem.icon ? iconMap[foundItem.icon] : null
          };
        }
        
        // 如果没找到，返回默认值
        return {
          label: 'New Tab',
          icon: null
        };
      };
      
      // 获取菜单项信息
      const menuInfo = findMenuItemByKey(key);
      const label = menuInfo.label;
      const icon = menuInfo.icon;
      
      // 更新浏览器标签页标题
      if (typeof document !== 'undefined') {
        document.title = `${label} - ${systemName}`;
      }
      
      // 设置当前激活的标签页
      const newActiveKey = key;
      // 创建新的标签页数组
      const newPanes = [...items];
      // 查找是否存在该标签页
      const existPane = newPanes.find((pane) => pane.key === newActiveKey);
      // 如果不存在该标签页，则添加该标签页
      if (!existPane) {
          newPanes.push({
             label: label,
             key: newActiveKey,
             children: getComponentByKey(newActiveKey), 
             closable: true,
             icon: icon 
          });
          setItems(newPanes);
      }
      // 设置当前激活的标签页 
      setActiveKey(newActiveKey);
  };
  /**
   * 标签页编辑事件处理器（目前仅处理 remove 动作）。
   *
   * @param targetKey - 目标标签页 key 或鼠标/键盘事件
   * @param action - 操作类型：'add' | 'remove'
   */
  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      remove(targetKey as string);
    }
  };

/**
 * 删除指定标签页。
 * 若删除的是当前激活标签页，则自动切换到相邻标签页（优先左侧，否则右侧）。
 *
 * @param targetKey - 要删除的标签页 key
 */
  const remove = (targetKey: string) => {
    let newActiveKey = activeKey;
    let lastIndex = -1;
    items.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    // 过滤掉要删除的标签页
    const newPanes = items.filter((item) => item.key !== targetKey);
    // 如果要删除的标签页是当前激活的标签页，则需要切换到其他标签页
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setItems(newPanes);
    setActiveKey(newActiveKey);
  };

  /**
   * 标签页右键菜单触发处理器。
   * 记录鼠标位置和目标标签页 key，显示自定义右键菜单。
   *
   * @param e - 鼠标右键事件
   * @param key - 被右键点击的标签页 key
   */
  const handleContextMenu = (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
          position: { x: e.clientX, y: e.clientY },
          visible: true,
          targetKey: key,
      });
  };
/**
 * 关闭除首页和当前右键目标标签页之外的所有标签页。
 */
  const closeOthers = () => {
      const targetKey = contextMenu.targetKey;
      const newPanes = items.filter(item => item.key === 'home' || item.key === targetKey);
      setItems(newPanes);
      setActiveKey(targetKey);
      setContextMenu(prev => ({ ...prev, visible: false }));
  };
/**
 * 关闭除首页之外的所有标签页，并将激活标签页重置为首页。
 */
  const closeAll = () => {
      const newPanes = items.filter(item => item.key === 'home');
      setItems(newPanes);
      setActiveKey('home');
      setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /**
   * 关闭目标标签页左侧的所有标签页（首页除外）。
   * 若当前激活标签页被关闭，则切换到目标标签页。
   */
  const closeLeft = () => {
      const targetKey = contextMenu.targetKey;
      const targetIndex = items.findIndex(item => item.key === targetKey);
      if (targetIndex === -1) return;
      
      const newPanes = items.filter((item, index) => {
          return item.key === 'home' || index >= targetIndex;
      });
      
      setItems(newPanes);
      if (!newPanes.find(item => item.key === activeKey)) {
          setActiveKey(targetKey);
      }
      setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /**
   * 关闭目标标签页右侧的所有标签页（首页除外）。
   * 若当前激活标签页被关闭，则切换到目标标签页。
   */
  const closeRight = () => {
      const targetKey = contextMenu.targetKey;
      const targetIndex = items.findIndex(item => item.key === targetKey);
      if (targetIndex === -1) return;

      const newPanes = items.filter((item, index) => {
          return item.key === 'home' || index <= targetIndex;
      });
      
      setItems(newPanes);
      if (!newPanes.find(item => item.key === activeKey)) {
          setActiveKey(targetKey);
      }
      setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /** 转换后的 Ant Design Menu items 格式菜单数据 */
  const menuItems = transformMenuData(menuData);

  // 如果正在加载菜单数据，显示加载状态
  if (loading) {
    return (
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
        background: token.colorBgLayout,
        zIndex: 9999
      }}>
        <Spin size="large" style={{ color: token.colorPrimary }} />
        <div style={{ marginTop: 16, color: token.colorText }}>加载菜单数据中...</div>
      </div>
    );
  }

  return (
    // 布局组件
    <Layout 
      style={{ 
        height: "100vh", 
        background: token.colorBgLayout,
        // 设置全局 CSS 变量，供滚动条样式使用
        ['--primary-color' as any]: token.colorPrimary,
        ['--primary-color-bg' as any]: token.colorPrimaryBg,
        ['--primary-color-hover' as any]: token.colorPrimaryHover,
        ['--primary-color-active' as any]: token.colorPrimaryActive,
        ['--color-bg-container' as any]: token.colorBgContainer,
        ['--color-bg-layout' as any]: token.colorBgLayout,
        ['--color-text' as any]: token.colorText,
        ['--color-border' as any]: token.colorBorder,
      }}
      className={darkMode ? 'dark-theme' : 'light-theme'}
    >
       {/* 头部 */}
       {layout === 'mix' && (
        // 头部样式
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: token.colorPrimary,
                    WebkitMaskImage: `url(${reactLogo})`,
                    maskImage: `url(${reactLogo})`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    marginRight: '16px'
                }} />
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{systemName}</span>
            </div>
            <Tooltip title="全局搜索 (Ctrl+K)">
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setSearchOpen(true)}
                style={{ color: token.colorTextSecondary }}
              />
            </Tooltip>
        </Header>
      )}

      <Layout style={{ background: token.colorBgLayout }}>
        {(layout === 'side' || layout === 'mix') && (
            <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                theme={darkMode ? 'dark' : 'light'}
                width={200}
                style={{
                    boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
                    background: darkMode ? '#1f1f1f' : colorBgContainer
                }}
            >
                {layout === 'side' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: token.colorPrimary,
                            WebkitMaskImage: `url(${reactLogo})`,
                            maskImage: `url(${reactLogo})`,
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain'
                        }} />
                    </div>
                )}
                <Menu
                  theme={darkMode ? 'dark' : 'light'}
                  mode="inline"
                  selectedKeys={[activeKey]} 
                  items={menuItems}
                  onClick={onMenuClick}
                  style={{ 
                    borderRight: 0,
                    background: darkMode ? '#1f1f1f' : 'transparent'
                  }}
                />
            </Sider>
        )}
        
        <Layout style={{ background: token.colorBgLayout }}>
            {layout !== 'mix' && (
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24, paddingLeft: layout === 'top' ? 24 : 0 }}>
                  {layout === 'side' ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                              fontSize: "16px",
                              width: 64,
                              height: 64,
                            }}
                          />
                          <Breadcrumb items={
                              activeKey === 'home' 
                                ? [{ title: '首页' }] 
                                : [
                                    { title: <span style={{ cursor: 'pointer' }} onClick={() => setActiveKey('home')}>首页</span> },
                                    ...(findBreadcrumbPath(menuData, activeKey) || [])
                                  ]
                          } style={{ marginLeft: 8 }} />
                      </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: token.colorPrimary,
                            WebkitMaskImage: `url(${reactLogo})`,
                            maskImage: `url(${reactLogo})`,
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            marginRight: '16px'
                        }} />
                        <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '24px' }}>{systemName}</span>
                        <Menu
                            mode="horizontal"
                            selectedKeys={[activeKey]} 
                            items={menuItems}
                            onClick={onMenuClick}
                            style={{ flex: 1, minWidth: 0, borderBottom: 'none', background: 'transparent' }}
                        />
                    </div>
                  )}
                  
                  <Tooltip title="全局搜索 (Ctrl+K)">
                    <Button
                      type="text"
                      icon={<SearchOutlined />}
                      onClick={() => setSearchOpen(true)}
                      style={{ color: token.colorTextSecondary }}
                    />
                  </Tooltip>
                </Header>
            )}

            {/* 右键菜单 */}
            {contextMenu.visible && (
                <div
                    className="custom-context-menu"
                    style={{
                        position: 'fixed',
                        left: contextMenu.position.x,
                        top: contextMenu.position.y,
                        zIndex: 9999,
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        borderRadius: '4px',
                        padding: '4px 0',
                        minWidth: '120px',
                    }}
                >
                    <div 
                        className="context-menu-item"
                        onClick={closeOthers}
                        style={{ padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#333' }}
                    >
                        <CloseOutlined /> 关闭其他
                    </div>
                    <div 
                        className="context-menu-item"
                        onClick={closeAll}
                        style={{ padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#333' }}
                    >
                        <CloseOutlined /> 关闭所有
                    </div>
                    <div 
                        className="context-menu-item"
                        onClick={closeLeft}
                        style={{ padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#333' }}
                    >
                        <ArrowLeftOutlined /> 关闭左侧
                    </div>
                    <div 
                        className="context-menu-item"
                        onClick={closeRight}
                        style={{ padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#333' }}
                    >
                        <ArrowRightOutlined /> 关闭右侧
                    </div>
                </div>
            )}

            {/* 标签页 */}
            <div 
                className={darkMode ? 'dark-tabs-wrapper' : ''}
                style={{ 
                padding: '6px 16px 6px', 
                background: token.colorBgContainer, 
                boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                // Custom Properties for CSS
                ['--primary-color' as any]: token.colorPrimary,
                ['--primary-color-bg' as any]: token.colorPrimaryBg,
            }}>
                 <Tabs
                    type="editable-card"
                    onChange={setActiveKey}
                    activeKey={activeKey}
                    onEdit={onEdit}
                    hideAdd
                    className="mayday-tabs"
                    style={{ marginBottom: 0 }}
                    items={items.map(({ icon, label, ...rest }) => ({
                        ...rest,
                        label: (
                            <span 
                                onContextMenu={(e) => handleContextMenu(e, rest.key)} 
                                style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}
                            >
                                {icon && <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>{icon}</span>}
                                {label}
                            </span>
                        ),
                        children: null 
                    }))}
                 />
            </div>

            {/* Main Content Area */}
            <Content
              style={{
                margin: "16px", 
                padding: 0,
                flex: 1,
                background: 'transparent',
                borderRadius: borderRadiusLG,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
               {/* 内容卡片容器 */}
               <div style={{
                 background: colorBgContainer,
                 borderRadius: borderRadiusLG,
                 padding: 24,
                 height: '100%',
                 boxSizing: 'border-box',
                 overflow: 'hidden',
                 boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
               }}>
                 {/* V20 Keep-Alive: 同时渲染所有已打开的标签页，通过 display 控制显示隐藏 */}
                 {items.map((item) => (
                   <div
                     key={item.key}
                     style={{
                       display: item.key === activeKey ? 'block' : 'none',
                       height: '100%',
                       width: '100%'
                     }}
                   >
                     {item.children}
                   </div>
                 ))}
               </div>
            </Content>
        </Layout>
      </Layout>
 
        <ThemeSettings 
            open={settingsOpen} 
            onClose={() => setSettingsOpen(false)}
            onToggle={() => setSettingsOpen(!settingsOpen)}
        />
        <GlobalSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={(key) => {
            onMenuClick?.({ key } as any);
          }}
        />
    </Layout>
  );
};

export default LayOut;
