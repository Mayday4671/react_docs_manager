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
 * 菜单查询接口，根据查询参数返回不同数据集。
 *
 * GET /api/menu                                    → 侧边栏专用，只返回 status=1 且 visible=1 的菜单
 * GET /api/menu?admin=1                            → 管理页专用，返回全量菜单（含禁用/隐藏）
 * GET /api/menu?action=gen-key&label=xxx           → 根据名称生成不重复的菜单 key
 * GET /api/menu?action=check-key&key=xxx           → 校验 key 是否已被占用
 * GET /api/menu?action=check-key&key=xxx&excludeId=1 → 编辑时校验，排除自身 ID
 *
 * @param request - Next.js 请求对象
 * @returns JSON 响应，格式视 action 而定
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
 * 创建新菜单项。
 *
 * 请求体字段：
 *   - key（必填）：菜单唯一标识，提交前由前端校验唯一性，此处再做一次兜底校验
 *   - label（必填）：菜单显示名称
 *   - icon / path / component / parentId / orderNum / menuType：可选字段
 *   - visible / status：可选，默认均为 1（显示/启用）
 *
 * 注意：createMenu 不支持 visible/status 字段，创建后单独调用 updateMenu 补充。
 *
 * @param request - Next.js 请求对象，body 为 JSON
 * @returns 创建成功返回 { success: true, data: menu }，失败返回错误信息
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label, icon, path, component, parentId, orderNum, menuType, visible, status } = body;

    if (!key || !label) {
      return NextResponse.json({ success: false, error: '缺少必填字段 key 或 label' }, { status: 400 });
    }

    /** 再次兜底校验 key 唯一性，防止并发场景下前端校验失效 */
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

    /**
     * createMenu 不支持 visible/status 字段（Prisma schema 有默认值），
     * 若前端传入了非默认值，需单独调用 updateMenu 覆盖。
     */
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
 * 更新菜单项。
 *
 * 请求体字段：
 *   - id（必填）：要更新的菜单 ID
 *   - key（可选）：若传入则校验唯一性（排除自身），通过后才更新
 *   - 其余字段均为可选，只更新传入的字段
 *
 * @param request - Next.js 请求对象，body 为 JSON
 * @returns 更新成功返回 { success: true, data: menu }，失败返回错误信息
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, key, ...rest } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    }

    /** 若传入了新 key，校验唯一性（excludeId=id 排除自身，避免误报） */
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
 * 删除菜单项。
 *
 * 注意：有子菜单的目录无法直接删除，需前端提前拦截。
 * 若强行删除有子菜单的目录，数据库外键约束会抛出异常。
 *
 * @param request - Next.js 请求对象，查询参数 id 为要删除的菜单 ID
 * @returns 删除成功返回 { success: true }，失败返回错误信息
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
