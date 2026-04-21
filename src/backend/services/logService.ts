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

/**
 * 获取日志统计数据（用于可视化）
 */
export async function getLogStats() {
  try {
    const now = new Date();
    const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, successCount, failCount, recentLogs, moduleLogs] = await Promise.all([
      // 总数
      prisma.sysLog.count(),
      // 成功数
      prisma.sysLog.count({ where: { status: 1 } }),
      // 失败数
      prisma.sysLog.count({ where: { status: 0 } }),
      // 近7天每天的日志（用于趋势图）
      prisma.sysLog.findMany({
        where: { createdAt: { gte: days7ago } },
        select: { createdAt: true, status: true, module: true, action: true },
        orderBy: { createdAt: 'asc' },
      }),
      // 近30天各模块操作数（用于模块分布图）
      prisma.sysLog.findMany({
        where: { createdAt: { gte: days30ago } },
        select: { module: true, action: true, status: true },
      }),
    ]);

    // 按天聚合近7天趋势
    const trendMap: Record<string, { date: string; total: number; success: number; fail: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}-${d.getDate()}`;
      trendMap[key] = { date: key, total: 0, success: 0, fail: 0 };
    }
    for (const log of recentLogs) {
      const d = new Date(log.createdAt);
      const key = `${d.getMonth() + 1}-${d.getDate()}`;
      if (trendMap[key]) {
        trendMap[key].total++;
        if (log.status === 1) trendMap[key].success++;
        else trendMap[key].fail++;
      }
    }

    // 模块分布
    const moduleMap: Record<string, number> = {};
    for (const log of moduleLogs) {
      moduleMap[log.module] = (moduleMap[log.module] || 0) + 1;
    }
    const moduleStats = Object.entries(moduleMap)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 操作类型分布
    const actionMap: Record<string, number> = {};
    for (const log of moduleLogs) {
      actionMap[log.action] = (actionMap[log.action] || 0) + 1;
    }
    const actionStats = Object.entries(actionMap)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      successCount,
      failCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 100,
      trend: Object.values(trendMap),
      moduleStats,
      actionStats,
    };
  } catch (error) {
    console.error('获取日志统计失败:', error);
    throw new Error('Failed to get log stats');
  }
}
