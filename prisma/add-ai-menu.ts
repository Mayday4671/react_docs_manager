import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const existing = await prisma.sysMenu.findUnique({ where: { key: 'ai-chat' } });
  if (existing) { console.log('✅ 已存在'); return; }
  const menu = await prisma.sysMenu.create({
    data: { key: 'ai-chat', label: 'AI 对话', icon: 'RobotOutlined', path: '/ai', component: 'AiChat', orderNum: 10, menuType: 'C', visible: 1, status: 1 },
  });
  // 给 admin 角色分配权限
  const adminRole = await prisma.sysRole.findUnique({ where: { roleKey: 'admin' } });
  if (adminRole) await prisma.sysRoleMenu.create({ data: { roleId: adminRole.id, menuId: menu.id } });
  console.log('✅ AI 对话菜单已添加');
}
main().catch(console.error).finally(() => prisma.$disconnect());
