import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 海康API示例数据
const hkApiData = [
  {
    category: {
      name: '设备管理',
      description: '设备相关的API接口，包括设备查询、配置等',
      icon: 'SettingOutlined',
      orderNum: 1
    },
    apis: [
      {
        name: '获取设备列表',
        path: '/artemis/api/resource/v1/cameras',
        method: 'POST',
        summary: '分页获取监控点资源',
        description: '根据条件分页获取监控点（摄像头）资源信息',
        requestBody: JSON.stringify({
          pageNo: 1,
          pageSize: 20,
          cameraName: "",
          cameraType: 0
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
                cameraIndexCode: "1001001001310000001",
                cameraName: "测试摄像头01",
                cameraType: 0,
                capabilitySet: "001,002,003",
                createTime: "2024-01-01T10:00:00.000+08:00"
              }
            ]
          }
        }, null, 2),
        needAuth: 1,
        version: 'v1',
        notes: '需要在请求头中携带认证信息'
      },
      {
        name: '获取设备详情',
        path: '/artemis/api/resource/v1/camera/{cameraIndexCode}',
        method: 'GET',
        summary: '根据监控点编号获取详情',
        description: '根据监控点编号获取单个监控点的详细信息',
        requestParams: JSON.stringify({
          cameraIndexCode: "监控点编号"
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            cameraIndexCode: "1001001001310000001",
            cameraName: "测试摄像头01",
            cameraType: 0,
            longitude: 120.123456,
            latitude: 30.123456,
            altitude: 100.5,
            capabilitySet: "001,002,003"
          }
        }, null, 2),
        needAuth: 1,
        version: 'v1'
      }
    ]
  },
  {
    category: {
      name: '视频管理',
      description: '视频播放、录像回放等相关API',
      icon: 'PlayCircleOutlined',
      orderNum: 2
    },
    apis: [
      {
        name: '获取预览取流URL',
        path: '/artemis/api/video/v1/cameras/previewURLs',
        method: 'POST',
        summary: '获取监控点预览取流URL',
        description: '根据监控点编号获取实时预览的取流地址',
        requestBody: JSON.stringify({
          cameraIndexCode: "1001001001310000001",
          streamType: 0,
          protocol: "rtmp",
          transmode: 1,
          expand: "streamform=ps"
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            url: "rtmp://192.168.1.100:1935/openUrl/1001001001310000001",
            expireTime: 1640995200000
          }
        }, null, 2),
        needAuth: 1,
        version: 'v1',
        rateLimit: '每秒最多10次调用'
      },
      {
        name: '获取回放取流URL',
        path: '/artemis/api/video/v1/cameras/playbackURLs',
        method: 'POST',
        summary: '获取监控点回放取流URL',
        description: '根据时间段获取监控点录像回放的取流地址',
        requestBody: JSON.stringify({
          cameraIndexCode: "1001001001310000001",
          recordSource: 0,
          beginTime: "2024-01-01T00:00:00.000+08:00",
          endTime: "2024-01-01T23:59:59.000+08:00",
          protocol: "rtmp",
          transmode: 1
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            url: "rtmp://192.168.1.100:1935/playback/1001001001310000001",
            expireTime: 1640995200000
          }
        }, null, 2),
        needAuth: 1,
        version: 'v1'
      }
    ]
  },
  {
    category: {
      name: '用户管理',
      description: '用户认证、权限管理等API',
      icon: 'UserOutlined',
      orderNum: 3
    },
    apis: [
      {
        name: '用户登录',
        path: '/artemis/api/v1/oauth/token',
        method: 'POST',
        summary: '用户登录获取访问令牌',
        description: '通过用户名密码登录系统，获取访问令牌用于后续API调用',
        requestBody: JSON.stringify({
          username: "admin",
          password: "password123"
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            token_type: "Bearer",
            expires_in: 7200,
            refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }, null, 2),
        needAuth: 0,
        version: 'v1',
        notes: '登录成功后需要保存access_token用于后续API调用'
      },
      {
        name: '刷新令牌',
        path: '/artemis/api/v1/oauth/refresh',
        method: 'POST',
        summary: '刷新访问令牌',
        description: '使用refresh_token刷新access_token',
        requestBody: JSON.stringify({
          refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            token_type: "Bearer",
            expires_in: 7200
          }
        }, null, 2),
        needAuth: 0,
        version: 'v1'
      }
    ]
  },
  {
    category: {
      name: '事件管理',
      description: '事件订阅、推送等相关API',
      icon: 'BellOutlined',
      orderNum: 4
    },
    apis: [
      {
        name: '订阅事件',
        path: '/artemis/api/event/v1/eventSubscriptionByEventTypes',
        method: 'POST',
        summary: '按事件类型订阅事件',
        description: '根据事件类型订阅相关事件，系统会将事件推送到指定的回调地址',
        requestBody: JSON.stringify({
          eventTypes: [131073, 131074, 131075],
          eventDest: "http://192.168.1.200:8080/callback",
          subscriptionType: 0
        }, null, 2),
        responseExample: JSON.stringify({
          code: "0",
          msg: "success",
          data: {
            subscriptionId: "sub_123456789"
          }
        }, null, 2),
        needAuth: 1,
        version: 'v1',
        notes: '订阅成功后，事件会推送到eventDest指定的地址'
      }
    ]
  }
];

async function seedHkApiData() {
  console.log('开始导入海康API数据...');

  // 清空现有的海康API数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  for (const categoryData of hkApiData) {
    console.log(`创建分类: ${categoryData.category.name}`);
    
    // 创建分类
    const category = await prisma.hkApiCategory.create({
      data: categoryData.category
    });

    // 创建该分类下的API
    for (const apiData of categoryData.apis) {
      console.log(`  创建API: ${apiData.name}`);
      await prisma.hkApi.create({
        data: {
          ...apiData,
          categoryId: category.id
        }
      });
    }
  }

  console.log('✅ 海康API数据导入完成！');
  console.log(`共导入 ${hkApiData.length} 个分类，${hkApiData.reduce((sum, cat) => sum + cat.apis.length, 0)} 个API`);
}

seedHkApiData()
  .catch((e) => {
    console.error('❌ 海康API数据导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });