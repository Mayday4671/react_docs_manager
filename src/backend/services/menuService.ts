/**
 * @file menuService.ts
 * @description 菜单业务逻辑服务层，封装对 sys_menu 表的所有数据库操作。
 *              包含侧边栏菜单查询、管理页全量查询、增删改及 key 唯一性校验。
 * @module 系统管理
 */

import { prisma } from '../database/prisma';

/**
 * 获取全量菜单数据（含禁用/隐藏），专供管理页面使用。
 * 与 getAllMenus 的区别：不过滤 status/visible，管理员需要看到所有菜单。
 * @returns 顶级菜单列表，每项包含直接子菜单（children），按 orderNum 升序排列
 */
export async function getAllMenusForAdmin() {
  try {
    return await prisma.sysMenu.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { orderNum: 'asc' },
        },
      },
      orderBy: { orderNum: 'asc' },
    });
  } catch (error) {
    console.error('获取菜单数据失败:', error);
    throw new Error('Failed to fetch menu items');
  }
}

/**
 * 生成在数据库中唯一的菜单 key。
 *
 * 转换规则：
 *   1. 中文词按内置映射表转为对应英文（如「用户管理」→ user-management）
 *   2. 其余非字母数字字符替换为连字符，合并连续连字符，去除首尾连字符
 *   3. 若候选 key 已存在，追加 -2、-3 直到找到不重复的
 *
 * @param label     - 菜单名称，用于生成候选 key
 * @param excludeId - 编辑模式下传入当前菜单 ID，避免与自身 key 冲突
 * @returns 保证在 sys_menu 表中唯一的 key 字符串
 */
export async function generateUniqueKey(label: string, excludeId?: number): Promise<string> {
  /** 中文常用词到英文的映射表 */
  const base = label
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]+/g, (m) => {
      const map: Record<string, string> = {
        首页: 'home', 用户: 'user', 角色: 'role', 系统: 'system',
        管理: 'management', 日志: 'log', 配置: 'config', 数据库: 'database',
        通知: 'notification', 文件: 'file', 文档: 'doc', 业务: 'business',
        菜单: 'menu', 权限: 'permission', 监控: 'monitor', 设置: 'settings',
      };
      // 逐字尝试映射，未匹配的用拼音首字母占位
      let result = m;
      for (const [cn, en] of Object.entries(map)) {
        result = result.replace(new RegExp(cn, 'g'), en + '-');
      }
      return result;
    })
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'menu';

  // 查库，找到不重复的 key
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.sysMenu.findUnique({
      where: { key: candidate },
    });
    if (!existing || existing.id === excludeId) break;
    suffix++;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * 校验指定 key 在 sys_menu 表中是否已存在。
 * 编辑模式下传入 excludeId，排除自身记录，避免误报重复。
 * @param key       - 要校验的菜单 key
 * @param excludeId - 编辑时排除的菜单 ID
 * @returns true 表示 key 已被其他菜单占用，false 表示可用
 */
export async function checkKeyExists(key: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.sysMenu.findUnique({ where: { key } });
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

/**
 * 获取所有菜单项（包含层级结构）
 * @returns 菜单列表
 */
export async function getAllMenus() {
  try {
    // 获取所有顶级菜单及其子菜单
    const menuItems = await prisma.sysMenu.findMany({
      where: {
        parentId: null,
        status: 1, // 只获取启用的菜单
        visible: 1 // 只获取可见的菜单
      },
      include: {
        children: {
          where: {
            status: 1,
            visible: 1
          },
          orderBy: {
            orderNum: 'asc'
          }
        }
      },
      orderBy: {
        orderNum: 'asc'
      }
    });

    return menuItems;
  } catch (error) {
    console.error('获取菜单数据失败:', error);
    throw new Error('Failed to fetch menu items');
  }
}

/**
 * 根据ID获取单个菜单项
 * @param id 菜单ID
 * @returns 菜单项
 */
export async function getMenuById(id: number) {
  try {
    const menuItem = await prisma.sysMenu.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true
      }
    });

    return menuItem;
  } catch (error) {
    console.error('获取菜单项失败:', error);
    throw new Error('Failed to fetch menu item');
  }
}

/**
 * 创建新菜单项
 * @param data 菜单数据
 * @returns 创建的菜单项
 */
export async function createMenu(data: {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  component?: string;
  parentId?: number;
  orderNum?: number;
  menuType?: string;
  createdBy?: number;
}) {
  try {
    const menuItem = await prisma.sysMenu.create({
      data: {
        key: data.key,
        label: data.label,
        icon: data.icon,
        path: data.path,
        component: data.component,
        parentId: data.parentId,
        orderNum: data.orderNum || 0,
        menuType: data.menuType || 'M',
        createdBy: data.createdBy
      }
    });

    return menuItem;
  } catch (error) {
    console.error('创建菜单项失败:', error);
    throw new Error('Failed to create menu item');
  }
}

/**
 * 更新菜单项
 * @param id 菜单ID
 * @param data 更新的数据
 * @returns 更新后的菜单项
 */
export async function updateMenu(
  id: number,
  data: {
    key?: string;
    label?: string;
    icon?: string;
    path?: string;
    component?: string;
    parentId?: number;
    orderNum?: number;
    menuType?: string;
    visible?: number;
    status?: number;
    updatedBy?: number;
  }
) {
  try {
    const menuItem = await prisma.sysMenu.update({
      where: { id },
      data
    });

    return menuItem;
  } catch (error) {
    console.error('更新菜单项失败:', error);
    throw new Error('Failed to update menu item');
  }
}

/**
 * 删除菜单项
 * @param id 菜单ID
 * @returns 删除的菜单项
 */
export async function deleteMenu(id: number) {
  try {
    const menuItem = await prisma.sysMenu.delete({
      where: { id }
    });

    return menuItem;
  } catch (error) {
    console.error('删除菜单项失败:', error);
    throw new Error('Failed to delete menu item');
  }
}
