/**
 * 文档笔记 API 路由
 * 路径：/api/doc-notes
 *
 * 支持的 HTTP 方法：
 *   GET    - 获取笔记列表 或 单篇笔记详情
 *   POST   - 创建新笔记
 *   PUT    - 更新笔记（需传 id）
 *   DELETE - 删除笔记（需传 id 查询参数）
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
 *
 * 查询参数：
 *   id         - 指定时返回单篇笔记详情
 *   categoryId - 按分类 ID 过滤笔记列表
 *   keyword    - 关键词搜索（匹配标题和内容）
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
 * 请求体（JSON）：
 *   title      - 笔记标题（必填）
 *   content    - 笔记内容，markdown 文本 或 docx base64（可选）
 *   fileType   - 文件类型：'md' | 'docx'（可选，默认 md）
 *   categoryId - 所属分类 ID（必填）
 *   tags       - 标签，逗号分隔（可选）
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
 * 请求体（JSON）：
 *   id    - 要更新的笔记 ID（必填）
 *   ...   - 其余字段同 POST，均为可选，只更新传入的字段
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
 * DELETE /api/doc-notes
 *
 * 查询参数：
 *   id - 要删除的笔记 ID（必填）
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
