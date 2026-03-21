import { NextResponse } from 'next/server';
import { getAllMenus } from '@/backend/services/menuService';

/**
 * GET /api/menu
 * 获取所有菜单数据
 */
export async function GET() {
  try {
    const menuItems = await getAllMenus();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
