/**
 * @file route.ts
 * @description 文件管理 API 路由，支持分页查询文件列表
 * @module 业务管理 / 文件管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFiles } from '@/backend/services/fileService';

/**
 * GET /api/files
 * GET /api/files?page={page}&pageSize={pageSize}
 *
 * 分页获取已上传文件列表。
 *
 * @param request - Next.js 请求对象，支持查询参数 page（默认 1）和 pageSize（默认 10）
 * @returns 包含文件列表及分页信息的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await getFiles(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取文件列表失败' },
      { status: 500 }
    );
  }
}
