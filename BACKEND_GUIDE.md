# 后端文件快速指南 🚀

## 📂 后端文件夹结构（一目了然）

```
src/backend/
│
├── 📁 database/           ← 数据库连接
│   └── prisma.ts         ← 连接SQLite数据库的客户端
│
├── 📁 services/           ← 业务逻辑（核心功能）
│   └── menuService.ts    ← 菜单的增删改查功能
│
├── 📁 models/             ← 数据类型定义
│   └── menu.ts           ← 菜单的数据结构
│
└── 📁 utils/              ← 工具函数
```

---

## 🎯 每个文件的作用

### 1️⃣ database/prisma.ts - 数据库连接
**这是什么？** 连接数据库的客户端

**作用：** 让你的代码能够访问SQLite数据库

**你需要改它吗？** ❌ 不需要，除非换数据库

```typescript
// 其他文件这样使用它：
import { prisma } from '@/backend/database/prisma';
```

---

### 2️⃣ services/menuService.ts - 菜单业务逻辑
**这是什么？** 处理菜单相关的所有操作

**包含的功能：**
- ✅ `getAllMenus()` - 获取所有菜单
- ✅ `getMenuById(id)` - 获取单个菜单
- ✅ `createMenu(data)` - 创建新菜单
- ✅ `updateMenu(id, data)` - 更新菜单
- ✅ `deleteMenu(id)` - 删除菜单

**你需要改它吗？** ✅ 需要！当你要添加新的菜单功能时

**示例：**
```typescript
// API路由中使用
import { getAllMenus } from '@/backend/services/menuService';

const menus = await getAllMenus();
```

---

### 3️⃣ models/menu.ts - 菜单数据类型
**这是什么？** 定义菜单数据的结构

**包含的类型：**
- `MenuItem` - 菜单项的完整结构
- `CreateMenuData` - 创建菜单需要的数据
- `UpdateMenuData` - 更新菜单需要的数据

**你需要改它吗？** ✅ 需要！当菜单需要新字段时

**示例：**
```typescript
import { MenuItem } from '@/backend/models/menu';

const menu: MenuItem = {
  id: 1,
  key: 'home',
  label: '首页',
  icon: 'HomeOutlined',
  order: 0,
  // ...
};
```

---

## 🔄 数据流程（从前端到数据库）

```
1. 前端发起请求
   ↓
2. API路由接收 (src/app/api/menu/route.ts)
   ↓
3. 调用服务层 (services/menuService.ts)
   ↓
4. 使用数据库客户端 (database/prisma.ts)
   ↓
5. 查询SQLite数据库
   ↓
6. 返回数据给前端
```

---

## 💡 实际例子：获取菜单数据

### API路由文件 (`src/app/api/menu/route.ts`)
```typescript
import { getAllMenus } from '@/backend/services/menuService';

export async function GET() {
  const menus = await getAllMenus();  // 调用服务层
  return NextResponse.json(menus);
}
```

### 服务层文件 (`services/menuService.ts`)
```typescript
import { prisma } from '../database/prisma';

export async function getAllMenus() {
  return await prisma.menuItem.findMany({  // 使用数据库客户端
    where: { parentId: null },
    include: { children: true }
  });
}
```

---

## 🆕 如何添加新功能？

### 例子：添加"获取热门菜单"功能

**步骤1：** 在 `services/menuService.ts` 添加函数
```typescript
export async function getPopularMenus() {
  return await prisma.menuItem.findMany({
    where: { isPopular: true },
    orderBy: { viewCount: 'desc' }
  });
}
```

**步骤2：** 在 `src/app/api/menu/popular/route.ts` 创建API
```typescript
import { getPopularMenus } from '@/backend/services/menuService';

export async function GET() {
  const menus = await getPopularMenus();
  return NextResponse.json(menus);
}
```

**完成！** 现在可以访问 `/api/menu/popular`

---

## 📝 记住这些要点

1. **database/** = 连接数据库（不常改）
2. **services/** = 业务逻辑（经常改，添加新功能在这里）
3. **models/** = 数据类型（添加新字段时改）
4. **API路由** = 只负责接收请求和返回响应，具体逻辑在services

---

## ❓ 常见问题

**Q: 我想添加用户管理功能，应该怎么做？**
A: 
1. 在 `models/` 创建 `user.ts` 定义用户类型
2. 在 `services/` 创建 `userService.ts` 写业务逻辑
3. 在 `src/app/api/users/` 创建API路由

**Q: 为什么不直接在API路由里写数据库查询？**
A: 分离后代码更清晰，可以在多个地方复用同一个功能

**Q: 我只想改菜单显示的内容，需要改后端吗？**
A: 不需要！只需要在数据库里修改数据，或者改前端组件

---

## 🎓 学习路径

1. **新手**: 先看 `services/menuService.ts`，理解每个函数的作用
2. **进阶**: 尝试添加一个新的服务函数
3. **高级**: 创建一个完整的新功能（如用户管理）

---

## 📚 相关文档

- 详细说明: `src/backend/README.md`
- 项目结构: `PROJECT_STRUCTURE.md`
- 数据库Schema: `prisma/schema.prisma`
