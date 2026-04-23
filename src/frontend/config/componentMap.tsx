/**
 * @file componentMap.tsx
 * @description 菜单 key 到 React 组件的映射表，用于根据菜单配置动态渲染对应页面组件
 * @module 路由配置
 */

import React from 'react';
import Home from '@/frontend/components/dashboard/Home';
import H5Player from '@/frontend/components/player/H5Player';
import UserManagement from '@/frontend/components/system/UserManagement';
import RoleManagement from '@/frontend/components/system/RoleManagement';
import NotificationManagement from '@/frontend/components/system/NotificationManagement';
import LogManagement from '@/frontend/components/system/LogManagement';
import ConfigManagement from '@/frontend/components/system/ConfigManagement';
import DatabaseManagement from '@/frontend/components/system/DatabaseManagement';
import ChangelogManagement from '@/frontend/components/business/ChangelogManagement';
import FileManagement from '@/frontend/components/business/FileManagement';
import HkApiDocs from '@/frontend/components/hk/HkApiDocs';
import DocNotes from '@/frontend/components/docs/DocNotes';
import MenuManagement from '@/frontend/components/system/MenuManagement';
import ProfilePage from '@/frontend/components/auth/ProfilePage';
import AiChat from '@/frontend/components/ai/AiChat';

/** 临时占位组件：用户数据模块，后续可继续标准化迁移 */
const UserData = () => <div>用户数据模块 (标准化准备中)</div>;
/** 临时占位组件：视频监控模块，后续可继续标准化迁移 */
const Monitoring = () => <div>视频监控模块 (标准化准备中)</div>;
/** 临时占位组件：文件上传模块，后续可继续标准化迁移 */
const Uploads = () => <div>文件上传模块 (标准化准备中)</div>;

/** 兜底组件，当菜单 key 未在 componentMap 中注册时渲染 */
const NotFound = () => <div>Page Not Found</div>;

/**
 * 菜单 key 到组件构造函数的映射表
 * key 对应数据库中菜单的 key 字段，value 为对应的 React 组件（非实例）
 */
const componentMap: Record<string, React.ComponentType> = {
    'home': Home,
    '1': UserData,
    '2': Monitoring,
    '3': Uploads,
    'h5-player': H5Player,
    'user-management': UserManagement,
    'role-management': RoleManagement,
    'notification-management': NotificationManagement,
    'log-management': LogManagement,
    'config-management': ConfigManagement,
    'database-management': DatabaseManagement,
    'changelog-management': ChangelogManagement,
    'file-management': FileManagement,
    'hk-api-docs': HkApiDocs,
    'doc-notes': DocNotes,
    'menu-management': MenuManagement,
    'profile': ProfilePage,
    'ai-chat': AiChat,
};

/**
 * 根据菜单 key 获取对应的 React 组件节点
 *
 * @param key - 菜单 key，对应 componentMap 中的键
 * @returns 对应组件的 React 节点，未找到时返回 NotFound 组件节点
 */
export const getComponentByKey = (key: string): React.ReactNode => {
    const Component = componentMap[key] || NotFound;
    return <Component />;
};
