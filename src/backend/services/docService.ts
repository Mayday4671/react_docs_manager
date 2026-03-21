import { prisma } from '@/backend/database/prisma';

// ---- 分类 ----

export async function getDocCategories() {
  return await prisma.docCategory.findMany({
    where: { status: 1 },
    orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    include: { children: { where: { status: 1 }, orderBy: { orderNum: 'asc' } } }
  });
}

export async function createDocCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  parentId?: number;
  orderNum?: number;
}) {
  return await prisma.docCategory.create({ data });
}

export async function updateDocCategory(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  parentId?: number;
  orderNum?: number;
}) {
  return await prisma.docCategory.update({ where: { id }, data });
}

export async function deleteDocCategory(id: number) {
  // 将该分类下的笔记移到未分类（或直接删除，这里选软删除分类）
  await prisma.docCategory.update({ where: { id }, data: { status: 0 } });
}

// ---- 笔记 ----

export async function getDocNotes(categoryId?: number, keyword?: string) {
  return await prisma.docNote.findMany({
    where: {
      status: 1,
      ...(categoryId ? { categoryId } : {}),
      ...(keyword ? { OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }] } : {})
    },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    include: { category: { select: { id: true, name: true } } }
  });
}

export async function getDocNoteById(id: number) {
  return await prisma.docNote.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } }
  });
}

export async function createDocNote(data: {
  title: string;
  content?: string;
  categoryId: number;
  tags?: string;
  pinned?: number;
}) {
  return await prisma.docNote.create({ data });
}

export async function updateDocNote(id: number, data: {
  title?: string;
  content?: string;
  categoryId?: number;
  tags?: string;
  pinned?: number;
}) {
  return await prisma.docNote.update({ where: { id }, data });
}

export async function deleteDocNote(id: number) {
  return await prisma.docNote.delete({ where: { id } });
}
