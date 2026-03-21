import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuData = [
    {
      key: "home",
      icon: "HomeOutlined",
      label: "首页",
      path: "/",
      component: "Home"
    },
    {
      key: "database-management",
      icon: "DatabaseOutlined",
      label: "数据库管理",
      path: "/database",
      component: "DatabaseManagement"
    },
    {
      key: "system",
      icon: "SettingOutlined",
      label: "系统管理",
      path: "/system",
      children: [
        {
          key: "user-management",
          label: "用户管理",
          icon: "UserOutlined",
          path: "/system/users",
          component: "UserManagement"
        },
        {
          key: "role-management",
          label: "角色管理",
          icon: "TeamOutlined",
          path: "/system/roles",
          component: "RoleManagement"
        },
        {
          key: "config-management",
          label: "系统配置",
          icon: "SettingOutlined",
          path: "/system/configs",
          component: "ConfigManagement"
        },
        {
          key: "log-management",
          label: "日志管理",
          icon: "FileTextOutlined",
          path: "/system/logs",
          component: "LogManagement"
        }
      ]
    },
    {
      key: "business",
      icon: "AppstoreOutlined",
      label: "业务管理",
      path: "/business",
      children: [
        {
          key: "notification-management",
          label: "通知管理",
          icon: "BellOutlined",
          path: "/business/notifications",
          component: "NotificationManagement"
        },
        {
          key: "changelog-management",
          label: "更新日志",
          icon: "RocketOutlined",
          path: "/business/changelogs",
          component: "ChangelogManagement"
        },
        {
          key: "file-management",
          label: "文件管理",
          icon: "FileOutlined",
          path: "/business/files",
          component: "FileManagement"
        }
      ]
    },
    {
      key: "user",
      icon: "UserOutlined",
      label: "用户管理",
      path: "/users",
      component: "UserList"
    },
    {
      key: "video",
      icon: "VideoCameraOutlined",
      label: "视频管理",
      path: "/videos",
      component: "VideoList"
    },
    {
      key: "upload",
      icon: "UploadOutlined",
      label: "文件上传",
      path: "/upload",
      component: "FileUpload"
    },
    {
        key: "hk-test",
        icon: "ToolOutlined", 
        label: "HK-功能测试",
        path: "/hk-test",
        children: [
            {
                key: "h5-player",
                label: "H5-Player播放器",
                icon: "PlayCircleOutlined",
                path: "/hk-test/h5-player",
                component: "H5Player"
            },
            {
                key: "hk-api-docs",
                label: "API接口文档",
                icon: "ApiOutlined",
                path: "/hk-test/api-docs",
                component: "HkApiDocs"
            }
        ]
    },
    {
        key: "doc-notes",
        icon: "BookOutlined",
        label: "文档笔记",
        path: "/doc-notes",
        component: "DocNotes"
    }
];

async function main() {
  console.log('开始初始化数据库...');

  // 清空现有数据
  await prisma.sysLog.deleteMany();
  await prisma.sysConfig.deleteMany();
  await prisma.tblNotification.deleteMany();
  await prisma.sysMenu.deleteMany();
  await prisma.sysUser.deleteMany();
  await prisma.sysRole.deleteMany();

  console.log('1. 创建系统角色...');
  const adminRole = await prisma.sysRole.create({
    data: {
      roleName: '超级管理员',
      roleKey: 'admin',
      description: '系统超级管理员，拥有所有权限',
      status: 1
    }
  });

  const userRole = await prisma.sysRole.create({
    data: {
      roleName: '普通用户',
      roleKey: 'user',
      description: '普通用户，拥有基本权限',
      status: 1
    }
  });

  console.log('2. 创建系统用户...');
  await prisma.sysUser.create({
    data: {
      username: 'admin',
      password: 'admin123', // 实际项目中应该加密
      email: 'admin@example.com',
      phone: '13800138000',
      status: 1,
      roleId: adminRole.id
    }
  });

  await prisma.sysUser.create({
    data: {
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
      status: 1,
      roleId: userRole.id
    }
  });

  console.log('3. 创建系统菜单...');
  for (let i = 0; i < menuData.length; i++) {
    const item = menuData[i];
    
    const createdItem = await prisma.sysMenu.create({
      data: {
        key: item.key,
        label: item.label,
        icon: item.icon,
        path: item.path,
        component: item.component,
        orderNum: i,
        menuType: item.children ? 'M' : 'C',
        visible: 1,
        status: 1
      },
    });

    if (item.children) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        await prisma.sysMenu.create({
          data: {
            key: child.key,
            label: child.label,
            icon: child.icon,
            path: child.path,
            component: child.component,
            parentId: createdItem.id,
            orderNum: j,
            menuType: 'C',
            visible: 1,
            status: 1
          },
        });
      }
    }
  }

  console.log('4. 创建测试通知...');
  await prisma.tblNotification.create({
    data: {
      title: '系统升级通知',
      content: '系统将于今晚22:00进行升级维护，预计耗时2小时。',
      type: 'warning',
      priority: 1,
      status: 1,
      publishAt: new Date()
    }
  });

  await prisma.tblNotification.create({
    data: {
      title: '欢迎使用本系统',
      content: '感谢您使用本系统，如有问题请联系管理员。',
      type: 'info',
      priority: 0,
      status: 1,
      publishAt: new Date()
    }
  });

  console.log('5. 创建系统配置...');
  await prisma.sysConfig.create({
    data: {
      configKey: 'system.name',
      configValue: 'Next.js Admin System',
      configType: 'system',
      remark: '系统名称'
    }
  });

  await prisma.sysConfig.create({
    data: {
      configKey: 'system.version',
      configValue: '1.0.0',
      configType: 'system',
      remark: '系统版本'
    }
  });

  console.log('✅ 数据库初始化完成！');
  console.log('');
  console.log('默认账号信息：');
  console.log('管理员 - 用户名: admin, 密码: admin123');
  console.log('普通用户 - 用户名: user, 密码: user123');
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
