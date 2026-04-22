/**
 * @file route.ts
 * @description 文档分类 CRUD API 路由，支持获取、创建、更新、删除操作
 * @module 文档笔记 / 分类管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDocCategories, createDocCategory, updateDocCategory, deleteDocCategory } from '@/backend/services/docService';

/**
 * GET /api/doc-categories
 *
 * 获取全部文档分类列表。
 *
 * @returns 包含分类数组的 JSON 响应
 */
export async function GET() {
  try {
    const data = await getDocCategories();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '获取分类失败' }, { status: 500 });
  }
}

/**
 * POST /api/doc-categories
 *
 * 创建新的文档分类。
 *
 * @param request - Next.js 请求对象，body 为分类数据 JSON
 * @returns 包含新建分类记录的 JSON 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createDocCategory(body);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '创建分类失败' }, { status: 500 });
  }
}

/**
 * PUT /api/doc-categories
 *
 * 更新指定 ID 的文档分类。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后分类记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    const data = await updateDocCategory(id, rest);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '更新分类失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/doc-categories?id={id}
 *
 * 删除指定 ID 的文档分类。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    await deleteDocCategory(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: '删除分类失败' }, { status: 500 });
  }
}
