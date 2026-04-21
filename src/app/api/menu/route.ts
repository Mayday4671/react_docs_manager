/**
 * @file route.ts
 * @description 菜单管理 API 路由，提供菜单的增删改查及 key 生成/校验接口。
 * @module 系统管理
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMenus,
  getAllMenusForAdmin,
  createMenu,
  updateMenu,
  deleteMenu,
  generateUniqueKey,
  checkKeyExists,
} from '@/backend/services/menuService';

/**
 * GET /api/menu              → 侧边栏用，只返回启用+可见的
 * GET /api/menu?admin=1      → 管理页用，返回全部
 * GET /api/menu?action=gen-key&label=xxx          → 生成不重复 key
 * GET /api/menu?action=check-key&key=xxx&excludeId=1 → 校验 key 是否重复
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    if (action === 'gen-key') {
      const label = searchParams.get('label') || '';
      const excludeId = searchParams.get('excludeId') ? parseInt(searchParams.get('excludeId')!) : undefined;
      const key = await generateUniqueKey(label, excludeId);
      return NextResponse.json({ success: true, key });
    }

    if (action === 'check-key') {
      const key = searchParams.get('key') || '';
      const excludeId = searchParams.get('excludeId') ? parseInt(searchParams.get('excludeId')!) : undefined;
      const exists = await checkKeyExists(key, excludeId);
      return NextResponse.json({ success: true, exists });
    }

    if (searchParams.get('admin') === '1') {
      const menus = await getAllMenusForAdmin();
      return NextResponse.json({ success: true, data: menus });
    }

    const menuItems = await getAllMenus();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/menu  → 创建菜单
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label, icon, path, component, parentId, orderNum, menuType, visible, status } = body;

    if (!key || !label) {
      return NextResponse.json({ success: false, error: '缺少必填字段 key 或 label' }, { status: 400 });
    }

    // 再次校验 key 唯一性
    const exists = await checkKeyExists(key);
    if (exists) {
      return NextResponse.json({ success: false, error: `key "${key}" 已存在` }, { status: 400 });
    }

    const menu = await createMenu({
      key, label, icon, path, component,
      parentId: parentId || undefined,
      orderNum: orderNum ?? 0,
      menuType: menuType || (parentId ? 'C' : 'M'),
    });

    // 更新 visible/status（createMenu 不支持，单独 update）
    if (visible !== undefined || status !== undefined) {
      await updateMenu(menu.id, {
        visible: visible ?? 1,
        status: status ?? 1,
      });
    }

    return NextResponse.json({ success: true, data: menu });
  } catch (error: any) {
    console.error('Failed to create menu:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/menu  → 更新菜单
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, key, ...rest } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    }

    // 如果改了 key，校验唯一性
    if (key) {
      const exists = await checkKeyExists(key, id);
      if (exists) {
        return NextResponse.json({ success: false, error: `key "${key}" 已存在` }, { status: 400 });
      }
      rest.key = key;
    }

    const menu = await updateMenu(id, rest);
    return NextResponse.json({ success: true, data: menu });
  } catch (error: any) {
    console.error('Failed to update menu:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/menu?id=xxx  → 删除菜单
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') || '');
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    }
    await deleteMenu(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete menu:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
