import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.sysMenu.findUnique({ where: { key: 'menu-management' } });
  if (existing) { console.log('✅ 已存在，跳过'); return; }

  const systemMenu = await prisma.sysMenu.findUnique({ where: { key: 'system' } });

  const menu = await prisma.sysMenu.create({
    data: {
      key: 'menu-management',
      label: '菜单管理',
      icon: 'MenuOutlined',
      path: '/system/menus',
      component: 'MenuManagement',
      parentId: systemMenu?.id ?? null,
      orderNum: 5,
      menuType: 'C',
      visible: 1,
      status: 1,
    },
  });
  console.log('✅ 菜单管理已添加:', menu);
}

main().catch(console.error).finally(() => prisma.$disconnect());
