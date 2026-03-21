import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface ArtemisGroup {
  groupId: string;
  groupName: string;
  description: string;
  parentId: number;
  weight: number;
  status: string;
}

interface ArtemisApi {
  apiName: string;
  description: string;
  apiGroupInfo: {
    groupId: string;
  };
  protocol: string;
  path: string;
  httpMethod: string;
  inParms?: any[];
  response?: any;
  minVersion?: string;
  maxVersion?: string;
  status: string;
}

interface ArtemisData {
  version: string;
  group: ArtemisGroup[];
  api: ArtemisApi[];
}

async function main() {
  console.log('开始导入海康威视Artemis API数据...');

  // 读取YAML文件
  const yamlPath = path.join(__dirname, '../doc/hk/artemis-api.yaml');
  const fileContents = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(fileContents) as ArtemisData;

  console.log(`YAML版本: ${data.version}`);
  console.log(`分组数量: ${data.group.length}`);
  console.log(`API数量: ${data.api.length}`);

  // 清空现有数据
  console.log('\n清空现有数据...');
  await prisma.hkApi.deleteMany({});
  await prisma.hkApiCategory.deleteMany({});
  console.log('现有数据已清空');

  // 创建分组映射
  const groupMap = new Map<string, number>();
  const artemisIdToDbId = new Map<string, number>();

  // 先创建所有分类（包括父子关系）
  console.log('\n创建API分类（支持树形结构）...');
  
  // 按照parentId排序，确保父分类先创建
  const sortedGroups = [...data.group].sort((a, b) => {
    if (a.parentId === 0) return -1;
    if (b.parentId === 0) return 1;
    return a.parentId - b.parentId;
  });

  for (const group of sortedGroups) {
    // 查找父分类的数据库ID
    let parentDbId = null;
    if (group.parentId !== 0) {
      parentDbId = artemisIdToDbId.get(group.parentId.toString());
    }

    const category = await prisma.hkApiCategory.create({
      data: {
        name: group.groupName,
        description: group.description || '',
        icon: 'FolderOutlined',
        parentId: parentDbId,
        orderNum: group.weight,
      },
    });
    
    artemisIdToDbId.set(group.groupId.toString(), category.id);
    groupMap.set(group.groupId.toString(), category.id);
  }

  console.log(`已创建 ${groupMap.size} 个分类（包含${sortedGroups.filter(g => g.parentId === 0).length}个顶级分类）`);

  // 导入API
  console.log('\n导入API接口...');
  let successCount = 0;
  let errorCount = 0;

  for (const api of data.api) {
    try {
      const categoryId = groupMap.get(api.apiGroupInfo.groupId.toString());
      if (!categoryId) {
        console.warn(`警告: API "${api.apiName}" 的分类ID ${api.apiGroupInfo.groupId} 不存在`);
        errorCount++;
        continue;
      }

      // 处理请求参数
      let requestParams = null;
      let requestBody = null;
      if (api.inParms && api.inParms.length > 0) {
        const bodyParam = api.inParms.find((p: any) => p.paramPos === 'Body');
        if (bodyParam) {
          // 优先使用 bodyParam 层级的 demo 字段（这是完整的示例）
          if (bodyParam.demo && bodyParam.demo.trim() && bodyParam.demo !== ' ') {
            try {
              // demo 可能是字符串形式的 JSON，需要解析后再格式化
              const parsed = JSON.parse(bodyParam.demo);
              requestBody = JSON.stringify(parsed, null, 2);
            } catch {
              // 如果解析失败，直接使用原始值
              requestBody = bodyParam.demo;
            }
          } else if (bodyParam.model) {
            // 如果没有 demo，才从 model 中提取示例值
            const buildDemoFromModel = (model: any): any => {
              if (!model) return null;
              
              if (model.type === 'Array' && model.children && model.children.length > 0) {
                const firstChild = model.children[0];
                if (firstChild && firstChild.children) {
                  const obj: any = {};
                  for (const field of firstChild.children) {
                    if (field.example && field.example !== ' ') {
                      if (field.type === 'Number') {
                        obj[field.name] = parseInt(field.example) || 0;
                      } else if (field.type === 'Boolean') {
                        obj[field.name] = field.example === 'true';
                      } else {
                        obj[field.name] = field.example;
                      }
                    }
                  }
                  return Object.keys(obj).length > 0 ? [obj] : null;
                }
              } else if (model.type === 'Object' && model.children) {
                const obj: any = {};
                for (const field of model.children) {
                  if (field.example && field.example !== ' ') {
                    if (field.type === 'Number') {
                      obj[field.name] = parseInt(field.example) || 0;
                    } else if (field.type === 'Boolean') {
                      obj[field.name] = field.example === 'true';
                    } else {
                      obj[field.name] = field.example;
                    }
                  }
                }
                return Object.keys(obj).length > 0 ? obj : null;
              }
              
              return null;
            };
            
            const demoBody = buildDemoFromModel(bodyParam.model);
            if (demoBody) {
              requestBody = JSON.stringify(demoBody, null, 2);
            }
          }
        }

        const queryParams = api.inParms.filter((p: any) => p.paramPos === 'Query' || p.paramPos === 'Head');
        if (queryParams.length > 0) {
          // 按照 oder 字段排序
          queryParams.sort((a: any, b: any) => {
            const orderA = a.oder !== undefined ? a.oder : 999;
            const orderB = b.oder !== undefined ? b.oder : 999;
            return orderA - orderB;
          });
          
          const params: any = {};
          for (const param of queryParams) {
            if (param.demo && param.demo !== ' ') {
              params[param.paramName] = param.demo;
            }
          }
          if (Object.keys(params).length > 0) {
            requestParams = JSON.stringify(params, null, 2);
          }
        }
      }

      // 处理响应示例
      let responseExample = null;
      let responseSchema = null;
      if (api.response) {
        if (api.response.resDemo) {
          responseExample = api.response.resDemo;
        }
        if (api.response.model) {
          responseSchema = JSON.stringify(api.response.model);
        }
      }

      await prisma.hkApi.create({
        data: {
          name: api.apiName,
          path: api.path,
          method: api.httpMethod,
          description: api.description || '',
          summary: api.description?.substring(0, 100) || '',
          categoryId: categoryId,
          requestParams: requestParams,
          requestBody: requestBody,
          responseExample: responseExample,
          responseSchema: responseSchema,
          version: api.minVersion || 'V1.0',
          deprecated: 0,
          needAuth: api.protocol === 'HTTPS' ? 1 : 0,
          callCount: Math.floor(Math.random() * 1000),
          status: 1,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`导入API "${api.apiName}" 失败:`, error);
      errorCount++;
    }
  }

  console.log(`\n导入完成!`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${errorCount} 个`);

  // 统计信息
  const totalCategories = await prisma.hkApiCategory.count();
  const totalApis = await prisma.hkApi.count();
  const totalCalls = await prisma.hkApi.aggregate({
    _sum: {
      callCount: true,
    },
  });

  console.log(`\n最终统计:`);
  console.log(`分类总数: ${totalCategories}`);
  console.log(`API总数: ${totalApis}`);
  console.log(`总调用次数: ${totalCalls._sum.callCount}`);
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
