/**
 * @file route.ts
 * @description 文档笔记 CRUD API 路由，支持列表查询、单篇详情、创建、更新、删除操作
 * @module 文档笔记 / 笔记管理
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDocNotes,
  getDocNoteById,
  createDocNote,
  updateDocNote,
  deleteDocNote,
} from '@/backend/services/docService';

/**
 * GET /api/doc-notes
 * GET /api/doc-notes?id={id}                        → 返回单篇笔记详情
 * GET /api/doc-notes?categoryId={id}                → 按分类过滤笔记列表
 * GET /api/doc-notes?keyword={kw}                   → 关键词搜索（匹配标题和内容）
 * GET /api/doc-notes?categoryId={id}&keyword={kw}   → 分类 + 关键词组合过滤
 *
 * @param request - Next.js 请求对象
 * @returns 包含笔记数据（单篇或列表）的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');

    // 传了 id 则返回单篇详情
    if (id) {
      const data = await getDocNoteById(parseInt(id));
      return NextResponse.json({ success: true, data });
    }

    // 否则返回列表，支持分类过滤和关键词搜索
    const data = await getDocNotes(
      categoryId ? parseInt(categoryId) : undefined,
      keyword || undefined,
    );
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '获取笔记失败' }, { status: 500 });
  }
}

/**
 * POST /api/doc-notes
 *
 * 创建新笔记。
 *
 * 请求体字段：
 * - title      笔记标题（必填）
 * - content    笔记内容，markdown 文本或 docx base64（可选）
 * - fileType   文件类型：'md' | 'docx'（可选，默认 md）
 * - categoryId 所属分类 ID（必填）
 * - tags       标签，逗号分隔（可选）
 *
 * @param request - Next.js 请求对象，body 为笔记数据 JSON
 * @returns 包含新建笔记记录的 JSON 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createDocNote(body);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '创建笔记失败' }, { status: 500 });
  }
}

/**
 * PUT /api/doc-notes
 *
 * 更新指定 ID 的笔记，仅更新传入的字段。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后笔记记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    }
    const data = await updateDocNote(id, rest);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '更新笔记失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/doc-notes?id={id}
 *
 * 删除指定 ID 的笔记。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    }
    await deleteDocNote(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: '删除笔记失败' }, { status: 500 });
  }
}
