/**
 * 添加按钮权限菜单节点（menuType=F）
 * 运行：npx tsx prisma/add-button-perms.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 查找各父菜单
  const userMenu = await prisma.sysMenu.findUnique({ where: { key: 'user-management' } });
  const roleMenu = await prisma.sysMenu.findUnique({ where: { key: 'role-management' } });
  const logMenu = await prisma.sysMenu.findUnique({ where: { key: 'log-management' } });
  const notifMenu = await prisma.sysMenu.findUnique({ where: { key: 'notification-management' } });
  const fileMenu = await prisma.sysMenu.findUnique({ where: { key: 'file-management' } });
  const menuMgmt = await prisma.sysMenu.findUnique({ where: { key: 'menu-management' } });

  const buttons = [
    // 用户管理
    { key: 'user:add',    label: '新增用户',   perms: 'user:add',    parentId: userMenu?.id },
    { key: 'user:edit',   label: '编辑用户',   perms: 'user:edit',   parentId: userMenu?.id },
    { key: 'user:delete', label: '删除用户',   perms: 'user:delete', parentId: userMenu?.id },
    // 角色管理
    { key: 'role:add',    label: '新增角色',   perms: 'role:add',    parentId: roleMenu?.id },
    { key: 'role:edit',   label: '编辑角色',   perms: 'role:edit',   parentId: roleMenu?.id },
    { key: 'role:delete', label: '删除角色',   perms: 'role:delete', parentId: roleMenu?.id },
    { key: 'role:perm',   label: '配置权限',   perms: 'role:perm',   parentId: roleMenu?.id },
    // 日志管理
    { key: 'log:list',    label: '查看日志',   perms: 'log:list',    parentId: logMenu?.id },
    // 通知管理
    { key: 'notif:add',   label: '新增通知',   perms: 'notif:add',   parentId: notifMenu?.id },
    { key: 'notif:edit',  label: '编辑通知',   perms: 'notif:edit',  parentId: notifMenu?.id },
    { key: 'notif:delete',label: '删除通知',   perms: 'notif:delete',parentId: notifMenu?.id },
    // 文件管理
    { key: 'file:upload', label: '上传文件',   perms: 'file:upload', parentId: fileMenu?.id },
    { key: 'file:delete', label: '删除文件',   perms: 'file:delete', parentId: fileMenu?.id },
    // 菜单管理
    { key: 'menu:add',    label: '新增菜单',   perms: 'menu:add',    parentId: menuMgmt?.id },
    { key: 'menu:edit',   label: '编辑菜单',   perms: 'menu:edit',   parentId: menuMgmt?.id },
    { key: 'menu:delete', label: '删除菜单',   perms: 'menu:delete', parentId: menuMgmt?.id },
  ].filter(b => b.parentId); // 过滤掉父菜单不存在的

  for (const btn of buttons) {
    const existing = await prisma.sysMenu.findUnique({ where: { key: btn.key } });
    if (existing) { console.log(`⏭ ${btn.key} 已存在，跳过`); continue; }

    await prisma.sysMenu.create({
      data: {
        key: btn.key,
        label: btn.label,
        perms: btn.perms,
        parentId: btn.parentId,
        menuType: 'F',
        visible: 0, // 按钮不在侧边栏显示
        status: 1,
        orderNum: 0,
      },
    });
    console.log(`✅ 创建按钮权限: ${btn.key} (${btn.perms})`);
  }

  // 重新给 admin 分配所有菜单（含新增的按钮节点）
  const adminRole = await prisma.sysRole.findUnique({ where: { roleKey: 'admin' } });
  if (adminRole) {
    const allMenus = await prisma.sysMenu.findMany({ select: { id: true } });
    await prisma.sysRoleMenu.deleteMany({ where: { roleId: adminRole.id } });
    await prisma.sysRoleMenu.createMany({
      data: allMenus.map(m => ({ roleId: adminRole.id, menuId: m.id })),
    });
    console.log(`\n✅ admin 角色已更新，共 ${allMenus.length} 个权限节点`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
