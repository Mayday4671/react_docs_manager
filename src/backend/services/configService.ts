/**
 * @file configService.ts
 * @description 系统配置数据库服务层，封装 sys_config 表的 CRUD 操作
 * @module 系统管理
 */

import { prisma } from '@/backend/database/prisma';

/**
 * 获取所有系统配置项，按 ID 升序排列
 *
 * @returns 系统配置记录数组
 */
export async function getConfigs() {
  return await prisma.sysConfig.findMany({
    orderBy: { id: 'asc' }
  });
}

/**
 * 创建一条系统配置项
 *
 * @param data - 配置数据
 * @param data.configKey - 配置键名（唯一标识）
 * @param data.configValue - 配置值
 * @param data.configType - 配置类型，默认 'system'
 * @param data.remark - 备注说明（可选）
 * @returns 新创建的配置记录
 */
export async function createConfig(data: {
  configKey: string;
  configValue: string;
  configType?: string;
  remark?: string;
}) {
  return await prisma.sysConfig.create({
    data: {
      configKey: data.configKey,
      configValue: data.configValue,
      configType: data.configType || 'system',
      remark: data.remark
    }
  });
}

/**
 * 更新指定 ID 的系统配置项
 *
 * @param id - 要更新的配置 ID
 * @param data - 需要更新的字段
 * @param data.configValue - 新的配置值
 * @param data.configType - 配置类型（可选）
 * @param data.remark - 备注说明（可选）
 * @returns 更新后的配置记录
 */
export async function updateConfig(id: number, data: {
  configValue: string;
  configType?: string;
  remark?: string;
}) {
  return await prisma.sysConfig.update({
    where: { id },
    data: {
      configValue: data.configValue,
      configType: data.configType,
      remark: data.remark
    }
  });
}

/**
 * 物理删除指定 ID 的系统配置项
 *
 * @param id - 要删除的配置 ID
 * @returns 被删除的配置记录
 */
export async function deleteConfig(id: number) {
  return await prisma.sysConfig.delete({
    where: { id }
  });
}
