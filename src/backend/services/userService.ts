/**
 * @file userService.ts
 * @description 用户管理数据库服务层，封装 sys_user 表的 CRUD 操作
 * @module 系统管理
 */

import { prisma } from '../database/prisma';

/**
 * 分页获取用户列表，支持按状态过滤，同时关联查询角色信息。
 * 按创建时间降序排列。
 *
 * @param params - 查询参数（可选）
 * @param params.page - 当前页码，默认 1
 * @param params.pageSize - 每页条数，默认 10
 * @param params.status - 按账号状态过滤：1-启用 0-禁用
 * @returns 包含用户列表（含角色信息）、分页信息和总条数的响应对象
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
 * 根据 ID 获取单个用户，同时关联查询角色信息。
 *
 * @param id - 用户 ID
 * @returns 用户记录（含角色信息），不存在时返回 null
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
 * 根据用户名获取用户，同时关联查询角色信息。
 * 常用于登录验证场景。
 *
 * @param username - 登录用户名
 * @returns 用户记录（含角色信息），不存在时返回 null
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
 * 创建新用户。
 * 注意：密码应在调用前完成加密处理，此函数直接存储传入的 password 字段。
 *
 * @param data - 用户数据
 * @param data.username - 登录用户名（唯一）
 * @param data.password - 密码（调用方负责加密）
 * @param data.email - 用户邮箱（可选）
 * @param data.phone - 用户手机号（可选）
 * @param data.avatar - 用户头像 URL（可选）
 * @param data.roleId - 关联角色 ID（可选）
 * @param data.createdBy - 创建人用户 ID（可选）
 * @returns 新创建的用户记录
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
 * 更新指定 ID 的用户信息。
 *
 * @param id - 要更新的用户 ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @returns 更新后的用户记录
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
 * 物理删除指定 ID 的用户。
 *
 * @param id - 要删除的用户 ID
 * @returns 被删除的用户记录
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
