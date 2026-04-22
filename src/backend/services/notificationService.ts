/**
 * @file notificationService.ts
 * @description 通知公告数据库服务层，封装 tbl_notification 表的 CRUD 操作
 * @module 系统管理
 */

import { prisma } from '../database/prisma';

/**
 * 分页获取通知公告列表，支持按类型和状态过滤。
 * 排序规则：优先级降序，创建时间降序。
 *
 * @param params - 查询参数（可选）
 * @param params.page - 当前页码，默认 1
 * @param params.pageSize - 每页条数，默认 10
 * @param params.type - 按通知类型过滤
 * @param params.status - 按状态过滤：1-已发布 0-草稿
 * @returns 包含通知列表、分页信息和总条数的响应对象
 */
export async function getAllNotifications(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: number;
}) {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.type) {
      where.type = params.type;
    }
    if (params?.status !== undefined) {
      where.status = params.status;
    }

    const [notifications, total] = await Promise.all([
      prisma.tblNotification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.tblNotification.count({ where })
    ]);

    return {
      data: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取通知列表失败:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * 根据 ID 获取单条通知，并自动将该通知的阅读次数加 1。
 *
 * @param id - 通知记录 ID
 * @returns 通知记录（阅读次数已更新），不存在时返回 null
 */
export async function getNotificationById(id: number) {
  try {
    const notification = await prisma.tblNotification.findUnique({
      where: { id }
    });

    // 增加阅读次数
    if (notification) {
      await prisma.tblNotification.update({
        where: { id },
        data: {
          readCount: notification.readCount + 1
        }
      });
    }

    return notification;
  } catch (error) {
    console.error('获取通知失败:', error);
    throw new Error('Failed to fetch notification');
  }
}

/**
 * 创建通知公告。
 * publishAt / expireAt 传入字符串时自动转换为 Date 对象。
 *
 * @param data - 通知数据
 * @param data.title - 通知标题（必填）
 * @param data.content - 通知正文内容
 * @param data.type - 通知类型，默认 'info'
 * @param data.priority - 优先级，数字越大越靠前
 * @param data.status - 状态：1-已发布 0-草稿
 * @param data.publishAt - 发布时间
 * @param data.expireAt - 过期时间
 * @param data.createdBy - 创建人用户 ID
 * @returns 新创建的通知记录
 */
export async function createNotification(data: {
  title: string;
  content?: string;
  type?: string;
  priority?: number;
  status?: number;
  publishAt?: Date | string;
  expireAt?: Date | string;
  createdBy?: number;
}) {
  try {
    const notification = await prisma.tblNotification.create({
      data: {
        ...data,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expireAt: data.expireAt ? new Date(data.expireAt) : null
      }
    });

    return notification;
  } catch (error) {
    console.error('创建通知失败:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * 更新指定 ID 的通知公告。
 * publishAt / expireAt 传入字符串时自动转换为 Date 对象，不传则保持原值。
 *
 * @param id - 要更新的通知 ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @returns 更新后的通知记录
 */
export async function updateNotification(
  id: number,
  data: {
    title?: string;
    content?: string;
    type?: string;
    priority?: number;
    status?: number;
    publishAt?: Date | string;
    expireAt?: Date | string;
    updatedBy?: number;
  }
) {
  try {
    const notification = await prisma.tblNotification.update({
      where: { id },
      data: {
        ...data,
        publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
        expireAt: data.expireAt ? new Date(data.expireAt) : undefined
      }
    });

    return notification;
  } catch (error) {
    console.error('更新通知失败:', error);
    throw new Error('Failed to update notification');
  }
}

/**
 * 物理删除指定 ID 的通知公告。
 *
 * @param id - 要删除的通知 ID
 * @returns 被删除的通知记录
 */
export async function deleteNotification(id: number) {
  try {
    const notification = await prisma.tblNotification.delete({
      where: { id }
    });

    return notification;
  } catch (error) {
    console.error('删除通知失败:', error);
    throw new Error('Failed to delete notification');
  }
}

