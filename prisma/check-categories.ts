import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查分类数据...\n');

  const categories = await prisma.hkApiCategory.findMany({
    take: 10,
    orderBy: { id: 'asc' }
  });

  console.log('前10个分类:');
  categories.forEach(cat => {
    console.log(`ID: ${cat.id}, Name: ${cat.name}, ParentID: ${cat.parentId}`);
  });

  const topLevel = await prisma.hkApiCategory.count({
    where: { parentId: null }
  });

  console.log(`\n顶级分类数量: ${topLevel}`);

  const total = await prisma.hkApiCategory.count();
  console.log(`总分类数量: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
