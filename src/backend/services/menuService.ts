/**
 * 菜单服务
 * 负责处理菜单相关的业务逻辑
 */

import { prisma } from '../database/prisma';

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
