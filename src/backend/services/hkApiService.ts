/**
 * @file hkApiService.ts
 * @description 海康威视 API 接口及分类的数据库服务层，封装 hk_api / hk_api_category 表的 CRUD 操作
 * @module 海康API
 */

import { prisma } from '../database/prisma';

/**
 * 获取所有启用状态的海康 API 分类，并以树形结构返回。
 * 每个分类节点包含其下的 API 列表（status=1），子分类递归嵌套。
 *
 * @returns 顶级分类数组，每项包含 apis 和 children 字段
 */
export async function getAllCategories() {
  try {
    // 获取所有分类
    const allCategories = await prisma.hkApiCategory.findMany({
      where: { status: 1 },
      include: {
        apis: {
          where: { status: 1 },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { orderNum: 'asc' }
    });

    console.log(`获取到 ${allCategories.length} 个分类`);

    // 构建树形结构
    const buildTree = (parentId: number | null = null): any[] => {
      const children = allCategories
        .filter(cat => cat.parentId === parentId)
        .map(category => {
          const node = {
            ...category,
            apis: category.apis.map(api => ({
              ...api,
              category: {
                id: category.id,
                name: category.name,
                description: category.description,
                icon: category.icon,
                orderNum: category.orderNum
              }
            })),
            children: buildTree(category.id)
          };
          return node;
        });
      
      return children;
    };

    // 返回顶级分类（parentId为null）
    const tree = buildTree(null);
    console.log(`构建了 ${tree.length} 个顶级分类`);
    
    return tree;
  } catch (error) {
    console.error('获取API分类失败:', error);
    throw new Error('Failed to fetch API categories');
  }
}

/**
 * 创建海康 API 分类。
 *
 * @param data - 分类数据
 * @param data.name - 分类名称
 * @param data.description - 分类描述（可选）
 * @param data.icon - 分类图标（可选）
 * @param data.orderNum - 排序号（可选）
 * @returns 新创建的分类记录
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  orderNum?: number;
}) {
  try {
    return await prisma.hkApiCategory.create({
      data
    });
  } catch (error) {
    console.error('创建API分类失败:', error);
    throw new Error('Failed to create API category');
  }
}

/**
 * 更新指定 ID 的海康 API 分类。
 *
 * @param id - 要更新的分类 ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @returns 更新后的分类记录
 */
export async function updateCategory(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  orderNum?: number;
  status?: number;
}) {
  try {
    return await prisma.hkApiCategory.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('更新API分类失败:', error);
    throw new Error('Failed to update API category');
  }
}

/**
 * 物理删除指定 ID 的海康 API 分类。
 * 注意：删除前需确保分类下没有关联 API，否则数据库外键约束会抛出异常。
 *
 * @param id - 要删除的分类 ID
 * @returns 被删除的分类记录
 */
export async function deleteCategory(id: number) {
  try {
    return await prisma.hkApiCategory.delete({
      where: { id }
    });
  } catch (error) {
    console.error('删除API分类失败:', error);
    throw new Error('Failed to delete API category');
  }
}

/**
 * 获取海康 API 接口列表，支持按分类过滤，同时关联查询分类信息。
 *
 * @param categoryId - 按分类 ID 过滤（可选，不传则返回所有启用的 API）
 * @returns API 记录数组（含分类信息），按名称升序排列
 */
export async function getAllApis(categoryId?: number) {
  try {
    const where = categoryId ? { categoryId, status: 1 } : { status: 1 };
    
    return await prisma.hkApi.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('获取API列表失败:', error);
    throw new Error('Failed to fetch APIs');
  }
}

/**
 * 根据 ID 获取单条海康 API 接口详情，同时关联查询分类信息。
 *
 * @param id - API 记录 ID
 * @returns API 记录（含分类信息），不存在时返回 null
 */
export async function getApiById(id: number) {
  try {
    return await prisma.hkApi.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
  } catch (error) {
    console.error('获取API详情失败:', error);
    throw new Error('Failed to fetch API details');
  }
}

/**
 * 创建海康 API 接口记录。
 *
 * @param data - API 数据，name/path/method/categoryId 为必填字段
 * @returns 新创建的 API 记录（含分类信息）
 */
export async function createApi(data: {
  name: string;
  path: string;
  method: string;
  description?: string;
  summary?: string;
  categoryId: number;
  requestHeaders?: string;
  requestParams?: string;
  requestBody?: string;
  responseExample?: string;
  responseSchema?: string;
  version?: string;
  deprecated?: number;
  needAuth?: number;
  rateLimit?: string;
  notes?: string;
  createdBy?: number;
}) {
  try {
    return await prisma.hkApi.create({
      data,
      include: {
        category: true
      }
    });
  } catch (error) {
    console.error('创建API失败:', error);
    throw new Error('Failed to create API');
  }
}

/**
 * 更新指定 ID 的海康 API 接口记录。
 *
 * @param id - 要更新的 API ID
 * @param data - 需要更新的字段（所有字段均为可选）
 * @returns 更新后的 API 记录（含分类信息）
 */
export async function updateApi(id: number, data: {
  name?: string;
  path?: string;
  method?: string;
  description?: string;
  summary?: string;
  categoryId?: number;
  requestHeaders?: string;
  requestParams?: string;
  requestBody?: string;
  responseExample?: string;
  responseSchema?: string;
  version?: string;
  deprecated?: number;
  needAuth?: number;
  rateLimit?: string;
  notes?: string;
  status?: number;
  updatedBy?: number;
}) {
  try {
    return await prisma.hkApi.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });
  } catch (error) {
    console.error('更新API失败:', error);
    throw new Error('Failed to update API');
  }
}

