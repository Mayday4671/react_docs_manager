/**
 * @file route.ts
 * @description 全局搜索 API 路由，支持跨模块搜索菜单、文档笔记、文件
 * @module 全局搜索
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

/**
 * GET /api/search?q={keyword}
 *
 * 全局搜索接口，并发查询菜单、文档笔记（标题+标签）、文件三个数据源。
 * 关键词为空时返回空结果，不执行数据库查询。
 *
 * @param request - Next.js 请求对象，查询参数 q 为搜索关键词
 * @returns 包含 menus / notes / files 三个数组的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ success: true, data: { menus: [], notes: [], files: [] } });
    }

    const [menus, notes, files] = await Promise.all([
      // 搜索菜单
      prisma.sysMenu.findMany({
        where: {
          status: 1,
          visible: 1,
          label: { contains: q },
        },
        select: { id: true, key: true, label: true, icon: true, parentId: true },
        take: 8,
      }),

      // 搜索文档笔记（标题 + 标签）
      prisma.docNote.findMany({
        where: {
          status: 1,
          OR: [
            { title: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          tags: true,
          fileType: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        take: 10,
      }),

      // 搜索文件
      prisma.tblFile.findMany({
        where: {
          status: 1,
          fileName: { contains: q },
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          fileUrl: true,
          createdAt: true,
        },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { menus, notes, files },
    });
  } catch (error: any) {
    console.error('[/api/search]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
