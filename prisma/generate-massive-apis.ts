import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 生成大量API数据的工具函数
function generateMassiveApiData() {
  const categories = [
    {
      name: '资源目录',
      description: '区域信息、设备管理、人员信息等资源管理接口',
      icon: 'resource',
      orderNum: 1,
      apiCount: 80 // 预计API数量
    },
    {
      name: '视频业务',
      description: '视频预览、录像回放、云台控制等视频相关接口',
      icon: 'video',
      orderNum: 2,
      apiCount: 60
    },
    {
      name: '融合通信业务服务',
      description: '融合通信服务、GIS调度、会议调度等通信业务接口',
      icon: 'communication',
      orderNum: 3,
      apiCount: 50
    },
    {
      name: '事件服务',
      description: '事件订阅、推送、查询等事件管理接口',
      icon: 'event',
      orderNum: 4,
      apiCount: 30
    },
    {
      name: '报警管理',
      description: '报警事件、报警订阅、报警处理等报警相关接口',
      icon: 'alarm',
      orderNum: 5,
      apiCount: 40
    },
    {
      name: '门禁管理',
      description: '门禁控制、权限配置、通行记录等门禁相关接口',
      icon: 'door',
      orderNum: 6,
      apiCount: 35
    },
    {
      name: '用户管理',
      description: '用户认证、权限管理、登录等用户相关接口',
      icon: 'user',
      orderNum: 7,
      apiCount: 25
    },
    {
      name: '系统管理',
      description: '系统配置、状态监控、日志管理等系统接口',
      icon: 'system',
      orderNum: 8,
      apiCount: 30
    },
    {
      name: '设备管理',
      description: '设备注册、配置、状态查询等设备管理接口',
      icon: 'device',
      orderNum: 9,
      apiCount: 45
    },
    {
      name: '数据统计',
      description: '各类业务数据统计分析接口',
      icon: 'chart',
      orderNum: 10,
      apiCount: 20
    }
  ];

  return categories;
}

async function main() {
  console.log('开始生成大规模海康威视API数据...');
  
  // 清空现有数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  const categoryTemplates = generateMassiveApiData();
  
  // 创建分类
  const createdCategories = await Promise.all(
    categoryTemplates.map(cat => 
      prisma.hkApiCategory.create({ 
        data: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          orderNum: cat.orderNum
        }
      })
    )
  );

  console.log(`创建了 ${createdCategories.length} 个分类`);

  let totalApis = 0;
  
  // 为每个分类生成大量API
  for (let i = 0; i < createdCategories.length; i++) {
    const category = createdCategories[i];
    const template = categoryTemplates[i];
    
    console.log(`正在为分类 "${category.name}" 生成 ${template.apiCount} 个API...`);
    
    const apis = generateApisForCategory(category, template.apiCount);
    
    // 批量创建API
    await Promise.all(
      apis.map(api => prisma.hkApi.create({ data: api }))
    );
    
    totalApis += apis.length;
    console.log(`分类 "${category.name}" 完成，生成了 ${apis.length} 个API`);
  }

  console.log(`\n总共生成了 ${totalApis} 个API接口！`);
  
  // 输出最终统计
  const finalStats = await Promise.all([
    prisma.hkApiCategory.count(),
    prisma.hkApi.count(),
    prisma.hkApi.aggregate({ _sum: { callCount: true } })
  ]);

  console.log('\n=== 最终统计 ===');
  console.log(`API分类数量: ${finalStats[0]}`);
  console.log(`API接口数量: ${finalStats[1]}`);
  console.log(`总调用次数: ${finalStats[2]._sum.callCount || 0}`);
}

// 为指定分类生成API数据
function generateApisForCategory(category: any, count: number) {
  const apis = [];
  
  for (let i = 1; i <= count; i++) {
    const api = generateSingleApi(category, i);
    apis.push(api);
  }
  
  return apis;
}

