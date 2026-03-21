import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始导入完整的海康威视API数据（基于真实PDF文档）...');

  // 清空现有数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  // 创建API分类（基于PDF文档结构）
  const categories = [
    {
      name: '资源目录',
      description: '区域信息、设备管理、人员信息等资源管理接口',
      icon: 'resource',
      orderNum: 1
    },
    {
      name: '视频业务',
      description: '视频预览、录像回放、云台控制等视频相关接口',
      icon: 'video',
      orderNum: 2
    },
    {
      name: '融合通信业务服务',
      description: '融合通信服务、GIS调度、会议调度等通信业务接口',
      icon: 'communication',
      orderNum: 3
    },
    {
      name: '事件服务',
      description: '事件订阅、推送、查询等事件管理接口',
      icon: 'event',
      orderNum: 4
    },
    {
      name: '用户管理',
      description: '用户认证、权限管理、登录等用户相关接口',
      icon: 'user',
      orderNum: 5
    },
    {
      name: '系统管理',
      description: '系统配置、状态监控、日志管理等系统接口',
      icon: 'system',
      orderNum: 6
    },
    {
      name: '报警管理',
      description: '报警事件、报警订阅、报警处理等报警相关接口',
      icon: 'alarm',
      orderNum: 7
    },
    {
      name: '门禁管理',
      description: '门禁控制、权限配置、通行记录等门禁相关接口',
      icon: 'door',
      orderNum: 8
    }
  ];

  const createdCategories = await Promise.all(
    categories.map(category => 
      prisma.hkApiCategory.create({ data: category })
    )
  );

  console.log(`创建了 ${createdCategories.length} 个分类`);

  // 创建大量API接口数据（基于PDF文档内容）
  const apis = [
    // 6.1 资源目录 - 区域信息接口
    {
      name: '获取区域信息',
      path: '/artemis/api/resource/v1/region/info',
      method: 'POST',
      description: '获取指定区域的详细信息',
      summary: '根据区域编码查询区域基本信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ regionIndexCode: 'region001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { regionName: '区域1', parentRegion: 'root' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 145
    },
    {
      name: '查询区域列表v2',
      path: '/artemis/api/resource/v2/regions',
      method: 'POST',
      description: '分页查询区域列表信息（v2版本）',
      summary: '支持更多查询条件的区域列表接口',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ pageNo: 1, pageSize: 100, regionName: '' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 50, list: [] } }),
      version: '2.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '根据区域编码获取下一级区域列表v2',
      path: '/artemis/api/resource/v2/region/subRegions',
      method: 'POST',
      description: '获取指定区域下的子区域列表',
      summary: '查询区域的下级区域信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ parentRegionCode: 'region001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { list: [] } }),
      version: '2.0',
      needAuth: 1,
      callCount: 189
    },
    {
      name: '修改区域',
      path: '/artemis/api/resource/v1/region/update',
      method: 'PUT',
      description: '修改区域信息',
      summary: '更新指定区域的基本信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ regionIndexCode: 'region001', regionName: '新区域名称' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 67
    },
    {
      name: '增加获取区域数据',
      path: '/artemis/api/resource/v1/region/add',
      method: 'POST',
      description: '新增区域信息',
      summary: '创建新的区域节点',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ regionName: '新区域', parentRegionCode: 'region001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { regionIndexCode: 'region002' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '批量添加区域',
      path: '/artemis/api/resource/v1/region/batchAdd',
      method: 'POST',
      description: '批量添加区域信息',
      summary: '一次性添加多个区域节点',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ regions: [{ regionName: '区域A' }, { regionName: '区域B' }] }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { successCount: 2, failCount: 0 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 34
    },
    {
      name: '根据编码获取区域详情',
      path: '/artemis/api/resource/v1/region/detail',
      method: 'POST',
      description: '根据区域编码获取详细信息',
      summary: '查询区域的完整配置信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ regionIndexCode: 'region001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { regionName: '区域1', description: '区域描述' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 156
    },

    // 6.1.2 资源信息接口
    {
      name: '获取监控点列表',
      path: '/artemis/api/resource/v1/cameras',
      method: 'POST',
      description: '分页获取监控点资源列表',
      summary: '根据条件查询监控点信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ pageNo: 1, pageSize: 1000, cameraName: '' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 100, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 567
    },
    {
      name: '获取设备能力集',
      path: '/artemis/api/resource/v1/camera/capabilities',
      method: 'POST',
      description: '获取监控设备的能力集信息',
      summary: '查询设备支持的功能特性',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { ptz: true, audio: true, alarm: false } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },

    // 6.1.4 人员信息接口
    {
      name: '获取人员列表',
      path: '/artemis/api/resource/v1/persons',
      method: 'POST',
      description: '分页获取人员信息列表',
      summary: '查询系统中的人员基本信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ pageNo: 1, pageSize: 100, personName: '' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 200, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '新增人员信息',
      path: '/artemis/api/resource/v1/person/add',
      method: 'POST',
      description: '新增人员基本信息',
      summary: '添加新的人员档案',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ personName: '张三', gender: 1, phoneNo: '13800138000' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { personId: 'person001' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    },
    {
      name: '修改人员信息',
      path: '/artemis/api/resource/v1/person/update',
      method: 'PUT',
      description: '修改人员基本信息',
      summary: '更新已有人员的档案信息',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ personId: 'person001', personName: '李四' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '删除人员信息',
      path: '/artemis/api/resource/v1/person/delete',
      method: 'DELETE',
      description: '删除指定人员信息',
      summary: '从系统中移除人员档案',
      categoryId: createdCategories[0].id,
      requestBody: JSON.stringify({ personId: 'person001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 45
    },

    // 6.2 视频业务接口
    {
      name: '获取预览取流URL',
      path: '/artemis/api/video/v1/cameras/previewURLs',
      method: 'POST',
      description: '获取监控点实时预览流地址',
      summary: '获取指定监控点的实时视频流URL',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', streamType: 0, protocol: 'rtsp' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { url: 'rtsp://192.168.1.100:554/stream1' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 789
    },
    {
      name: '开始云台控制',
      path: '/artemis/api/video/v1/cameras/ptz/start',
      method: 'POST',
      description: '开始云台控制操作',
      summary: '启动摄像头云台的转动控制',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', ptzCmd: 'LEFT', speed: 5 }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 456
    },
    {
      name: '停止云台控制',
      path: '/artemis/api/video/v1/cameras/ptz/stop',
      method: 'POST',
      description: '停止云台控制操作',
      summary: '停止摄像头云台的转动控制',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 423
    },
    {
      name: '录像查询',
      path: '/artemis/api/video/v1/cameras/records',
      method: 'POST',
      description: '查询监控点录像文件列表',
      summary: '根据时间范围查询录像记录',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 10, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 678
    },
    {
      name: '录像回放URL',
      path: '/artemis/api/video/v1/cameras/playbackURLs',
      method: 'POST',
      description: '获取录像回放流地址',
      summary: '获取指定时间段录像的回放流URL',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', startTime: '2024-01-01T08:00:00', endTime: '2024-01-01T09:00:00' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { url: 'rtsp://192.168.1.100:554/playback' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '录像下载URL',
      path: '/artemis/api/video/v1/cameras/downloadURLs',
      method: 'POST',
      description: '获取录像下载地址',
      summary: '获取录像文件的下载链接',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', fileName: 'record001.mp4' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { downloadUrl: 'http://server.com/download/record001.mp4' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '语音对讲',
      path: '/artemis/api/video/v1/cameras/talkback',
      method: 'POST',
      description: '启动语音对讲功能',
      summary: '与监控点进行语音对讲',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCode: 'camera001', action: 'start' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { talkbackUrl: 'rtsp://server.com/talkback' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    },
    {
      name: '语音广播',
      path: '/artemis/api/video/v1/cameras/broadcast',
      method: 'POST',
      description: '启动语音广播功能',
      summary: '向监控点进行语音广播',
      categoryId: createdCategories[1].id,
      requestBody: JSON.stringify({ cameraIndexCodes: ['camera001', 'camera002'], audioFile: 'broadcast.wav' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },

    // 6.3 融合通信业务服务
    {
      name: '融合通信服务状态',
      path: '/artemis/api/communication/v1/status',
      method: 'GET',
      description: '获取融合通信服务状态',
      summary: '查询通信服务的运行状态',
      categoryId: createdCategories[2].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { status: 'running', connections: 150 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: 'GIS调度应用接口',
      path: '/artemis/api/gis/v1/dispatch',
      method: 'POST',
      description: 'GIS地图调度功能接口',
      summary: '基于GIS地图的资源调度管理',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ mapLevel: 1, centerPoint: { lat: 39.9042, lng: 116.4074 } }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { resources: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 167
    },
    {
      name: '会议预约',
      path: '/artemis/api/meeting/v1/schedule',
      method: 'POST',
      description: '预约会议室和会议时间',
      summary: '创建会议预约记录',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ meetingName: '项目讨论会', startTime: '2024-01-01T14:00:00', duration: 120 }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { meetingId: 'meeting001' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 145
    },
    {
      name: '分页查询预案组信息',
      path: '/artemis/api/plan/v1/groups',
      method: 'POST',
      description: '分页查询应急预案组信息',
      summary: '获取系统中的应急预案组列表',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ pageNo: 1, pageSize: 100, groupName: '' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 20, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 89
    },
    {
      name: '会议预案组招募信息',
      path: '/artemis/api/meeting/v1/recruit',
      method: 'POST',
      description: '发布会议预案组招募信息',
      summary: '招募会议参与人员',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ meetingId: 'meeting001', recruitType: 1, targetUsers: [] }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 67
    },
    {
      name: '用户免登录',
      path: '/artemis/api/user/v1/autoLogin',
      method: 'POST',
      description: '用户免登录接口',
      summary: '通过token实现用户免登录',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ token: 'auto_login_token_123' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { userId: 'user001' } }),
      version: '1.0',
      needAuth: 0,
      callCount: 234
    },
    {
      name: '获取免登录地址',
      path: '/artemis/api/user/v1/autoLoginUrl',
      method: 'POST',
      description: '获取用户免登录访问地址',
      summary: '生成带token的免登录URL',
      categoryId: createdCategories[2].id,
      requestBody: JSON.stringify({ userId: 'user001', targetUrl: '/dashboard' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { autoLoginUrl: 'http://server.com/auto?token=xxx' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 156
    },

    // 6.4 事件服务接口
    {
      name: '事件订阅',
      path: '/artemis/api/event/v1/subscribe',
      method: 'POST',
      description: '订阅系统事件推送',
      summary: '配置各类事件的实时推送',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({ callbackUrl: 'http://your-server.com/callback', eventTypes: ['ALARM', 'DEVICE_STATUS'] }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { subscriptionId: 'sub001' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '事件查询',
      path: '/artemis/api/event/v1/events',
      method: 'POST',
      description: '分页查询历史事件记录',
      summary: '根据条件查询系统事件日志',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({ startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59', eventTypes: [] }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 100, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 567
    },
    {
      name: '取消事件订阅',
      path: '/artemis/api/event/v1/unsubscribe',
      method: 'POST',
      description: '取消事件订阅',
      summary: '停止指定的事件推送订阅',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({ subscriptionId: 'sub001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    },
    {
      name: '事件统计',
      path: '/artemis/api/event/v1/statistics',
      method: 'POST',
      description: '获取事件统计信息',
      summary: '统计指定时间段内的事件数量',
      categoryId: createdCategories[3].id,
      requestBody: JSON.stringify({ startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { totalEvents: 500, alarmEvents: 50 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },

    // 用户管理接口
    {
      name: '用户登录',
      path: '/artemis/api/system/v1/login',
      method: 'POST',
      description: '用户登录认证接口',
      summary: '通过用户名密码进行身份认证',
      categoryId: createdCategories[4].id,
      requestBody: JSON.stringify({ username: 'admin', password: 'password123' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { token: 'jwt_token_here', expireTime: 7200 } }),
      version: '1.0',
      needAuth: 0,
      callCount: 1234
    },
    {
      name: '用户登出',
      path: '/artemis/api/system/v1/logout',
      method: 'POST',
      description: '用户登出接口',
      summary: '用户主动登出系统',
      categoryId: createdCategories[4].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 567
    },
    {
      name: '获取用户信息',
      path: '/artemis/api/system/v1/user/info',
      method: 'GET',
      description: '获取当前登录用户信息',
      summary: '查询用户基本信息和权限',
      categoryId: createdCategories[4].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { userId: 'user001', username: 'admin' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 890
    },
    {
      name: '修改用户密码',
      path: '/artemis/api/system/v1/user/password',
      method: 'PUT',
      description: '修改用户登录密码',
      summary: '用户修改自己的登录密码',
      categoryId: createdCategories[4].id,
      requestBody: JSON.stringify({ oldPassword: 'old123', newPassword: 'new456' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '获取用户权限',
      path: '/artemis/api/system/v1/user/permissions',
      method: 'GET',
      description: '获取用户权限列表',
      summary: '查询当前用户的功能权限',
      categoryId: createdCategories[4].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { permissions: ['camera:view', 'alarm:handle'] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 456
    },

    // 系统管理接口
    {
      name: '系统状态查询',
      path: '/artemis/api/system/v1/status',
      method: 'GET',
      description: '获取系统运行状态',
      summary: '查询系统各模块运行状态',
      categoryId: createdCategories[5].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { status: 'running', uptime: 86400 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 678
    },
    {
      name: '系统配置查询',
      path: '/artemis/api/system/v1/config',
      method: 'GET',
      description: '获取系统配置信息',
      summary: '查询系统的配置参数',
      categoryId: createdCategories[5].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { maxUsers: 1000, maxCameras: 10000 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '系统日志查询',
      path: '/artemis/api/system/v1/logs',
      method: 'POST',
      description: '分页查询系统日志',
      summary: '根据条件查询系统操作日志',
      categoryId: createdCategories[5].id,
      requestBody: JSON.stringify({ startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59', logLevel: 'INFO' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 1000, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 567
    },
    {
      name: '系统性能监控',
      path: '/artemis/api/system/v1/performance',
      method: 'GET',
      description: '获取系统性能指标',
      summary: '查询CPU、内存、磁盘等性能数据',
      categoryId: createdCategories[5].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { cpu: 45.6, memory: 67.8, disk: 34.2 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 789
    },

    // 报警管理接口
    {
      name: '报警事件查询',
      path: '/artemis/api/alarm/v1/alarms',
      method: 'POST',
      description: '分页查询报警事件',
      summary: '根据条件查询历史报警事件',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({ startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59', alarmType: 1 }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 100, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 456
    },
    {
      name: '报警订阅',
      path: '/artemis/api/alarm/v1/subscribe',
      method: 'POST',
      description: '订阅报警事件推送',
      summary: '配置报警事件的实时推送',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({ callbackUrl: 'http://server.com/alarm', alarmTypes: [1, 2, 3] }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { subscriptionId: 'alarm_sub001' } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '报警处理',
      path: '/artemis/api/alarm/v1/handle',
      method: 'POST',
      description: '处理报警事件',
      summary: '确认或忽略报警事件',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({ alarmId: 'alarm001', handleType: 1, remark: '已处理' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '报警统计',
      path: '/artemis/api/alarm/v1/statistics',
      method: 'POST',
      description: '获取报警统计信息',
      summary: '统计指定时间段的报警数据',
      categoryId: createdCategories[6].id,
      requestBody: JSON.stringify({ startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { totalAlarms: 200, handledAlarms: 180 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    },

    // 门禁管理接口
    {
      name: '门禁设备列表',
      path: '/artemis/api/acs/v1/doors',
      method: 'POST',
      description: '获取门禁设备列表',
      summary: '查询门禁控制器和门点信息',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({ pageNo: 1, pageSize: 100 }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 50, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '远程开门',
      path: '/artemis/api/acs/v1/door/open',
      method: 'POST',
      description: '远程控制门禁开门',
      summary: '通过接口远程开启指定门禁',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({ doorIndexCode: 'door001' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 456
    },
    {
      name: '门禁通行记录',
      path: '/artemis/api/acs/v1/records',
      method: 'POST',
      description: '查询门禁通行记录',
      summary: '根据条件查询门禁刷卡记录',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({ doorIndexCode: 'door001', startTime: '2024-01-01T00:00:00', endTime: '2024-01-01T23:59:59' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { total: 500, list: [] } }),
      version: '1.0',
      needAuth: 1,
      callCount: 678
    },
    {
      name: '门禁权限配置',
      path: '/artemis/api/acs/v1/permission',
      method: 'POST',
      description: '配置门禁通行权限',
      summary: '设置人员的门禁通行权限',
      categoryId: createdCategories[7].id,
      requestBody: JSON.stringify({ personId: 'person001', doorCodes: ['door001', 'door002'], validTime: '2024-12-31T23:59:59' }),
      responseExample: JSON.stringify({ code: '0', msg: 'success' }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '门禁状态监控',
      path: '/artemis/api/acs/v1/status',
      method: 'GET',
      description: '获取门禁设备状态',
      summary: '查询门禁设备的在线状态',
      categoryId: createdCategories[7].id,
      responseExample: JSON.stringify({ code: '0', msg: 'success', data: { totalDoors: 50, onlineDoors: 48, offlineDoors: 2 } }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    }
  ];

  // 批量创建API
  console.log('开始创建API接口...');
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