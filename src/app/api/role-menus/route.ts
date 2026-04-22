/**
 * @file route.ts
 * @description 角色菜单权限 API 路由，支持查询和设置角色拥有的菜单权限
 * @module 系统管理 / 角色权限
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoleMenuIds, setRoleMenus } from '@/backend/services/authService';

/**
 * GET /api/role-menus?roleId={id}
 * 获取指定角色已拥有的菜单 ID 列表。
 *
 * @param request - Next.js 请求对象，查询参数须包含 roleId
 * @returns 菜单 ID 数组
 */
export async function GET(request: NextRequest) {
  try {
    const roleId = parseInt(request.nextUrl.searchParams.get('roleId') || '');
    if (!roleId) {
      return NextResponse.json({ success: false, error: '缺少 roleId' }, { status: 400 });
    }
    const menuIds = await getRoleMenuIds(roleId);
    return NextResponse.json({ success: true, data: menuIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/role-menus
 * 为角色批量设置菜单权限（先清空再写入，传空数组则清空所有权限）。
 *
 * @param request - Next.js 请求对象，body 须包含 roleId 和 menuIds 数组
 * @returns 操作结果
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, menuIds } = body;
    if (!roleId) {
      return NextResponse.json({ success: false, error: '缺少 roleId' }, { status: 400 });
    }
    await setRoleMenus(roleId, menuIds || []);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
