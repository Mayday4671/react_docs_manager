import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查树形结构...\n');

  // 获取所有分类
  const allCategories = await prisma.hkApiCategory.findMany({
    where: { status: 1 },
    include: {
      apis: {
        where: { status: 1 },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { orderNum: 'asc' }
  });

  console.log(`总共 ${allCategories.length} 个分类\n`);

  // 构建树形结构
  const buildTree = (parentId: number | null = null): any[] => {
    const children = allCategories
      .filter(cat => cat.parentId === parentId)
      .map(category => {
        const node = {
          ...category,
          children: buildTree(category.id)
        };
        return node;
      });
    
    return children;
  };

  // 返回顶级分类（parentId为null）
  const tree = buildTree(null);
  console.log(`构建了 ${tree.length} 个顶级分类\n`);

  // 打印树形结构
  const printTree = (nodes: any[], level = 0) => {
    nodes.forEach(node => {
      const indent = '  '.repeat(level);
      console.log(`${indent}├─ ${node.name} (ID: ${node.id}, APIs: ${node.apis.length})`);
      if (node.children && node.children.length > 0) {
        printTree(node.children, level + 1);
      }
    });
  };

  printTree(tree);
}

main()
  .catch((e) => {
    console.error('查询失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
