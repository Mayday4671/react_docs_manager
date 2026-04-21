import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

/**
 * GET /api/search?q=关键词
 * 全局搜索：菜单、文档笔记、文件
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
