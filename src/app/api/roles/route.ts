/**
 * @file route.ts
 * @description 角色管理 CRUD API 路由，支持获取、创建、更新、删除操作
 * @module 系统管理 / 角色管理
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRole, getRoles, updateRole, deleteRole } from '@/backend/services/roleService';

/**
 * GET /api/roles
 *
 * 获取全部角色列表，同时返回每个角色关联的用户数量。
 *
 * @param request - Next.js 请求对象
 * @returns 包含角色数组的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const roles = await getRoles();
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json({ success: false, message: '获取角色列表失败' }, { status: 500 });
  }
}

/**
 * POST /api/roles
 *
 * 创建新角色。
 *
 * @param request - Next.js 请求对象，body 为角色数据 JSON
 * @returns 包含新建角色记录的 JSON 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = await createRole(body);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json({ success: false, message: '创建角色失败' }, { status: 500 });
  }
}

/**
 * PUT /api/roles
 *
 * 更新指定 ID 的角色信息。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后角色记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少角色ID' }, { status: 400 });
    }
    const role = await updateRole(id, data);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('更新角色失败:', error);
    return NextResponse.json({ success: false, message: '更新角色失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/roles?id={id}
 *
 * 删除指定 ID 的角色。
 * 注意：删除前需确保该角色下没有关联用户。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少角色ID' }, { status: 400 });
    }
    await deleteRole(parseInt(id));
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json({ success: false, message: '删除角色失败' }, { status: 500 });
  }
}
