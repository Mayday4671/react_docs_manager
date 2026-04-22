/**
 * @file changelogService.ts
 * @description 更新日志（Changelog）数据库服务层，封装 tbl_changelog 表的 CRUD 操作
 * @module 系统管理
 */

import { prisma } from '@/backend/database/prisma';

/**
 * 获取所有更新日志，按发布时间倒序排列
 *
 * @returns 更新日志记录数组
 */
export async function getChangelogs() {
  return await prisma.tblChangelog.findMany({
    orderBy: { publishAt: 'desc' }
  });
}

/**
 * 创建一条更新日志记录
 *
 * @param data - 更新日志数据
 * @param data.version - 版本号（如 v1.2.0）
 * @param data.title - 日志标题
 * @param data.content - 日志详细内容（可选）
 * @param data.type - 日志类型，默认 'feature'（如 feature / bugfix / improvement）
 * @param data.status - 发布状态：1-已发布 0-草稿，默认 1
 * @param data.publishAt - 发布时间字符串，不传则为 null
 * @returns 新创建的更新日志记录
 */
export async function createChangelog(data: {
  version: string;
  title: string;
  content?: string;
  type?: string;
  status?: number;
  publishAt?: string;
}) {
  return await prisma.tblChangelog.create({
    data: {
      version: data.version,
      title: data.title,
      content: data.content,
      type: data.type || 'feature',
      status: data.status ?? 1,
      publishAt: data.publishAt ? new Date(data.publishAt) : null
    }
  });
}

/**
 * 更新指定 ID 的更新日志记录
 *
 * @param id - 要更新的日志 ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @param data.version - 版本号
 * @param data.title - 日志标题
 * @param data.content - 日志详细内容
 * @param data.type - 日志类型
 * @param data.status - 发布状态
 * @param data.publishAt - 发布时间字符串，传入则转换为 Date 对象
 * @returns 更新后的日志记录
 */
export async function updateChangelog(id: number, data: {
  version?: string;
  title?: string;
  content?: string;
  type?: string;
  status?: number;
  publishAt?: string;
}) {
  return await prisma.tblChangelog.update({
    where: { id },
    data: {
      ...data,
      publishAt: data.publishAt ? new Date(data.publishAt) : undefined
    }
  });
}

/**
 * 物理删除指定 ID 的更新日志记录
 *
 * @param id - 要删除的日志 ID
 * @returns 被删除的日志记录
 */
export async function deleteChangelog(id: number) {
  return await prisma.tblChangelog.delete({
    where: { id }
  });
}
