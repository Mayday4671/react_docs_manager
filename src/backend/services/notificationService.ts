/**
 * 通知服务
 * 负责处理通知相关的业务逻辑
 */

import { prisma } from '../database/prisma';

/**
 * 获取所有通知
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
 * 根据ID获取通知
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
 * 创建通知
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
 * 更新通知
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
 * 删除通知
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

