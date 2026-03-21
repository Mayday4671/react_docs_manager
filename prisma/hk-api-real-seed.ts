import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始清理现有数据...');
  
  // 清理现有数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  console.log('开始创建海康威视API分类...');

  // 创建分类
  const categories = [
    {
      name: '资源管理',
      description: '设备资源、区域、摄像头等资源管理相关接口',
      icon: 'DatabaseOutlined',
      orderNum: 1
    },
    {
      name: '视频管理', 
      description: '视频预览、录像回放、视频流管理相关接口',
      icon: 'VideoCameraOutlined',
      orderNum: 2
    },
    {
      name: '报警管理',
      description: '报警事件、报警配置、报警联动相关接口', 
      icon: 'AlertOutlined',
      orderNum: 3
    },
    {
      name: '系统管理',
      description: '用户管理、权限配置、系统设置相关接口',
      icon: 'SettingOutlined', 
      orderNum: 4
    },
    {
      name: '事件管理',
      description: '事件订阅、事件推送、事件查询相关接口',
      icon: 'BellOutlined',
      orderNum: 5
    },
    {
      name: '门禁管理',
      description: '门禁设备、人员权限、通行记录相关接口',
      icon: 'KeyOutlined',
      orderNum: 6
    },
    {
      name: '人脸识别',
      description: '人脸库管理、人脸比对、人脸检索相关接口',
      icon: 'UserOutlined',
      orderNum: 7
    },
    {
      name: '车辆管理',
      description: '车辆识别、车牌管理、停车场管理相关接口',
      icon: 'CarOutlined',
      orderNum: 8
    },
    {
      name: '统计分析',
      description: '数据统计、报表分析、业务分析相关接口',
      icon: 'BarChartOutlined',
      orderNum: 9
    },
    {
      name: '平台对接',
      description: '第三方平台对接、数据同步、接口集成相关接口',
      icon: 'ApiOutlined',
      orderNum: 10
    }
  ];

  const createdCategories: any[] = [];
  for (const category of categories) {
    const created = await prisma.hkApiCategory.create({
      data: category
    });
    createdCategories.push(created);
    console.log(`创建分类: ${category.name}`);
  }

  console.log('开始创建海康威视API接口...');

  // 资源管理API
  const resourceApis = [
    {
      name: '获取区域列表',
      path: '/api/resource/v1/regions',
      method: 'POST',
      description: '分页获取区域信息列表',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success", 
        data: {
          total: 100,
          pageNo: 1,
          pageSize: 20,
          list: [
            {
              regionIndexCode: "root",
              regionName: "根区域",
              parentRegionIndexCode: "",
              regionPath: "root"
            }
          ]
        }
      }, null, 2),
      callCount: 1250
    },
    {
      name: '获取摄像头列表',
      path: '/api/resource/v1/cameras',
      method: 'POST', 
      description: '分页获取摄像头设备信息',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20,
        regionIndexCode: "root"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 500,
          list: [
            {
              cameraIndexCode: "a10cafaa777c49a5af92c165c95970e0",
              cameraName: "大门口摄像头",
              cameraType: 0,
              regionIndexCode: "root"
            }
          ]
        }
      }, null, 2),
      callCount: 2100
    },
    {
      name: '根据区域获取摄像头',
      path: '/api/resource/v1/regions/regionIndexCode/cameras',
      method: 'POST',
      description: '根据区域编号获取下级监控点列表',
      requestBody: JSON.stringify({
        regionIndexCode: "root",
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0", 
        msg: "success",
        data: {
          list: [
            {
              cameraIndexCode: "camera001",
              cameraName: "一号摄像头",
              regionIndexCode: "root"
            }
          ]
        }
      }, null, 2),
      callCount: 890
    },
    {
      name: '获取设备详情',
      path: '/api/resource/v1/cameras/indexCode',
      method: 'GET',
      description: '根据摄像头编码获取设备详细信息',
      requestParams: JSON.stringify({
        cameraIndexCode: "a10cafaa777c49a5af92c165c95970e0"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success", 
        data: {
          cameraIndexCode: "a10cafaa777c49a5af92c165c95970e0",
          cameraName: "大门口摄像头",
          cameraType: 0,
          status: 1,
          regionIndexCode: "root"
        }
      }, null, 2),
      callCount: 1560
    },
    {
      name: '获取编码设备列表',
      path: '/api/resource/v1/encodeDevices',
      method: 'POST',
      description: '分页获取编码设备信息',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 50,
          list: [
            {
              encodeDevIndexCode: "encode001",
              encodeDevName: "编码器01",
              deviceType: "encoder"
            }
          ]
        }
      }, null, 2),
      callCount: 340
    },
    {
      name: '获取解码设备列表',
      path: '/api/resource/v1/decodeDevices', 
      method: 'POST',
      description: '分页获取解码设备信息',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 30,
          list: [
            {
              decodeDevIndexCode: "decode001", 
              decodeDevName: "解码器01",
              deviceType: "decoder"
            }
          ]
        }
      }, null, 2),
      callCount: 280
    },
    {
      name: '获取存储设备列表',
      path: '/api/resource/v1/storageDevices',
      method: 'POST',
      description: '分页获取存储设备信息',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success", 
        data: {
          total: 20,
          list: [
            {
              storageDevIndexCode: "storage001",
              storageDevName: "存储设备01",
              capacity: "10TB"
            }
          ]
        }
      }, null, 2),
      callCount: 150
    },
    {
      name: '获取通道资源',
      path: '/api/resource/v1/channels',
      method: 'POST',
      description: '获取设备通道资源信息',
      requestBody: JSON.stringify({
        deviceIndexCode: "device001",
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          list: [
            {
              channelIndexCode: "channel001",
              channelName: "通道1",
              channelType: 0
            }
          ]
        }
      }, null, 2),
      callCount: 670
    },
    {
      name: '获取区域树',
      path: '/api/resource/v1/regions/tree',
      method: 'POST', 
      description: '获取区域树形结构',
      requestBody: JSON.stringify({
        regionIndexCode: "root"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: [
          {
            regionIndexCode: "root",
            regionName: "根区域",
            children: [
              {
                regionIndexCode: "area001",
                regionName: "一区",
                children: []
              }
            ]
          }
        ]
      }, null, 2),
      callCount: 450
    },
    {
      name: '获取设备能力集',
      path: '/api/resource/v1/cameras/capabilities',
      method: 'POST',
      description: '获取摄像头设备能力集信息',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          ptz: true,
          zoom: true,
          nightVision: true,
          audioInput: false
        }
      }, null, 2),
      callCount: 320
    }
  ];

  // 视频管理API
  const videoApis = [
    {
      name: '获取预览取流URL',
      path: '/api/video/v1/cameras/previewURLs',
      method: 'POST',
      description: '根据摄像头编码获取预览视频流地址',
      requestBody: JSON.stringify({
        cameraIndexCode: "a10cafaa777c49a5af92c165c95970e0",
        streamType: 0,
        protocol: "rtsp",
        transmode: 1
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          url: "rtsp://192.168.1.100:554/stream1"
        }
      }, null, 2),
      callCount: 3200
    },
    {
      name: '获取回放取流URL',
      path: '/api/video/v1/cameras/playbackURLs',
      method: 'POST',
      description: '获取录像回放视频流地址',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        beginTime: "2024-01-01T00:00:00+08:00",
        endTime: "2024-01-01T23:59:59+08:00",
        protocol: "rtsp"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          url: "rtsp://192.168.1.100:554/playback1"
        }
      }, null, 2),
      callCount: 1800
    },
    {
      name: '录像检索',
      path: '/api/video/v1/cameras/records',
      method: 'POST',
      description: '检索摄像头录像文件信息',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        beginTime: "2024-01-01T00:00:00+08:00", 
        endTime: "2024-01-01T23:59:59+08:00",
        recordType: 0
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          list: [
            {
              fileName: "record_20240101_001.mp4",
              beginTime: "2024-01-01T00:00:00+08:00",
              endTime: "2024-01-01T01:00:00+08:00",
              fileSize: 1024000
            }
          ]
        }
      }, null, 2),
      callCount: 950
    },
    {
      name: '录像下载',
      path: '/api/video/v1/cameras/records/download',
      method: 'POST',
      description: '下载录像文件',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        fileName: "record_20240101_001.mp4"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          downloadUrl: "http://192.168.1.100/download/record_20240101_001.mp4"
        }
      }, null, 2),
      callCount: 420
    },
    {
      name: '云台控制',
      path: '/api/video/v1/cameras/ptzControl',
      method: 'POST',
      description: '控制摄像头云台转动',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        ptzCmd: "LEFT_START",
        speed: 5
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 680
    },
    {
      name: '预置位控制',
      path: '/api/video/v1/cameras/presetControl',
      method: 'POST',
      description: '控制摄像头预置位',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        presetCmd: "GOTO_PRESET",
        presetIndex: 1
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 380
    },
    {
      name: '开始录像',
      path: '/api/video/v1/cameras/startRecord',
      method: 'POST',
      description: '开始手动录像',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        recordType: 1
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          recordId: "record123456"
        }
      }, null, 2),
      callCount: 290
    },
    {
      name: '停止录像',
      path: '/api/video/v1/cameras/stopRecord',
      method: 'POST',
      description: '停止手动录像',
      requestBody: JSON.stringify({
        recordId: "record123456"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 285
    },
    {
      name: '获取视频流状态',
      path: '/api/video/v1/cameras/streamStatus',
      method: 'POST',
      description: '获取视频流连接状态',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          status: 1,
          streamUrl: "rtsp://192.168.1.100:554/stream1",
          connectedClients: 3
        }
      }, null, 2),
      callCount: 560
    },
    {
      name: '视频抓拍',
      path: '/api/video/v1/cameras/capture',
      method: 'POST',
      description: '抓拍摄像头当前画面',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        pictureFormat: "JPEG",
        pictureSize: "1920*1080"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          pictureUrl: "http://192.168.1.100/capture/20240101_120000.jpg"
        }
      }, null, 2),
      callCount: 1200
    }
  ];

  // 报警管理API
  const alarmApis = [
    {
      name: '获取报警事件',
      path: '/api/alarm/v1/alarms',
      method: 'POST',
      description: '分页获取报警事件列表',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20,
        startTime: "2024-01-01T00:00:00+08:00",
        endTime: "2024-01-01T23:59:59+08:00"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 100,
          list: [
            {
              alarmId: "alarm001",
              alarmType: "motion_detection",
              alarmTime: "2024-01-01T12:00:00+08:00",
              cameraIndexCode: "camera001",
              alarmLevel: 2
            }
          ]
        }
      }, null, 2),
      callCount: 1450
    },
    {
      name: '报警确认',
      path: '/api/alarm/v1/alarms/confirm',
      method: 'POST',
      description: '确认处理报警事件',
      requestBody: JSON.stringify({
        alarmId: "alarm001",
        confirmUser: "admin",
        confirmRemark: "已处理"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 890
    },
    {
      name: '获取报警配置',
      path: '/api/alarm/v1/alarmConfig',
      method: 'POST',
      description: '获取设备报警配置信息',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          motionDetection: true,
          videoLoss: true,
          tamperDetection: false,
          alarmLevel: 2
        }
      }, null, 2),
      callCount: 340
    },
    {
      name: '设置报警配置',
      path: '/api/alarm/v1/alarmConfig/set',
      method: 'POST',
      description: '设置设备报警配置',
      requestBody: JSON.stringify({
        cameraIndexCode: "camera001",
        motionDetection: true,
        videoLoss: true,
        alarmLevel: 3
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 180
    },
    {
      name: '报警联动配置',
      path: '/api/alarm/v1/linkage',
      method: 'POST',
      description: '配置报警联动动作',
      requestBody: JSON.stringify({
        alarmType: "motion_detection",
        cameraIndexCode: "camera001",
        linkageActions: [
          {
            actionType: "record",
            duration: 60
          }
        ]
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 120
    },
    {
      name: '获取报警统计',
      path: '/api/alarm/v1/statistics',
      method: 'POST',
      description: '获取报警事件统计信息',
      requestBody: JSON.stringify({
        startTime: "2024-01-01T00:00:00+08:00",
        endTime: "2024-01-31T23:59:59+08:00",
        groupBy: "day"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          totalCount: 500,
          statistics: [
            {
              date: "2024-01-01",
              count: 15
            }
          ]
        }
      }, null, 2),
      callCount: 230
    },
    {
      name: '报警推送订阅',
      path: '/api/alarm/v1/subscribe',
      method: 'POST',
      description: '订阅报警事件推送',
      requestBody: JSON.stringify({
        subscribeUrl: "http://your-server.com/alarm/callback",
        alarmTypes: ["motion_detection", "video_loss"],
        cameraIndexCodes: ["camera001", "camera002"]
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          subscribeId: "sub123456"
        }
      }, null, 2),
      callCount: 85
    },
    {
      name: '取消报警订阅',
      path: '/api/alarm/v1/unsubscribe',
      method: 'POST',
      description: '取消报警事件推送订阅',
      requestBody: JSON.stringify({
        subscribeId: "sub123456"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 45
    }
  ];

  // 系统管理API
  const systemApis = [
    {
      name: '获取用户列表',
      path: '/api/system/v1/users',
      method: 'POST',
      description: '分页获取系统用户列表',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 50,
          list: [
            {
              userId: "user001",
              userName: "admin",
              userType: 0,
              status: 1
            }
          ]
        }
      }, null, 2),
      callCount: 680
    },
    {
      name: '创建用户',
      path: '/api/system/v1/users/create',
      method: 'POST',
      description: '创建系统用户',
      requestBody: JSON.stringify({
        userName: "testuser",
        password: "123456",
        userType: 1,
        roleIds: ["role001"]
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          userId: "user002"
        }
      }, null, 2),
      callCount: 120
    },
    {
      name: '获取角色列表',
      path: '/api/system/v1/roles',
      method: 'POST',
      description: '获取系统角色列表',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          list: [
            {
              roleId: "role001",
              roleName: "管理员",
              roleType: 0
            }
          ]
        }
      }, null, 2),
      callCount: 340
    },
    {
      name: '获取权限列表',
      path: '/api/system/v1/permissions',
      method: 'POST',
      description: '获取系统权限列表',
      requestBody: JSON.stringify({
        roleId: "role001"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          permissions: [
            {
              permissionId: "perm001",
              permissionName: "设备管理",
              resourceType: "camera"
            }
          ]
        }
      }, null, 2),
      callCount: 280
    },
    {
      name: '获取系统配置',
      path: '/api/system/v1/config',
      method: 'GET',
      description: '获取系统配置信息',
      requestParams: JSON.stringify({}, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          systemName: "综合安防管理平台",
          version: "V1.4.0",
          maxCameraCount: 10000
        }
      }, null, 2),
      callCount: 450
    },
    {
      name: '修改系统配置',
      path: '/api/system/v1/config/update',
      method: 'POST',
      description: '修改系统配置',
      requestBody: JSON.stringify({
        systemName: "海康综合安防平台",
        maxCameraCount: 15000
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success"
      }, null, 2),
      callCount: 85
    },
    {
      name: '获取操作日志',
      path: '/api/system/v1/logs',
      method: 'POST',
      description: '分页获取系统操作日志',
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 20,
        startTime: "2024-01-01T00:00:00+08:00",
        endTime: "2024-01-01T23:59:59+08:00"
      }, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          total: 1000,
          list: [
            {
              logId: "log001",
              operation: "用户登录",
              operator: "admin",
              operateTime: "2024-01-01T09:00:00+08:00"
            }
          ]
        }
      }, null, 2),
      callCount: 720
    },
    {
      name: '系统健康检查',
      path: '/api/system/v1/health',
      method: 'GET',
      description: '检查系统运行状态',
      requestParams: JSON.stringify({}, null, 2),
      responseExample: JSON.stringify({
        code: "0",
        msg: "success",
        data: {
          status: "healthy",
          uptime: 86400,
          cpuUsage: 45.2,
          memoryUsage: 68.5
        }
      }, null, 2),
      callCount: 1200
    }
  ];

  // 批量创建API
  const allApis = [
    ...resourceApis.map(api => ({ ...api, categoryId: createdCategories[0].id })),
    ...videoApis.map(api => ({ ...api, categoryId: createdCategories[1].id })),
    ...alarmApis.map(api => ({ ...api, categoryId: createdCategories[2].id })),
    ...systemApis.map(api => ({ ...api, categoryId: createdCategories[3].id }))
  ];

  let createdCount = 0;
  for (const api of allApis) {
    await prisma.hkApi.create({
      data: api
    });
    createdCount++;
    if (createdCount % 5 === 0) {
      console.log(`已创建 ${createdCount}/${allApis.length} 个API接口...`);
    }
  }

  console.log(`\n✅ 数据导入完成！`);
  console.log(`📊 统计信息:`);
  console.log(`   - 分类数量: ${createdCategories.length}`);
  console.log(`   - API接口数量: ${allApis.length}`);
  console.log(`   - 总调用次数: ${allApis.reduce((sum, api) => sum + api.callCount, 0)}`);
}

main()
  .catch((e) => {
    console.error('❌ 数据导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });