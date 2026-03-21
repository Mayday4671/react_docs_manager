/**
 * 海康威视 API 服务
 * 负责处理海康API相关的业务逻辑
 */

import { prisma } from '../database/prisma';

// 海康API分类相关操作
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

// 海康API接口相关操作
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

// 增加API调用次数
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

// 搜索API
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

// 获取API统计信息
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