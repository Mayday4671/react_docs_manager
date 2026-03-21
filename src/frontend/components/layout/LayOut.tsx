
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
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Tabs, Breadcrumb, Spin } from "antd";
import type { MenuProps } from 'antd';
const reactLogo = "/react.svg"; // Next.js standard: reference public assets as strings
import "@/frontend/styles/globals.css"; 
import "@/frontend/styles/LayOut.css"; // 引入布局专有样式
import { useTheme } from "@/frontend/context/ThemeContext";
import ThemeSettings from "./ThemeSettings";
import { getComponentByKey } from "@/frontend/config/componentMap";

const { Header, Sider, Content } = Layout;

// 数据库菜单项类型
interface DbMenuItem {
  id: number;
  key: string;
  label: string;
  icon?: string;
  parentId?: number;
  orderNum: number;
  children?: DbMenuItem[];
}

/**
 * 映射菜单图标
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
 * 转换菜单数据
 * @param data 
 * @returns 
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
 * 标签页类型
 */
interface TabItem {
    label: React.ReactNode;
    key: string;
    children: React.ReactNode;
    closable: boolean;
    icon?: React.ReactNode;
}

/**
 * 布局组件
 * @returns 
 */
const LayOut: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuData, setMenuData] = useState<DbMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemName, setSystemName] = useState('My App'); // 系统名称状态
  
  const {
    token, // 获取完整token
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { layout, darkMode } = useTheme();

  // 标签页状态
  const initialPanes: TabItem[] = [
    { label: '首页', key: 'home', children: getComponentByKey('home'), closable: false, icon: <HomeOutlined /> },
  ];
  const [activeKey, setActiveKey] = useState(initialPanes[0].key);
  const [items, setItems] = useState<TabItem[]>(initialPanes);
  
  // 监听 activeKey 变化，更新浏览器标题
  useEffect(() => {
    const currentTab = items.find(item => item.key === activeKey);
    if (currentTab && typeof document !== 'undefined') {
      const title = typeof currentTab.label === 'string' ? currentTab.label : '页面';
      document.title = `${title} - ${systemName}`;
    }
  }, [activeKey, items, systemName]);
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
      position: { x: number; y: number };
      visible: boolean;
      targetKey: string;
  }>({
      position: { x: 0, y: 0 },
      visible: false,
      targetKey: '',
  });

  // 获取菜单数据
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

  // 获取系统配置
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

  // 菜单项
  const menuItems = transformMenuData(menuData);

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
  }, [settingsOpen, menuItems, items, activeKey]); // 增加依赖以确保 onMenuClick 闭包正确

  /**
   * 菜单点击事件
   * @param e 
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
  // 标签页编辑事件  
  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      remove(targetKey as string);
    }
  };

/**
 * 删除标签页
 * @param targetKey 
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
   * 右键菜单
   * @param e 
   * @param key 
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
 * 关闭其他
 */
  const closeOthers = () => {
      const targetKey = contextMenu.targetKey;
      const newPanes = items.filter(item => item.key === 'home' || item.key === targetKey);
      setItems(newPanes);
      setActiveKey(targetKey);
      setContextMenu(prev => ({ ...prev, visible: false }));
  };
/**、
 * 关闭所有
 */
  const closeAll = () => {
      const newPanes = items.filter(item => item.key === 'home');
      setItems(newPanes);
      setActiveKey('home');
      setContextMenu(prev => ({ ...prev, visible: false }));
  };

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
            <div></div>
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
                  defaultOpenKeys={["hk-test"]}
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
                  
                  <div></div>
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
                minHeight: 280,
                background: 'transparent',
                borderRadius: borderRadiusLG,
                overflow: 'auto',
                position: 'relative'
              }}
            >
               {/* 内容卡片容器 */}
               <div style={{
                 background: colorBgContainer,
                 borderRadius: borderRadiusLG,
                 padding: 24,
                 minHeight: 'calc(100vh - 200px)',
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
    </Layout>
  );
};

export default LayOut;
