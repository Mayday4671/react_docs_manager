import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.sysRole.findUnique({ where: { roleKey: 'admin' } });
  if (!adminRole) { console.log('❌ admin角色不存在'); return; }

  const allMenus = await prisma.sysMenu.findMany({ select: { id: true } });
  
  await prisma.sysRoleMenu.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.sysRoleMenu.createMany({
    data: allMenus.map(m => ({ roleId: adminRole.id, menuId: m.id })),
  });

  console.log(`✅ 已为 admin 角色分配 ${allMenus.length} 个菜单权限`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
