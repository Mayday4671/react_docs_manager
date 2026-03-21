import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 查询分类数量
  const categoryCount = await prisma.hkApiCategory.count();
  console.log(`📁 分类数量: ${categoryCount}`);

  // 查询API数量
  const apiCount = await prisma.hkApi.count();
  console.log(`🔗 API接口数量: ${apiCount}`);

  // 查询每个分类的API数量
  const categories = await prisma.hkApiCategory.findMany({
    include: {
      _count: {
        select: { apis: true }
      }
    },
    orderBy: { orderNum: 'asc' }
  });

  console.log('\n📊 各分类API数量统计:');
  categories.forEach(category => {
    console.log(`   ${category.name}: ${category._count.apis} 个接口`);
  });

  // 查询总调用次数
  const totalCalls = await prisma.hkApi.aggregate({
    _sum: {
      callCount: true
    }
  });

  console.log(`\n📈 总调用次数: ${totalCalls._sum.callCount || 0}`);

  // 查询前5个最常用的API
  const topApis = await prisma.hkApi.findMany({
    take: 5,
    orderBy: { callCount: 'desc' },
    include: { category: true }
  });

  console.log('\n🔥 调用次数最多的5个API:');
  topApis.forEach((api, index) => {
    console.log(`   ${index + 1}. ${api.name} (${api.category.name}) - ${api.callCount} 次`);
  });
}

main()
  .catch((e) => {
    console.error('查询失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });