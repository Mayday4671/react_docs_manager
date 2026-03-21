import { prisma } from '@/backend/database/prisma';

// 获取所有配置
export async function getAllConfigs() {
  return await prisma.hkApiConfig.findMany({
    where: { status: 1 },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

// 获取默认配置
export async function getDefaultConfig() {
  return await prisma.hkApiConfig.findFirst({
    where: { 
      status: 1,
      isDefault: 1
    }
  });
}

// 获取单个配置
export async function getConfigById(id: number) {
  return await prisma.hkApiConfig.findUnique({
    where: { id }
  });
}

// 创建配置
export async function createConfig(data: any) {
  // 如果设置为默认配置，先取消其他默认配置
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

// 更新配置
export async function updateConfig(id: number, data: any) {
  // 如果设置为默认配置，先取消其他默认配置
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

// 删除配置
export async function deleteConfig(id: number) {
  return await prisma.hkApiConfig.delete({
    where: { id }
  });
}

// 设置默认配置
export async function setDefaultConfig(id: number) {
  // 先取消所有默认配置
  await prisma.hkApiConfig.updateMany({
    where: { isDefault: 1 },
    data: { isDefault: 0 }
  });
  
  // 设置新的默认配置
  return await prisma.hkApiConfig.update({
    where: { id },
    data: { isDefault: 1 }
  });
}
