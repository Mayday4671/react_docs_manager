/**
 * 日志服务
 * 负责处理系统日志的记录和查询
 */

import { prisma } from '../database/prisma';

/**
 * 创建日志记录
 */
export async function createLog(data: {
  module: string;
  action: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  params?: string;
  result?: string;
  errorMsg?: string;
  costTime?: number;
  userId?: number;
  username?: string;
  status?: number;
}) {
  try {
    const log = await prisma.sysLog.create({
      data: {
        module: data.module,
        action: data.action,
        method: data.method,
        url: data.url,
        ip: data.ip,
        userAgent: data.userAgent,
        params: data.params,
        result: data.result,
        errorMsg: data.errorMsg,
        costTime: data.costTime,
        userId: data.userId,
        username: data.username,
        status: data.status || 1
      }
    });

    return log;
  } catch (error) {
    console.error('创建日志失败:', error);
    // 日志记录失败不应该影响主业务，只打印错误
    return null;
  }
}

/**
 * 获取日志列表
 */
export async function getLogs(params?: {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  userId?: number;
  status?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (params?.module) {
      where.module = params.module;
    }
    if (params?.action) {
      where.action = params.action;
    }
    if (params?.userId) {
      where.userId = params.userId;
    }
    if (params?.status !== undefined) {
      where.status = params.status;
    }
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.sysLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sysLog.count({ where })
    ]);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取日志列表失败:', error);
    throw new Error('Failed to fetch logs');
  }
}

/**
 * 根据ID获取日志
 */
export async function getLogById(id: number) {
  try {
    const log = await prisma.sysLog.findUnique({
      where: { id }
    });

    return log;
  } catch (error) {
    console.error('获取日志失败:', error);
    throw new Error('Failed to fetch log');
  }
}

/**
 * 清理过期日志
 * @param days 保留天数
 */
export async function cleanOldLogs(days: number = 30) {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await prisma.sysLog.deleteMany({
      where: {
        createdAt: {
          lt: date
        }
      }
    });

    return result;
  } catch (error) {
    console.error('清理日志失败:', error);
    throw new Error('Failed to clean logs');
  }
}