/**
 * 物理删除指定 ID 的海康 API 接口记录。
 *
 * @param id - 要删除的 API ID
 * @returns 被删除的 API 记录
 */
export async function deleteApi(id: number) {
  try {
    return await prisma.hkApi.delete({
      where: { id }
    });
  } catch (error) {
    console.error('删除API失败:', error);
    throw new Error('Failed to delete API');
  }
}

/**
 * 将指定 API 的调用次数加 1，并更新最后调用时间。
 *
 * @param id - API 记录 ID
 * @returns 更新后的 API 记录
 */
export async function incrementApiCallCount(id: number) {
  try {
    return await prisma.hkApi.update({
      where: { id },
      data: {
        callCount: {
          increment: 1
        },
        lastCall: new Date()
      }
    });
  } catch (error) {
    console.error('更新API调用统计失败:', error);
    throw new Error('Failed to update API call statistics');
  }
}

/**
 * 按关键词搜索海康 API 接口，匹配名称、路径、描述、摘要字段。
 *
 * @param keyword - 搜索关键词
 * @returns 匹配的 API 记录数组（含分类信息），按名称升序排列
 */
export async function searchApis(keyword: string) {
  try {
    return await prisma.hkApi.findMany({
      where: {
        status: 1,
        OR: [
          { name: { contains: keyword } },
          { path: { contains: keyword } },
          { description: { contains: keyword } },
          { summary: { contains: keyword } }
        ]
      },
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('搜索API失败:', error);
    throw new Error('Failed to search APIs');
  }
}

/**
 * 获取海康 API 统计信息，用于首页数据看板展示。
 * 包含：API 总数、分类总数、累计调用次数、最近调用的 5 条 API。
 *
 * @returns 统计数据对象
 */
export async function getApiStats() {
  try {
    const [totalApis, totalCategories, totalCalls, recentApis] = await Promise.all([
      prisma.hkApi.count({ where: { status: 1 } }),
      prisma.hkApiCategory.count({ where: { status: 1 } }),
      prisma.hkApi.aggregate({
        where: { status: 1 },
        _sum: { callCount: true }
      }),
      prisma.hkApi.findMany({
        where: { status: 1 },
        orderBy: { lastCall: 'desc' },
        take: 5,
        include: { category: true }
      })
    ]);

    return {
      totalApis,
      totalCategories,
      totalCalls: totalCalls._sum.callCount || 0,
      recentApis
    };
  } catch (error) {
    console.error('获取API统计失败:', error);
    throw new Error('Failed to fetch API statistics');
  }
}