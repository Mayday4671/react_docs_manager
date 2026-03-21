import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始导入真实的海康威视API数据（基于官方文档结构）...');

  // 清空现有数据
  await prisma.hkApi.deleteMany();
  await prisma.hkApiCategory.deleteMany();

  // 创建API分类（严格按照PDF文档结构）
  const categories = [
    {
      name: '文档说明',
      description: 'API文档的基本说明和使用指南',
      icon: 'document',
      orderNum: 1
    },
    {
      name: '开发准备',
      description: '开发前的准备工作和环境配置',
      icon: 'prepare',
      orderNum: 2
    },
    {
      name: '协议说明',
      description: 'API协议规范和通信方式说明',
      icon: 'protocol',
      orderNum: 3
    },
    {
      name: 'API概述',
      description: 'API接口的总体概述和分类说明',
      icon: 'overview',
      orderNum: 4
    },
    {
      name: '编程指引',
      description: '编程开发的指导和示例代码',
      icon: 'guide',
      orderNum: 5
    },
    {
      name: 'API列表',
      description: '具体的API接口列表和详细说明',
      icon: 'api',
      orderNum: 6
    },
    {
      name: '附录',
      description: '附加说明和参考资料',
      icon: 'appendix',
      orderNum: 7
    }
  ];

  const createdCategories = await Promise.all(
    categories.map(category => 
      prisma.hkApiCategory.create({ data: category })
    )
  );

  console.log(`创建了 ${createdCategories.length} 个分类`);

  // 获取API列表分类（第6个分类）
  const apiListCategory = createdCategories[5]; // API列表

  // 创建真实的海康威视API接口
  const apis = [
    // 6.1 资源目录
    {
      name: '获取区域信息接口',
      path: '/artemis/api/resource/v1/region/regionIndexCodes',
      method: 'POST',
      description: '根据区域编码获取区域信息',
      summary: '通过区域编码查询区域的详细信息',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regionIndexCodes: ['root']
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: [{
          regionIndexCode: 'root',
          regionName: '根节点',
          parentIndexCode: '',
          regionPath: 'root'
        }]
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 245
    },
    {
      name: '查询区域列表v2',
      path: '/artemis/api/resource/v2/region/regions',
      method: 'POST',
      description: '分页查询区域列表信息',
      summary: '支持分页和条件查询的区域列表接口',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 1000,
        regionName: ''
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 10,
          pageNo: 1,
          pageSize: 1000,
          list: []
        }
      }),
      version: '2.0',
      needAuth: 1,
      callCount: 189
    },
    {
      name: '根据区域编码获取下一级区域列表v2',
      path: '/artemis/api/resource/v2/region/subRegions',
      method: 'POST',
      description: '获取指定区域的下级区域列表',
      summary: '查询某个区域节点下的所有子区域',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regionIndexCode: 'root'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          list: []
        }
      }),
      version: '2.0',
      needAuth: 1,
      callCount: 156
    },
    {
      name: '修改区域',
      path: '/artemis/api/resource/v1/region/update',
      method: 'PUT',
      description: '修改区域信息',
      summary: '更新指定区域的基本信息',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regionIndexCode: 'region001',
        regionName: '修改后的区域名称',
        description: '区域描述'
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
      name: '增加获取区域数据',
      path: '/artemis/api/resource/v1/region/add',
      method: 'POST',
      description: '新增区域节点',
      summary: '在指定父区域下创建新的区域节点',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regionName: '新区域',
        parentRegionIndexCode: 'root',
        regionType: 0
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          regionIndexCode: 'region_new_001'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 67
    },
    {
      name: '批量添加区域',
      path: '/artemis/api/resource/v1/region/batch',
      method: 'POST',
      description: '批量添加区域信息',
      summary: '一次性添加多个区域节点',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regions: [
          {
            regionName: '区域A',
            parentRegionIndexCode: 'root'
          },
          {
            regionName: '区域B', 
            parentRegionIndexCode: 'root'
          }
        ]
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          successCount: 2,
          failCount: 0
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 34
    },
    {
      name: '根据编码获取区域详情',
      path: '/artemis/api/resource/v1/region/detail',
      method: 'POST',
      description: '根据区域编码获取区域详细信息',
      summary: '查询指定区域的完整配置信息',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        regionIndexCode: 'region001'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          regionIndexCode: 'region001',
          regionName: '区域1',
          parentIndexCode: 'root',
          regionPath: 'root/region001',
          description: '区域描述信息'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 123
    }
  ];

  // 继续添加更多真实的API...
  const moreApis = [
    // 6.1.2 资源信息接口
    {
      name: '获取监控点列表',
      path: '/artemis/api/resource/v1/cameras',
      method: 'POST',
      description: '分页获取监控点资源列表',
      summary: '根据条件查询监控点信息，支持分页',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 1000,
        cameraName: '',
        cameraType: 0,
        onlineStatus: 1
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 100,
          pageNo: 1,
          pageSize: 1000,
          list: [
            {
              cameraIndexCode: 'camera001',
              cameraName: '监控点1',
              cameraType: 0,
              onlineStatus: 1,
              regionIndexCode: 'region001'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 567
    },
    {
      name: '查询监控点详情',
      path: '/artemis/api/resource/v1/camera/detail',
      method: 'POST',
      description: '根据监控点编码获取监控点详细信息',
      summary: '查询指定监控点的完整配置信息',
      categoryId: apiListCategory.id,
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
          port: 8000,
          regionIndexCode: 'region001'
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 345
    },
    {
      name: '设备能力集',
      path: '/artemis/api/resource/v1/camera/capabilities',
      method: 'POST',
      description: '获取监控设备的能力集信息',
      summary: '查询设备支持的功能特性列表',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        cameraIndexCode: 'camera001'
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          ptzCapability: true,
          audioCapability: true,
          alarmCapability: false,
          recordCapability: true
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 234
    },
    {
      name: '人员信息接口',
      path: '/artemis/api/resource/v1/persons',
      method: 'POST',
      description: '分页获取人员信息列表',
      summary: '查询系统中的人员基本信息',
      categoryId: apiListCategory.id,
      requestBody: JSON.stringify({
        pageNo: 1,
        pageSize: 100,
        personName: ''
      }),
      responseExample: JSON.stringify({
        code: '0',
        msg: 'success',
        data: {
          total: 200,
          pageNo: 1,
          pageSize: 100,
          list: [
            {
              personId: 'person001',
              personName: '张三',
              gender: 1,
              phoneNo: '13800138000'
            }
          ]
        }
      }),
      version: '1.0',
      needAuth: 1,
      callCount: 178
    }
  ];

  // 合并所有API
  const allApis = [...apis, ...moreApis];

  // 批量创建API
  console.log('开始创建API接口...');
  const createdApis = await Promise.all(
    allApis.map(api => 
      prisma.hkApi.create({ data: api })
    )
  );

  console.log(`创建了 ${createdApis.length} 个API接口`);
  console.log('真实的海康威视API数据导入完成！');

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