// 生成单个API数据
function generateSingleApi(category: any, index: number) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  
  // 根据分类生成不同的API名称和路径
  const apiData = generateApiByCategory(category.name, index, method);
  
  return {
    name: apiData.name,
    path: apiData.path,
    method: method,
    description: apiData.description,
    summary: apiData.summary,
    categoryId: category.id,
    requestHeaders: method !== 'GET' ? JSON.stringify({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {token}'
    }) : null,
    requestParams: apiData.hasParams ? JSON.stringify({
      pageNo: 1,
      pageSize: 100
    }) : null,
    requestBody: method !== 'GET' ? JSON.stringify(apiData.requestBody) : null,
    responseExample: JSON.stringify(apiData.responseExample),
    responseSchema: JSON.stringify(apiData.responseSchema),
    version: Math.random() > 0.7 ? '2.0' : '1.0',
    deprecated: Math.random() > 0.95 ? 1 : 0,
    needAuth: Math.random() > 0.1 ? 1 : 0,
    rateLimit: Math.random() > 0.8 ? '100/min' : null,
    notes: Math.random() > 0.7 ? `${apiData.name}的详细说明和注意事项` : null,
    callCount: Math.floor(Math.random() * 1000) + 10,
    lastCall: Math.random() > 0.5 ? new Date() : null,
    status: Math.random() > 0.05 ? 1 : 0
  };
}

