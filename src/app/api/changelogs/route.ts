/**
 * @file route.ts
 * @description 更新日志 CRUD API 路由，支持获取、创建、更新、删除操作
 * @module 业务管理 / 更新日志
 */

import { NextRequest, NextResponse } from 'next/server';
import { createChangelog, getChangelogs, updateChangelog, deleteChangelog } from '@/backend/services/changelogService';

/**
 * GET /api/changelogs
 *
 * 获取全部更新日志列表。
 *
 * @param request - Next.js 请求对象
 * @returns 包含日志数组的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const changelogs = await getChangelogs();
    return NextResponse.json({
      success: true,
      data: changelogs
    });
  } catch (error) {
    console.error('获取更新日志列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取更新日志列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/changelogs
 *
 * 创建新的更新日志条目。
 *
 * @param request - Next.js 请求对象，body 为日志数据 JSON
 * @returns 包含新建日志记录的 JSON 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const changelog = await createChangelog(body);
    return NextResponse.json({
      success: true,
      data: changelog
    });
  } catch (error) {
    console.error('创建更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '创建更新日志失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/changelogs
 *
 * 更新指定 ID 的更新日志。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后日志记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少日志ID' },
        { status: 400 }
      );
    }

    const changelog = await updateChangelog(id, data);
    return NextResponse.json({
      success: true,
      data: changelog
    });
  } catch (error) {
    console.error('更新更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '更新更新日志失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/changelogs?id={id}
 *
 * 删除指定 ID 的更新日志。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少日志ID' },
        { status: 400 }
      );
    }

    await deleteChangelog(parseInt(id));
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '删除更新日志失败' },
      { status: 500 }
    );
  }
}
