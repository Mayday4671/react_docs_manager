/**
 * @file hkApiConfigService.ts
 * @description 海康威视 API 连接配置数据库服务层，封装 hk_api_config 表的 CRUD 操作
 * @module 海康API
 */

import { prisma } from '@/backend/database/prisma';

/**
 * 获取所有启用状态的海康 API 配置，默认配置排在最前
 *
 * @returns 启用状态的配置记录数组，按 isDefault 降序、创建时间降序排列
 */
export async function getAllConfigs() {
  return await prisma.hkApiConfig.findMany({
    where: { status: 1 },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

/**
 * 获取当前默认的海康 API 配置
 *
 * @returns 默认配置记录，不存在时返回 null
 */
export async function getDefaultConfig() {
  return await prisma.hkApiConfig.findFirst({
    where: {
      status: 1,
      isDefault: 1
    }
  });
}

/**
 * 根据 ID 获取单条海康 API 配置（含禁用状态）
 *
 * @param id - 配置记录 ID
 * @returns 配置记录，不存在时返回 null
 */
export async function getConfigById(id: number) {
  return await prisma.hkApiConfig.findUnique({
    where: { id }
  });
}

/**
 * 创建海康 API 配置
 *
 * 若 isDefault 为 1，会先将其他所有配置的 isDefault 置为 0，确保唯一默认配置。
 *
 * @param data - 配置数据（使用 any 以兼容前端传入的动态字段）
 * @returns 新创建的配置记录
 */
export async function createConfig(data: any) {
  // 若设置为默认配置，先取消其他配置的默认标记，保证唯一性
  if (data.isDefault === 1) {
    await prisma.hkApiConfig.updateMany({
      where: { isDefault: 1 },
      data: { isDefault: 0 }
    });
  }

  return await prisma.hkApiConfig.create({
    data: {
      name: data.name,
      baseUrl: data.baseUrl,
      appKey: data.appKey,
      appSecret: data.appSecret,
      description: data.description,
      isDefault: data.isDefault || 0,
      status: data.status || 1,
      createdBy: data.createdBy
    }
  });
}

/**
 * 更新指定 ID 的海康 API 配置
 *
 * 若 isDefault 为 1，会先将其他配置的 isDefault 置为 0，确保唯一默认配置。
 *
 * @param id - 要更新的配置 ID
 * @param data - 需要更新的字段（使用 any 以兼容前端传入的动态字段）
 * @returns 更新后的配置记录
 */
export async function updateConfig(id: number, data: any) {
  // 若设置为默认配置，先取消其他配置的默认标记（排除自身）
  if (data.isDefault === 1) {
    await prisma.hkApiConfig.updateMany({
      where: {
        isDefault: 1,
        id: { not: id }
      },
      data: { isDefault: 0 }
    });
  }

  return await prisma.hkApiConfig.update({
    where: { id },
    data: {
      name: data.name,
      baseUrl: data.baseUrl,
      appKey: data.appKey,
      appSecret: data.appSecret,
      description: data.description,
      isDefault: data.isDefault,
      status: data.status,
      updatedBy: data.updatedBy,
      updatedAt: new Date()
    }
  });
}

/**
 * 物理删除指定 ID 的海康 API 配置
 *
 * @param id - 要删除的配置 ID
 * @returns 被删除的配置记录
 */
export async function deleteConfig(id: number) {
  return await prisma.hkApiConfig.delete({
    where: { id }
  });
}

/**
 * 将指定配置设置为默认配置
 *
 * 先将所有配置的 isDefault 置为 0，再将目标配置置为 1。
 *
 * @param id - 要设为默认的配置 ID
 * @returns 更新后的配置记录
 */
export async function setDefaultConfig(id: number) {
  // 先清除所有默认标记
  await prisma.hkApiConfig.updateMany({
    where: { isDefault: 1 },
    data: { isDefault: 0 }
  });

  return await prisma.hkApiConfig.update({
    where: { id },
    data: { isDefault: 1 }
  });
}
