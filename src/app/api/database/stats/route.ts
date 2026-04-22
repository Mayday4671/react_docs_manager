/**
 * @file route.ts
 * @description 数据库统计信息 API 路由，汇总各业务表的记录数及元数据
 * @module 系统管理 / 数据库统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

/**
 * GET /api/database/stats
 *
 * 并发查询各业务表的记录数，返回带有显示名称、图标、颜色、描述及路由的统计列表。
 *
 * @param request - Next.js 请求对象
 * @returns 包含各表统计信息数组的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const [
      userCount,
      roleCount,
      menuCount,
      configCount,
      logCount,
      notificationCount,
      changelogCount,
      fileCount
    ] = await Promise.all([
      prisma.sysUser.count(),
      prisma.sysRole.count(),
      prisma.sysMenu.count(),
      prisma.sysConfig.count(),
      prisma.sysLog.count(),
      prisma.tblNotification.count(),
      prisma.tblChangelog.count(),
      prisma.tblFile.count()
    ]);

    const tableStats = [
      {
        name: 'sys_user',
        displayName: '用户管理',
        icon: 'UserOutlined',
        color: '#1890ff',
        count: userCount,
        description: '系统用户信息，包含用户名、密码、邮箱、手机号等',
        route: '/system/users',
        category: 'system'
      },
      {
        name: 'sys_role',
        displayName: '角色管理',
        icon: 'TeamOutlined',
        color: '#722ed1',
        count: roleCount,
        description: '系统角色信息，用于权限控制和用户分组',
        route: '/system/roles',
        category: 'system'
      },
      {
        name: 'sys_menu',
        displayName: '菜单管理',
        icon: 'MenuOutlined',
        color: '#13c2c2',
        count: menuCount,
        description: '系统菜单配置，控制导航栏显示',
        route: '/system/menus',
        category: 'system'
      },
      {
        name: 'sys_config',
        displayName: '系统配置',
        icon: 'SettingOutlined',
        color: '#fa8c16',
        count: configCount,
        description: '系统配置参数，如系统名称、版本等',
        route: '/system/configs',
        category: 'system'
      },
      {
        name: 'sys_log',
        displayName: '日志管理',
        icon: 'FileTextOutlined',
        color: '#eb2f96',
        count: logCount,
        description: '系统操作日志，记录所有用户操作',
        route: '/system/logs',
        category: 'system'
      },
      {
        name: 'tbl_notification',
        displayName: '通知管理',
        icon: 'BellOutlined',
        color: '#52c41a',
        count: notificationCount,
        description: '系统通知公告，支持多种类型和优先级',
        route: '/business/notifications',
        category: 'business'
      },
      {
        name: 'tbl_changelog',
        displayName: '更新日志',
        icon: 'RocketOutlined',
        color: '#2f54eb',
        count: changelogCount,
        description: '系统版本更新记录，记录每个版本的变更',
        route: '/business/changelogs',
        category: 'business'
      },
      {
        name: 'tbl_file',
        displayName: '文件管理',
        icon: 'FileOutlined',
        color: '#faad14',
        count: fileCount,
        description: '文件上传记录，包含文件信息和下载统计',
        route: '/business/files',
        category: 'business'
      }
    ];

    return NextResponse.json({
      success: true,
      data: tableStats
    });
  } catch (error) {
    console.error('获取数据库统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据库统计失败' },
      { status: 500 }
    );
  }
}
