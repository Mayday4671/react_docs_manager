import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始导入完整的海康威视API数据...');

  // 清空现有数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  // 创建API分类
  const categories = [
    {
      name: '设备管理',
      description: '设备注册、查询、配置等相关接口',
      icon: 'device',
      orderNum: 1
    },
    {
      name: '用户管理',
      description: '用户认证、权限管理等相关接口',
      icon: 'user',
      orderNum: 2
    },
    {
      name: '视频管理',
      description: '视频流获取、录像查询、回放等相关接口',
      icon: 'video',
      orderNum: 3
    },
    {
      name: '报警管理',
      description: '报警事件订阅、查询、处理等相关接口',
      icon: 'alarm',
      orderNum: 4
    },
    {
      name: '门禁管理',
      description: '门禁控制、权限配置、记录查询等相关接口',
      icon: 'door',
      orderNum: 5
    },
    {
      name: '系统管理',
      description: '系统配置、日志查询、状态监控等相关接口',
      icon: 'system',
      orderNum: 6
    },
    {
      name: '事件管理',
      description: '事件订阅、推送、查询等相关接口',
      icon: 'event',
      orderNum: 7
    },
    {
      name: '资源管理',
      description: '资源查询、配置、统计等相关接口',
      icon: 'resource',
      orderNum: 8
    }
  ];

  const createdCategories = await Promise.all(
    categories.map(category => 
      prisma.hkApiCategory.create({ data: category })
    )
  );

  console.log(`创建了 ${createdCategories.length} 个分类`);

  // 创建API接口数据
  const apis = [
    // 设备管理类接口
    {
      name: '获取设备列表',
      path: '/artemis/api/resource/v1/cameras',
      method: 'POST',
      description: '分页获取监控点资源列表',
      summary: '根据条件查询监控点资源信息',
      categoryId: createdCategories[0].id,
      requestHeaders: JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {token}'
      }),
      requestParams: JSON.stringify({
        pageNo: 1,
        pageSize: 1000
      }),
      requestBody: JSON.stringify({
        cameraName: '',
        cameraType: 0,
        onlineStatus: 1
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 100,
          list: [
            {
              cameraIndexCode: 'camera001',
              cameraName: '监控点1',
              cameraType: 0,
              onlineStatus: 1
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 156
    },
    {
      name: '获取设备详情',
      path: '/artemis/api/resource/v1/camera/detail',
      method: 'POST',
      description: '根据监控点编码获取监控点详细信息',
      summary: '查询指定监控点的详细配置信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          cameraIndexCode: 'camera001',
          cameraName: '监控点1',
          cameraType: 0,
          onlineStatus: 1,
          ip: '192.168.1.100',
          port: 8000
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '设备配置修改',
      path: '/artemis/api/resource/v1/camera/config',
      method: 'PUT',
      description: '修改监控点配置信息',
      summary: '更新指定监控点的配置参数',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        cameraName: '新监控点名称',
        description: '监控点描述'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 34
    },
    {
      name: '设备状态查询',
      path: '/artemis/api/resource/v1/camera/status',
      method: 'POST',
      description: '批量查询监控点在线状态',
      summary: '获取多个监控点的实时状态信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({
        cameraIndexCodes: ['camera001', 'camera002']
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: [
          {
            cameraIndexCode: 'camera001',
            onlineStatus: 1
          }
        ]
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 78
    },
    {
      name: '设备重启',
      path: '/artemis/api/resource/v1/camera/reboot',
      method: 'POST',
      description: '远程重启监控设备',
      summary: '通过接口远程重启指定的监控设备',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 23
    },

    // 用户管理类接口
    {
      name: '用户登录',
      path: '/artemis/api/system/v1/login',
      method: 'POST',
      description: '用户登录认证接口',
      summary: '通过用户名密码进行身份认证',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({
        username: 'admin',
        password: 'password123'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expireTime: 7200
        }
      }),
      version: '1.0',
      needAuth: 0,
      callCount: 245
    },
    {
      name: '获取用户信息',
      path: '/artemis/api/system/v1/user/info',
      method: 'GET',
      description: '获取当前登录用户的详细信息',
      summary: '查询用户基本信息和权限',
      categoryId: createdCategories[1].id,
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          userId: 'user001',
          username: 'admin',
          realName: '管理员',
          roles: ['admin']
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    },
    {
      name: '修改用户密码',
      path: '/artemis/api/system/v1/user/password',
      method: 'PUT',
      description: '修改用户登录密码',
      summary: '用户修改自己的登录密码',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({
        oldPassword: 'oldpass123',
        newPassword: 'newpass456'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 67
    },
    {
      name: '用户权限查询',
      path: '/artemis/api/system/v1/user/permissions',
      method: 'GET',
      description: '获取当前用户的权限列表',
      summary: '查询用户拥有的功能权限',
      categoryId: createdCategories[1].id,
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          permissions: ['camera:view', 'camera:control', 'alarm:view']
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 98
    },

    // 视频管理类接口
    {
      name: '获取预览流地址',
      path: '/artemis/api/video/v1/cameras/previewURLs',
      method: 'POST',
      description: '获取监控点实时预览流地址',
      summary: '获取指定监控点的实时视频流URL',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        streamType: 0,
        protocol: 'rtsp'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          url: 'rtsp://192.168.1.100:554/stream1'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 189
    },
    {
      name: '录像查询',
      path: '/artemis/api/video/v1/cameras/records',
      method: 'POST',
      description: '查询监控点录像文件列表',
      summary: '根据时间范围查询录像记录',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        startTime: '2024-01-01T00:00:00',
        endTime: '2024-01-01T23:59:59',
        recordType: 0
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 10,
          list: [
            {
              fileName: 'record001.mp4',
              startTime: '2024-01-01T08:00:00',
              endTime: '2024-01-01T09:00:00',
              fileSize: 1024000
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 145
    },
    {
      name: '录像回放',
      path: '/artemis/api/video/v1/cameras/playback',
      method: 'POST',
      description: '获取录像回放流地址',
      summary: '获取指定时间段录像的回放流URL',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        startTime: '2024-01-01T08:00:00',
        endTime: '2024-01-01T09:00:00',
        protocol: 'rtsp'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          url: 'rtsp://192.168.1.100:554/playback/camera001'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 98
    },
    {
      name: '录像下载',
      path: '/artemis/api/video/v1/cameras/download',
      method: 'POST',
      description: '下载录像文件',
      summary: '获取录像文件的下载链接',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        fileName: 'record001.mp4'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          downloadUrl: 'http://192.168.1.100:8080/download/record001.mp4'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 56
    },
    {
      name: 'PTZ控制',
      path: '/artemis/api/video/v1/cameras/ptz/control',
      method: 'POST',
      description: '云台控制接口',
      summary: '控制摄像头的云台转动、缩放等操作',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001',
        ptzCmd: 'LEFT',
        speed: 5
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 134
    },

    // 报警管理类接口
    {
      name: '报警事件查询',
      path: '/artemis/api/alarm/v1/alarms',
      method: 'POST',
      description: '分页查询报警事件列表',
      summary: '根据条件查询历史报警事件',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({
        startTime: '2024-01-01T00:00:00',
        endTime: '2024-01-01T23:59:59',
        alarmType: 1,
        pageNo: 1,
        pageSize: 100
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 50,
          list: [
            {
              alarmId: 'alarm001',
              alarmType: 1,
              alarmTime: '2024-01-01T10:30:00',
              cameraIndexCode: 'camera001',
              description: '移动侦测报警'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 112
    },
    {
      name: '报警订阅',
      path: '/artemis/api/alarm/v1/subscribe',
      method: 'POST',
      description: '订阅实时报警事件推送',
      summary: '配置报警事件的实时推送',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({
        callbackUrl: 'http://your-server.com/alarm/callback',
        alarmTypes: [1, 2, 3],
        cameraIndexCodes: ['camera001', 'camera002']
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          subscriptionId: 'sub001'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 45
    },
    {
      name: '报警处理',
      path: '/artemis/api/alarm/v1/alarm/handle',
      method: 'POST',
      description: '处理报警事件',
      summary: '确认或忽略报警事件',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({
        alarmId: 'alarm001',
        handleType: 1,
        handleRemark: '已确认处理'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 78
    },

    // 门禁管理类接口
    {
      name: '门禁设备列表',
      path: '/artemis/api/acs/v1/doors',
      method: 'POST',
      description: '获取门禁设备列表',
      summary: '查询门禁控制器和门点信息',
      categoryId: createdCategories[4].id,
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 100
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 20,
          list: [
            {
              doorIndexCode: 'door001',
              doorName: '主入口',
              doorStatus: 1,
              controllerIndexCode: 'ctrl001'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 67
    },
    {
      name: '远程开门',
      path: '/artemis/api/acs/v1/door/control',
      method: 'POST',
      description: '远程控制门禁开门',
      summary: '通过接口远程开启指定门禁',
      categoryId: createdCategories[4].id,
      requestBody: JSON.stringify({
        doorIndexCode: 'door001',
        controlType: 1
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success'
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '门禁记录查询',
      path: '/artemis/api/acs/v1/door/records',
      method: 'POST',
      description: '查询门禁刷卡记录',
      summary: '根据条件查询门禁通行记录',
      categoryId: createdCategories[4].id,
      requestBody: JSON.stringify({
        doorIndexCode: 'door001',
        startTime: '2024-01-01T00:00:00',
        endTime: '2024-01-01T23:59:59',
        pageNo: 1,
        pageSize: 100
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 200,
          list: [
            {
              recordId: 'record001',
              doorIndexCode: 'door001',
              cardNo: 'card001',
              personName: '张三',
              accessTime: '2024-01-01T08:30:00',
              accessResult: 1
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 156
    },

    // 系统管理类接口
    {
      name: '系统状态查询',
      path: '/artemis/api/system/v1/status',
      method: 'GET',
      description: '获取系统运行状态信息',
      summary: '查询系统各模块的运行状态',
      categoryId: createdCategories[5].id,
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          systemStatus: 1,
          cpuUsage: 45.6,
          memoryUsage: 67.8,
          diskUsage: 34.2
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '系统日志查询',
      path: '/artemis/api/system/v1/logs',
      method: 'POST',
      description: '分页查询系统操作日志',
      summary: '根据条件查询系统日志记录',
      categoryId: createdCategories[5].id,
      requestBody: JSON.stringify({
        startTime: '2024-01-01T00:00:00',
        endTime: '2024-01-01T23:59:59',
        logLevel: 'INFO',
        pageNo: 1,
        pageSize: 100
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 500,
          list: [
            {
              logId: 'log001',
              logTime: '2024-01-01T10:30:00',
              logLevel: 'INFO',
              message: '用户登录成功'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 156
    },
    {
      name: '系统配置查询',
      path: '/artemis/api/system/v1/config',
      method: 'GET',
      description: '获取系统配置信息',
      summary: '查询系统的配置参数',
      categoryId: createdCategories[5].id,
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          systemName: '海康威视综合安防管理平台',
          version: '1.4.0',
          maxCameraCount: 10000,
          maxUserCount: 1000
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 87
    },

    // 事件管理类接口
    {
      name: '事件订阅',
      path: '/artemis/api/event/v1/subscribe',
      method: 'POST',
      description: '订阅系统事件推送',
      summary: '配置各类事件的实时推送',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({
        callbackUrl: 'http://your-server.com/event/callback',
        eventTypes: ['DEVICE_ONLINE', 'DEVICE_OFFLINE', 'ALARM'],
        resourceCodes: ['camera001', 'door001']
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          subscriptionId: 'event_sub001'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 78
    },
    {
      name: '事件查询',
      path: '/artemis/api/event/v1/events',
      method: 'POST',
      description: '分页查询历史事件记录',
      summary: '根据条件查询系统事件日志',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({
        startTime: '2024-01-01T00:00:00',
        endTime: '2024-01-01T23:59:59',
        eventTypes: ['DEVICE_ONLINE'],
        pageNo: 1,
        pageSize: 100
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 200,
          list: [
            {
              eventId: 'event001',
              eventType: 'DEVICE_ONLINE',
              eventTime: '2024-01-01T08:00:00',
              resourceCode: 'camera001',
              description: '设备上线'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 134
    },

    // 资源管理类接口
    {
      name: '资源统计',
      path: '/artemis/api/resource/v1/statistics',
      method: 'GET',
      description: '获取系统资源统计信息',
      summary: '统计各类资源的数量和状态',
      categoryId: createdCategories[7].id,
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          totalCameras: 1000,
          onlineCameras: 950,
          totalDoors: 200,
          onlineDoors: 195,
          totalAlarms: 50
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '资源树查询',
      path: '/artemis/api/resource/v1/tree',
      method: 'POST',
      description: '获取资源组织树结构',
      summary: '查询资源的层级组织结构',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({
        resourceType: 'camera',
        treeType: 'region'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: [
          {
            nodeId: 'region001',
            nodeName: '区域1',
            nodeType: 'region',
            children: [
              {
                nodeId: 'camera001',
                nodeName: '监控点1',
                nodeType: 'camera'
              }
            ]
          }
        ]
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 167
    },
    {
      name: '资源导入',
      path: '/artemis/api/resource/v1/import',
      method: 'POST',
      description: '批量导入资源信息',
      summary: '通过文件批量导入设备资源',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({
        importType: 'camera',
        fileUrl: 'http://server.com/import/cameras.xlsx'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          taskId: 'import_task_001',
          totalCount: 100,
          successCount: 95,
          failCount: 5
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 23
    }
  ];

  // 批量创建API
  const createdApis = await Promise.all(
    apis.map(api => 
      prisma.hkApi.create({ data: api })
    )
  );

  console.log(`创建了 ${createdApis.length} 个API接口`);
  console.log('完整的海康威视API数据导入完成！');

  // 输出统计信息
  const stats = await Promise.all([
    prisma.hkApiCategory.count(),
    prisma.hkApi.count(),
    prisma.hkApi.aggregate({
      _sum: { callCount: true }
    })
  ]);

  console.log('\n=== 导入统计 ===');
  console.log(`API分类数量: ${stats[0]}`);
  console.log(`API接口数量: ${stats[1]}`);
  console.log(`总调用次数: ${stats[2]._sum.callCount || 0}`);

  // 按分类统计
  console.log('\n=== 分类统计 ===');
  for (const category of createdCategories) {
    const count = await prisma.hkApi.count({
      where: { categoryId: category.id }
    });
    console.log(`${category.name}: ${count} 个接口`);
  }
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });