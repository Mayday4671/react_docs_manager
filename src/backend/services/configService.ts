import { prisma } from '@/backend/database/prisma';

export async function getConfigs() {
  return await prisma.sysConfig.findMany({
    orderBy: { id: 'asc' }
  });
}

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

export async function deleteConfig(id: number) {
  return await prisma.sysConfig.delete({
    where: { id }
  });
}