main()
  .catch((e) => {
    console.error('生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// 根据分类生成具体的API数据
function generateApiByCategory(categoryName: string, index: number, method: string) {
  switch (categoryName) {
    case '资源目录':
      return generateResourceApis(index, method);
    case '视频业务':
      return generateVideoApis(index, method);
    case '融合通信业务服务':
      return generateCommunicationApis(index, method);
    case '事件服务':
      return generateEventApis(index, method);
    case '报警管理':
      return generateAlarmApis(index, method);
    case '门禁管理':
      return generateAccessApis(index, method);
    case '用户管理':
      return generateUserApis(index, method);
    case '系统管理':
      return generateSystemApis(index, method);
    case '设备管理':
      return generateDeviceApis(index, method);
    case '数据统计':
      return generateStatisticsApis(index, method);
    default:
      return generateDefaultApi(index, method);
  }
}

// 资源目录API生成器
function generateResourceApis(index: number, method: string) {
  const resourceApis = [
    { name: '获取区域信息', path: '/artemis/api/resource/v1/region/info', desc: '获取指定区域的详细信息' },
    { name: '查询区域列表', path: '/artemis/api/resource/v1/regions', desc: '分页查询区域列表信息' },
    { name: '新增区域', path: '/artemis/api/resource/v1/region/add', desc: '新增区域信息' },
    { name: '修改区域', path: '/artemis/api/resource/v1/region/update', desc: '修改区域信息' },
    { name: '删除区域', path: '/artemis/api/resource/v1/region/delete', desc: '删除指定区域' },
    { name: '获取监控点列表', path: '/artemis/api/resource/v1/cameras', desc: '分页获取监控点资源列表' },
    { name: '获取监控点详情', path: '/artemis/api/resource/v1/camera/detail', desc: '获取监控点详细信息' },
    { name: '新增监控点', path: '/artemis/api/resource/v1/camera/add', desc: '新增监控点信息' },
    { name: '修改监控点', path: '/artemis/api/resource/v1/camera/update', desc: '修改监控点信息' },
    { name: '删除监控点', path: '/artemis/api/resource/v1/camera/delete', desc: '删除指定监控点' },
    { name: '获取设备能力集', path: '/artemis/api/resource/v1/camera/capabilities', desc: '获取监控设备的能力集信息' },
    { name: '获取人员列表', path: '/artemis/api/resource/v1/persons', desc: '分页获取人员信息列表' },
    { name: '新增人员信息', path: '/artemis/api/resource/v1/person/add', desc: '新增人员基本信息' },
    { name: '修改人员信息', path: '/artemis/api/resource/v1/person/update', desc: '修改人员基本信息' },
    { name: '删除人员信息', path: '/artemis/api/resource/v1/person/delete', desc: '删除指定人员信息' },
    { name: '获取组织架构', path: '/artemis/api/resource/v1/organizations', desc: '获取组织架构树形结构' },
    { name: '新增组织节点', path: '/artemis/api/resource/v1/organization/add', desc: '新增组织架构节点' },
    { name: '修改组织信息', path: '/artemis/api/resource/v1/organization/update', desc: '修改组织架构信息' },
    { name: '删除组织节点', path: '/artemis/api/resource/v1/organization/delete', desc: '删除组织架构节点' },
    { name: '获取资源统计', path: '/artemis/api/resource/v1/statistics', desc: '获取各类资源统计信息' }
  ];
  
  const template = resourceApis[index % resourceApis.length];
  return {
    name: `${template.name}_${Math.floor(index / resourceApis.length) + 1}`,
    path: `${template.path}${index > resourceApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: method === 'GET' || method === 'POST',
    requestBody: { id: `resource_${index}`, name: `资源${index}` },
    responseExample: { code: '0', msg: 'success', data: { id: index, name: `资源${index}` } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

// 视频业务API生成器
function generateVideoApis(index: number, method: string) {
  const videoApis = [
    { name: '获取预览流地址', path: '/artemis/api/video/v1/cameras/previewURLs', desc: '获取监控点实时预览流地址' },
    { name: '开始云台控制', path: '/artemis/api/video/v1/cameras/ptz/start', desc: '开始云台控制操作' },
    { name: '停止云台控制', path: '/artemis/api/video/v1/cameras/ptz/stop', desc: '停止云台控制操作' },
    { name: '录像查询', path: '/artemis/api/video/v1/cameras/records', desc: '查询监控点录像文件列表' },
    { name: '录像回放', path: '/artemis/api/video/v1/cameras/playback', desc: '获取录像回放流地址' },
    { name: '录像下载', path: '/artemis/api/video/v1/cameras/download', desc: '获取录像下载地址' },
    { name: '语音对讲', path: '/artemis/api/video/v1/cameras/talkback', desc: '启动语音对讲功能' },
    { name: '语音广播', path: '/artemis/api/video/v1/cameras/broadcast', desc: '启动语音广播功能' },
    { name: '抓拍图片', path: '/artemis/api/video/v1/cameras/capture', desc: '抓拍监控点图片' },
    { name: '设置预置位', path: '/artemis/api/video/v1/cameras/ptz/preset/set', desc: '设置云台预置位' },
    { name: '调用预置位', path: '/artemis/api/video/v1/cameras/ptz/preset/goto', desc: '调用云台预置位' },
    { name: '删除预置位', path: '/artemis/api/video/v1/cameras/ptz/preset/delete', desc: '删除云台预置位' }
  ];
  
  const template = videoApis[index % videoApis.length];
  return {
    name: `${template.name}_${Math.floor(index / videoApis.length) + 1}`,
    path: `${template.path}${index > videoApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { cameraIndexCode: `camera_${index}`, action: 'start' },
    responseExample: { code: '0', msg: 'success', data: { url: `rtsp://server.com/stream${index}` } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

// 融合通信业务API生成器
function generateCommunicationApis(index: number, method: string) {
  const commApis = [
    { name: '融合通信服务状态', path: '/artemis/api/communication/v1/status', desc: '获取融合通信服务状态' },
    { name: 'GIS调度应用', path: '/artemis/api/gis/v1/dispatch', desc: 'GIS地图调度功能接口' },
    { name: '会议预约', path: '/artemis/api/meeting/v1/schedule', desc: '预约会议室和会议时间' },
    { name: '会议管理', path: '/artemis/api/meeting/v1/manage', desc: '管理会议信息' },
    { name: '预案组查询', path: '/artemis/api/plan/v1/groups', desc: '分页查询应急预案组信息' },
    { name: '预案执行', path: '/artemis/api/plan/v1/execute', desc: '执行应急预案' },
    { name: '用户免登录', path: '/artemis/api/user/v1/autoLogin', desc: '用户免登录接口' },
    { name: '获取免登录地址', path: '/artemis/api/user/v1/autoLoginUrl', desc: '获取用户免登录访问地址' },
    { name: '通信录管理', path: '/artemis/api/communication/v1/contacts', desc: '管理通信录信息' },
    { name: '消息推送', path: '/artemis/api/communication/v1/push', desc: '推送消息到指定用户' }
  ];
  
  const template = commApis[index % commApis.length];
  return {
    name: `${template.name}_${Math.floor(index / commApis.length) + 1}`,
    path: `${template.path}${index > commApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { serviceId: `service_${index}`, action: 'query' },
    responseExample: { code: '0', msg: 'success', data: { status: 'active', id: index } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

// 事件服务API生成器
function generateEventApis(index: number, method: string) {
  const eventApis = [
    { name: '事件订阅', path: '/artemis/api/event/v1/subscribe', desc: '订阅系统事件推送' },
    { name: '事件查询', path: '/artemis/api/event/v1/events', desc: '分页查询历史事件记录' },
    { name: '取消事件订阅', path: '/artemis/api/event/v1/unsubscribe', desc: '取消事件订阅' },
    { name: '事件统计', path: '/artemis/api/event/v1/statistics', desc: '获取事件统计信息' },
    { name: '事件推送配置', path: '/artemis/api/event/v1/config', desc: '配置事件推送参数' },
    { name: '事件类型管理', path: '/artemis/api/event/v1/types', desc: '管理事件类型定义' },
    { name: '事件处理', path: '/artemis/api/event/v1/handle', desc: '处理指定事件' },
    { name: '事件回调', path: '/artemis/api/event/v1/callback', desc: '事件回调接口' }
  ];
  
  const template = eventApis[index % eventApis.length];
  return {
    name: `${template.name}_${Math.floor(index / eventApis.length) + 1}`,
    path: `${template.path}${index > eventApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { eventType: `event_type_${index}`, callbackUrl: `http://callback.com/${index}` },
    responseExample: { code: '0', msg: 'success', data: { subscriptionId: `sub_${index}` } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

// 其他分类的API生成器...
function generateAlarmApis(index: number, method: string) {
  const alarmApis = [
    { name: '报警事件查询', path: '/artemis/api/alarm/v1/alarms', desc: '分页查询报警事件' },
    { name: '报警订阅', path: '/artemis/api/alarm/v1/subscribe', desc: '订阅报警事件推送' },
    { name: '报警处理', path: '/artemis/api/alarm/v1/handle', desc: '处理报警事件' },
    { name: '报警统计', path: '/artemis/api/alarm/v1/statistics', desc: '获取报警统计信息' },
    { name: '报警配置', path: '/artemis/api/alarm/v1/config', desc: '配置报警参数' },
    { name: '报警规则', path: '/artemis/api/alarm/v1/rules', desc: '管理报警规则' }
  ];
  
  const template = alarmApis[index % alarmApis.length];
  return {
    name: `${template.name}_${Math.floor(index / alarmApis.length) + 1}`,
    path: `${template.path}${index > alarmApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { alarmType: index, level: 'high' },
    responseExample: { code: '0', msg: 'success', data: { alarmId: `alarm_${index}` } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateAccessApis(index: number, method: string) {
  const accessApis = [
    { name: '门禁设备列表', path: '/artemis/api/acs/v1/doors', desc: '获取门禁设备列表' },
    { name: '远程开门', path: '/artemis/api/acs/v1/door/open', desc: '远程控制门禁开门' },
    { name: '门禁通行记录', path: '/artemis/api/acs/v1/records', desc: '查询门禁通行记录' },
    { name: '门禁权限配置', path: '/artemis/api/acs/v1/permission', desc: '配置门禁通行权限' },
    { name: '门禁状态监控', path: '/artemis/api/acs/v1/status', desc: '获取门禁设备状态' }
  ];
  
  const template = accessApis[index % accessApis.length];
  return {
    name: `${template.name}_${Math.floor(index / accessApis.length) + 1}`,
    path: `${template.path}${index > accessApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { doorId: `door_${index}`, action: 'open' },
    responseExample: { code: '0', msg: 'success', data: { doorId: `door_${index}`, status: 'opened' } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateUserApis(index: number, method: string) {
  const userApis = [
    { name: '用户登录', path: '/artemis/api/system/v1/login', desc: '用户登录认证接口' },
    { name: '用户登出', path: '/artemis/api/system/v1/logout', desc: '用户登出接口' },
    { name: '获取用户信息', path: '/artemis/api/system/v1/user/info', desc: '获取当前登录用户信息' },
    { name: '修改用户密码', path: '/artemis/api/system/v1/user/password', desc: '修改用户登录密码' },
    { name: '获取用户权限', path: '/artemis/api/system/v1/user/permissions', desc: '获取用户权限列表' }
  ];
  
  const template = userApis[index % userApis.length];
  return {
    name: `${template.name}_${Math.floor(index / userApis.length) + 1}`,
    path: `${template.path}${index > userApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: method !== 'GET',
    requestBody: { username: `user_${index}`, password: 'password123' },
    responseExample: { code: '0', msg: 'success', data: { token: `token_${index}`, userId: index } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateSystemApis(index: number, method: string) {
  const systemApis = [
    { name: '系统状态查询', path: '/artemis/api/system/v1/status', desc: '获取系统运行状态' },
    { name: '系统配置查询', path: '/artemis/api/system/v1/config', desc: '获取系统配置信息' },
    { name: '系统日志查询', path: '/artemis/api/system/v1/logs', desc: '分页查询系统日志' },
    { name: '系统性能监控', path: '/artemis/api/system/v1/performance', desc: '获取系统性能指标' }
  ];
  
  const template = systemApis[index % systemApis.length];
  return {
    name: `${template.name}_${Math.floor(index / systemApis.length) + 1}`,
    path: `${template.path}${index > systemApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { systemId: `system_${index}` },
    responseExample: { code: '0', msg: 'success', data: { status: 'running', uptime: index * 1000 } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateDeviceApis(index: number, method: string) {
  const deviceApis = [
    { name: '设备注册', path: '/artemis/api/device/v1/register', desc: '注册新设备到系统' },
    { name: '设备配置', path: '/artemis/api/device/v1/config', desc: '配置设备参数' },
    { name: '设备状态查询', path: '/artemis/api/device/v1/status', desc: '查询设备状态' },
    { name: '设备重启', path: '/artemis/api/device/v1/reboot', desc: '远程重启设备' },
    { name: '设备升级', path: '/artemis/api/device/v1/upgrade', desc: '设备固件升级' }
  ];
  
  const template = deviceApis[index % deviceApis.length];
  return {
    name: `${template.name}_${Math.floor(index / deviceApis.length) + 1}`,
    path: `${template.path}${index > deviceApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { deviceId: `device_${index}`, action: 'register' },
    responseExample: { code: '0', msg: 'success', data: { deviceId: `device_${index}`, status: 'online' } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateStatisticsApis(index: number, method: string) {
  const statsApis = [
    { name: '设备统计', path: '/artemis/api/statistics/v1/devices', desc: '获取设备统计数据' },
    { name: '用户统计', path: '/artemis/api/statistics/v1/users', desc: '获取用户统计数据' },
    { name: '报警统计', path: '/artemis/api/statistics/v1/alarms', desc: '获取报警统计数据' },
    { name: '视频统计', path: '/artemis/api/statistics/v1/videos', desc: '获取视频统计数据' }
  ];
  
  const template = statsApis[index % statsApis.length];
  return {
    name: `${template.name}_${Math.floor(index / statsApis.length) + 1}`,
    path: `${template.path}${index > statsApis.length ? `/${index}` : ''}`,
    description: template.desc,
    summary: `${template.desc}的详细接口`,
    hasParams: true,
    requestBody: { timeRange: '7d', type: 'summary' },
    responseExample: { code: '0', msg: 'success', data: { total: index * 10, online: index * 8 } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}

function generateDefaultApi(index: number, method: string) {
  return {
    name: `通用接口_${index}`,
    path: `/artemis/api/common/v1/operation/${index}`,
    description: `通用业务接口${index}`,
    summary: `通用业务接口${index}的详细说明`,
    hasParams: true,
    requestBody: { id: index, action: 'query' },
    responseExample: { code: '0', msg: 'success', data: { id: index } },
    responseSchema: { type: 'object', properties: { code: { type: 'string' }, msg: { type: 'string' }, data: { type: 'object' } } }
  };
}