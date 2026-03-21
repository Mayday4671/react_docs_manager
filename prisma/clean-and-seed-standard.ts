import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始清理并重新导入标准数据...');

  // 1. 清空现有数据
  console.log('清空现有API数据...');
  await prisma.hkApi.deleteMany({});
  await prisma.hkApiCategory.deleteMany({});

  // 2. 创建标准分类
  console.log('创建标准分类...');
  const category = await prisma.hkApiCategory.create({
    data: {
      name: '资源管理',
      description: '设备、通道等资源的查询和管理',
      orderNum: 1,
      status: 1
    }
  });

  // 3. 创建一个标准示例API
  console.log('创建标准示例API...');
  await prisma.hkApi.create({
    data: {
      name: '查询资源列表',
      path: '/api/irds/v2/resource/resourcesByParams',
      method: 'POST',
      description: '根据条件查询资源列表，支持分页',
      summary: '查询设备、通道等资源信息',
      categoryId: category.id,
      
      // 标准请求体示例
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 10,
        resourceType: 'camera'
      }, null, 2),
      
      // 标准响应示例
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 100,
          pageNo: 1,
          pageSize: 10,
          list: [
            {
              resourceId: 'camera001',
              resourceName: '摄像头001',
              resourceType: 'camera',
              status: 'online'
            }
          ]
        }
      }, null, 2),
      
      // 响应结构说明
      responseSchema: JSON.stringify({
        code: 'string - 响应码，0表示成功',
        msg: 'string - 响应消息',
        data: {
          total: 'number - 总记录数',
          pageNo: 'number - 当前页码',
          pageSize: 'number - 每页大小',
          list: 'array - 资源列表'
        }
      }, null, 2),
      
      version: '2.0',
      deprecated: 0,
      needAuth: 1,
      rateLimit: '100次/分钟',
      notes: '这是一个标准的分页查询接口示例',
      callCount: 0,
      status: 1
    }
  });

  console.log('标准数据导入完成！');
  console.log('- 分类数量: 1');
  console.log('- API数量: 1');
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
