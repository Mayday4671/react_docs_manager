/**
 * @file fileService.ts
 * @description 文件管理数据库服务层，封装 tbl_file 表的查询操作
 * @module 文件管理
 */

import { prisma } from '@/backend/database/prisma';

/**
 * 分页获取文件列表，按上传时间倒序排列
 *
 * @param page - 当前页码，从 1 开始，默认 1
 * @param pageSize - 每页条数，默认 10
 * @returns 包含文件列表、分页信息和总条数的响应对象
 */
export async function getFiles(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;

  const [files, total] = await Promise.all([
    prisma.tblFile.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tblFile.count()
  ]);

  return {
    success: true,
    data: files,
    page,
    pageSize,
    total
  };
}
