/**
 * @file roleService.ts
 * @description 角色管理数据库服务层，封装 sys_role 表的 CRUD 操作
 * @module 系统管理
 */

import { prisma } from '@/backend/database/prisma';

/**
 * 获取所有角色列表，同时统计每个角色关联的用户数量。
 * 按 ID 升序排列。
 *
 * @returns 角色记录数组，每项包含 _count.users 字段
 */
export async function getRoles() {
  return await prisma.sysRole.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { id: 'asc' },
  });
}

/**
 * 创建新角色。
 *
 * @param data - 角色数据
 * @param data.roleName - 角色名称（唯一）
 * @param data.roleKey - 角色标识符（唯一，如 admin / editor）
 * @param data.description - 角色描述（可选）
 * @param data.status - 状态：1-启用（默认）0-禁用
 * @returns 新创建的角色记录
 */
export async function createRole(data: {
  roleName: string;
  roleKey: string;
  description?: string;
  status?: number;
}) {
  return await prisma.sysRole.create({
    data: {
      roleName: data.roleName,
      roleKey: data.roleKey,
      description: data.description,
      status: data.status ?? 1,
    },
  });
}

/**
 * 更新指定 ID 的角色信息。
 *
 * @param id - 要更新的角色 ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @param data.roleName - 角色名称
 * @param data.roleKey - 角色标识符
 * @param data.description - 角色描述
 * @param data.status - 状态：1-启用 0-禁用
 * @returns 更新后的角色记录
 */
export async function updateRole(id: number, data: {
  roleName?: string;
  roleKey?: string;
  description?: string;
  status?: number;
}) {
  return await prisma.sysRole.update({
    where: { id },
    data,
  });
}

/**
 * 物理删除指定 ID 的角色。
 * 注意：删除前需确保该角色下没有关联用户，否则数据库外键约束会抛出异常。
 *
 * @param id - 要删除的角色 ID
 * @returns 被删除的角色记录
 */
export async function deleteRole(id: number) {
  return await prisma.sysRole.delete({
    where: { id },
  });
}
