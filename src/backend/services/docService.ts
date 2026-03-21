/**
 * 文档笔记模块 - 数据库服务层
 *
 * 封装所有对 doc_category（文档分类）和 doc_note（文档笔记）表的 CRUD 操作。
 * 上层 API 路由通过调用本文件的函数与数据库交互，不直接使用 prisma 客户端。
 */

import { prisma } from '@/backend/database/prisma';

// ============================================================
// 分类相关操作
// ============================================================

/**
 * 获取所有启用状态的文档分类（含一级子分类）
 *
 * 查询条件：status = 1（启用）
 * 排序规则：先按 parentId 升序（顶级分类在前），再按 orderNum 升序
 * 关联查询：同时返回每个分类的直接子分类列表（同样过滤 status=1）
 */
export async function getDocCategories() {
  return await prisma.docCategory.findMany({
    where: { status: 1 },
    orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    include: {
      children: {
        where: { status: 1 },
        orderBy: { orderNum: 'asc' },
      },
    },
  });
}

/**
 * 创建文档分类
 *
 * @param data.name        分类名称（必填）
 * @param data.description 分类描述（可选）
 * @param data.icon        分类图标标识（可选）
 * @param data.parentId    父分类 ID，不传则为顶级分类（可选）
 * @param data.orderNum    排序号，数字越小越靠前（可选）
 */
export async function createDocCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  parentId?: number;
  orderNum?: number;
}) {
  return await prisma.docCategory.create({ data });
}

/**
 * 更新文档分类信息
 *
 * @param id   要更新的分类 ID
 * @param data 需要更新的字段（所有字段均为可选，只更新传入的字段）
 */
export async function updateDocCategory(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  parentId?: number;
  orderNum?: number;
}) {
  return await prisma.docCategory.update({ where: { id }, data });
}

/**
 * 软删除文档分类
 *
 * 将 status 置为 0（禁用），而非物理删除，保留历史数据。
 * 注意：该分类下的笔记不会被自动处理，前端需提示用户。
 *
 * @param id 要删除的分类 ID
 */
export async function deleteDocCategory(id: number) {
  await prisma.docCategory.update({ where: { id }, data: { status: 0 } });
}

// ============================================================
// 笔记相关操作
// ============================================================

/**
 * 获取文档笔记列表
 *
 * 支持按分类过滤和关键词搜索（标题 + 内容模糊匹配）。
 * 排序规则：置顶笔记优先（pinned DESC），再按最后更新时间倒序。
 * 关联查询：同时返回所属分类的 id 和 name。
 *
 * @param categoryId 按分类 ID 过滤（可选，不传则返回所有分类）
 * @param keyword    关键词搜索，匹配 title 或 content（可选）
 */
export async function getDocNotes(categoryId?: number, keyword?: string) {
  return await prisma.docNote.findMany({
    where: {
      status: 1,
      ...(categoryId ? { categoryId } : {}),
      ...(keyword
        ? { OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }] }
        : {}),
    },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    include: { category: { select: { id: true, name: true } } },
  });
}

/**
 * 根据 ID 获取单篇笔记详情（含分类信息）
 *
 * @param id 笔记 ID
 * @returns  笔记对象，不存在时返回 null
 */
export async function getDocNoteById(id: number) {
  return await prisma.docNote.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
}

/**
 * 创建文档笔记
 *
 * @param data.title      笔记标题（必填）
 * @param data.content    笔记内容：markdown 文本 或 docx 的 base64 编码（可选）
 * @param data.fileType   文件类型标识：'md'（默认 markdown）| 'docx'（Word 文档）（可选）
 * @param data.categoryId 所属分类 ID（必填）
 * @param data.tags       标签字符串，多个标签用英文逗号分隔（可选）
 * @param data.pinned     是否置顶：1-置顶 0-不置顶，默认 0（可选）
 */
export async function createDocNote(data: {
  title: string;
  content?: string;
  fileType?: string;
  categoryId: number;
  tags?: string;
  pinned?: number;
}) {
  return await prisma.docNote.create({ data });
}

/**
 * 更新文档笔记
 *
 * @param id   要更新的笔记 ID
 * @param data 需要更新的字段（所有字段均为可选，只更新传入的字段）
 *             fileType 字段说明同 createDocNote
 */
export async function updateDocNote(id: number, data: {
  title?: string;
  content?: string;
  fileType?: string;
  categoryId?: number;
  tags?: string;
  pinned?: number;
}) {
  return await prisma.docNote.update({ where: { id }, data });
}

/**
 * 物理删除文档笔记
 *
 * 与分类的软删除不同，笔记执行的是真实删除（DELETE）。
 *
 * @param id 要删除的笔记 ID
 */
export async function deleteDocNote(id: number) {
  return await prisma.docNote.delete({ where: { id } });
}
