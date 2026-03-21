import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHkConfig() {
  try {
    console.log('测试创建海康API配置...');
    
    const config = await prisma.hkApiConfig.create({
      data: {
        name: '测试配置',
        baseUrl: 'http://127.0.0.1:80',
        appKey: 'test-key',
        appSecret: 'test-secret',
        description: '这是一个测试配置',
        isDefault: 1,
        status: 1
      }
    });
    
    console.log('创建成功:', config);
    
    // 查询所有配置
    const configs = await prisma.hkApiConfig.findMany();
    console.log('所有配置:', configs);
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHkConfig();
