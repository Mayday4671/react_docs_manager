/**
 * 用户服务
 * 负责处理用户相关的业务逻辑
 */

import { prisma } from '../database/prisma';

/**
 * 获取所有用户
 */
export async function getAllUsers(params?: {
  page?: number;
  pageSize?: number;
  status?: number;
}) {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.status !== undefined) {
      where.status = params.status;
    }

    const [users, total] = await Promise.all([
      prisma.sysUser.findMany({
        where,
        include: {
          role: true
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sysUser.count({ where })
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * 根据ID获取用户
 */
export async function getUserById(id: number) {
  try {
    const user = await prisma.sysUser.findUnique({
      where: { id },
      include: {
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('获取用户失败:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username: string) {
  try {
    const user = await prisma.sysUser.findUnique({
      where: { username },
      include: {
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('获取用户失败:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * 创建用户
 */
export async function createUser(data: {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roleId?: number;
  createdBy?: number;
}) {
  try {
    const user = await prisma.sysUser.create({
      data
    });

    return user;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * 更新用户
 */
export async function updateUser(
  id: number,
  data: {
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    status?: number;
    roleId?: number;
    updatedBy?: number;
  }
) {
  try {
    const user = await prisma.sysUser.update({
      where: { id },
      data
    });

    return user;
  } catch (error) {
    console.error('更新用户失败:', error);
    throw new Error('Failed to update user');
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: number) {
  try {
    const user = await prisma.sysUser.delete({
      where: { id }
    });

    return user;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw new Error('Failed to delete user');
  }
}
