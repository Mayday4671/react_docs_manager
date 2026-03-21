# 后端文件夹说明

这个文件夹包含所有后端相关的代码，按照功能清晰分类。

## 📁 目录结构

```
backend/
├── database/          # 数据库相关
│   └── prisma.ts     # 数据库连接配置（Prisma客户端）
│
├── services/          # 业务逻辑层
│   └── menuService.ts # 菜单业务逻辑（增删改查）
│
├── models/            # 数据模型和类型定义
│   └── menu.ts       # 菜单数据类型定义
│
└── utils/             # 工具函数
    └── (工具函数文件)
```

## 📝 各文件夹说明

### 1. database/ - 数据库连接
**作用**: 管理数据库连接和配置

**文件**:
- `prisma.ts` - Prisma数据库客户端，用于连接SQLite数据库

**使用示例**:
```typescript
import { prisma } from '@/backend/database/prisma';

// 使用prisma进行数据库操作
const users = await prisma.user.findMany();
```

---

### 2. services/ - 业务逻辑层
**作用**: 处理具体的业务逻辑，封装数据库操作

**文件**:
- `menuService.ts` - 菜单相关的所有业务逻辑
  - `getAllMenus()` - 获取所有菜单
  - `getMenuById(id)` - 根据ID获取菜单
  - `createMenu(data)` - 创建新菜单
  - `updateMenu(id, data)` - 更新菜单
  - `deleteMenu(id)` - 删除菜单

**使用示例**:
```typescript
import { getAllMenus } from '@/backend/services/menuService';

// 在API路由中使用
const menus = await getAllMenus();
```

**为什么需要服务层？**
- ✅ 将业务逻辑从API路由中分离
- ✅ 代码可复用（多个API可以使用同一个服务）
- ✅ 易于测试和维护
- ✅ 统一的错误处理

---

### 3. models/ - 数据模型
**作用**: 定义数据的类型和结构

**文件**:
- `menu.ts` - 菜单相关的类型定义
  - `MenuItem` - 菜单项接口
  - `CreateMenuData` - 创建菜单的数据结构
  - `UpdateMenuData` - 更新菜单的数据结构

**使用示例**:
```typescript
import { MenuItem, CreateMenuData } from '@/backend/models/menu';

// 使用类型定义
const newMenu: CreateMenuData = {
  key: 'home',
  label: '首页',
  icon: 'HomeOutlined'
};
```

**为什么需要模型层？**
- ✅ TypeScript类型安全
- ✅ 统一的数据结构
- ✅ 自动代码提示
- ✅ 减少错误

---

### 4. utils/ - 工具函数
**作用**: 存放通用的工具函数

**示例**:
- 日期格式化
- 数据验证
- 加密解密
- 等等...

---

## 🔄 数据流向

```
API路由 (src/app/api/)
    ↓
服务层 (services/)
    ↓
数据库层 (database/)
    ↓
SQLite数据库
```

**举例 - 获取菜单数据的流程**:

1. **前端请求**: `GET /api/menu`
2. **API路由**: `src/app/api/menu/route.ts` 接收请求
3. **调用服务**: 调用 `getAllMenus()` 函数
4. **数据库查询**: 服务层使用 `prisma` 查询数据库
5. **返回数据**: 数据层层返回到前端

---

## 💡 如何添加新功能

### 示例：添加用户管理功能

1. **创建数据模型** (`models/user.ts`)
```typescript
export interface User {
  id: number;
  name: string;
  email: string;
}
```

2. **创建服务** (`services/userService.ts`)
```typescript
import { prisma } from '../database/prisma';

export async function getAllUsers() {
  return await prisma.user.findMany();
}
```

3. **创建API路由** (`src/app/api/users/route.ts`)
```typescript
import { getAllUsers } from '@/backend/services/userService';

export async function GET() {
  const users = await getAllUsers();
  return NextResponse.json(users);
}
```

---

## 🎯 最佳实践

1. **服务层负责业务逻辑** - 不要在API路由中直接操作数据库
2. **使用类型定义** - 所有数据结构都应该有类型定义
3. **统一错误处理** - 在服务层捕获和处理错误
4. **代码复用** - 相同的逻辑封装成函数
5. **清晰的命名** - 函数名要能表达其功能

---

## 📚 相关文件

- **数据库Schema**: `prisma/schema.prisma` - 定义数据库表结构
- **API路由**: `src/app/api/` - Next.js API路由
- **前端组件**: `src/frontend/` - React组件

---

## ❓ 常见问题

**Q: 为什么不直接在API路由中操作数据库？**
A: 分离业务逻辑可以让代码更易维护、测试和复用。

**Q: services和models有什么区别？**
A: models定义数据结构（类型），services实现业务逻辑（函数）。

**Q: 如何添加新的数据表？**
A: 
1. 在 `prisma/schema.prisma` 中定义表结构
2. 运行 `npx prisma db push` 更新数据库
3. 在 `models/` 中创建类型定义
4. 在 `services/` 中创建业务逻辑
5. 在 `src/app/api/` 中创建API路由
