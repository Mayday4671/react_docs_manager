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

// 临时占位组件，后续可继续标准化迁移
const UserData = () => <div>用户数据模块 (标准化准备中)</div>;
const Monitoring = () => <div>视频监控模块 (标准化准备中)</div>;
const Uploads = () => <div>文件上传模块 (标准化准备中)</div>;

// Fallback component
const NotFound = () => <div>Page Not Found</div>;

// Map menu keys to component constructors (not instances!)
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
};

export const getComponentByKey = (key: string): React.ReactNode => {
    const Component = componentMap[key] || NotFound;
    return <Component />;
};
