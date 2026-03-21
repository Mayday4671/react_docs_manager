# 项目结构说明

## 重构后的目录结构

项目已经重新组织，将前端和后端文件分离，便于开发和维护。

```
src/
├── app/                    # Next.js App Router (路由定义)
│   ├── api/               # API路由
│   │   └── menu/          # 菜单API
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页路由
│
├── frontend/              # 前端相关文件
│   ├── components/        # React组件
│   │   ├── button/        # 按钮组件
│   │   ├── dashboard/     # 仪表板组件
│   │   ├── layout/        # 布局组件
│   │   └── player/        # 播放器组件
│   ├── config/            # 前端配置
│   │   └── componentMap.tsx # 组件映射配置
│   ├── context/           # React Context
│   │   ├── AntdConfig.tsx # Antd配置
│   │   └── ThemeContext.tsx # 主题上下文
│   ├── hooks/             # 自定义Hooks
│   ├── styles/            # 样式文件
│   │   ├── globals.css    # 全局样式
│   │   └── LayOut.css     # 布局样式
│   └── utils/             # 前端工具函数
│
├── backend/               # 后端相关文件 ⭐
│   ├── database/          # 数据库连接
│   │   └── prisma.ts      # Prisma客户端（连接SQLite数据库）
│   ├── services/          # 业务逻辑层
│   │   └── menuService.ts # 菜单服务（增删改查逻辑）
│   ├── models/            # 数据模型和类型定义
│   │   └── menu.ts        # 菜单数据类型
│   ├── utils/             # 后端工具函数
│   └── README.md          # 后端文件夹详细说明 📖
│
├── hooks/                 # 共享Hooks (待清理)
└── utils/                 # 共享工具函数 (待清理)
```

## 文件分类说明

### 前端文件 (`src/frontend/`)
- **组件**: 所有React组件，包括UI组件、布局组件、业务组件
- **样式**: CSS文件和样式相关配置
- **配置**: 前端特定的配置文件，如组件映射、路由配置等
- **上下文**: React Context相关文件，用于状态管理
- **Hooks**: 前端特定的自定义Hooks
- **工具**: 前端特定的工具函数

### 后端文件 (`src/backend/`)
- **database**: 数据库连接配置（Prisma客户端）
- **services**: 业务逻辑层，处理具体的业务功能（如菜单的增删改查）
- **models**: 数据模型和TypeScript类型定义
- **工具**: 后端特定的工具函数

**详细说明**: 查看 `src/backend/README.md` 了解每个文件的作用

### App Router (`src/app/`)
- **路由定义**: Next.js的页面路由
- **API路由**: RESTful API端点
- **布局**: 应用级别的布局组件

## 导入路径规范

使用绝对路径导入，路径别名配置：

```typescript
// 前端组件
import Component from '@/frontend/components/...'
import { useTheme } from '@/frontend/context/ThemeContext'
import '@/frontend/styles/globals.css'

// 后端服务
import { prisma } from '@/backend/database/prisma'
import { getAllMenus } from '@/backend/services/menuService'
import type { MenuItem } from '@/backend/models/menu'
```

## 优势

1. **清晰的职责分离**: 前端和后端文件完全分离
2. **易于维护**: 相关文件集中在对应目录
3. **团队协作**: 前端和后端开发者可以专注于各自领域
4. **扩展性**: 便于添加新的功能模块
5. **代码复用**: 共享的工具函数和类型定义可以放在根级别

## 迁移完成

- ✅ 所有前端文件已移动到 `src/frontend/`
- ✅ 所有后端文件已移动到 `src/backend/`
- ✅ 导入路径已更新
- ✅ 项目可正常运行
- ✅ API功能正常