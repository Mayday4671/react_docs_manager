# 代码规范 - 注释标准

## 注释要求（强制执行）

### TypeScript / TSX 文件

#### 1. 文件头注释
每个文件顶部必须有文件说明注释：
```ts
/**
 * @file 文件名.ts
 * @description 文件功能描述
 * @module 所属模块（如：系统管理 / 文档笔记 / 海康API）
 */
```

#### 2. 接口 / 类型注释
所有 `interface`、`type` 必须有 JSDoc 注释，每个字段也要注释：
```ts
/**
 * 菜单项数据结构
 */
interface MenuItem {
  /** 菜单唯一标识，对应 componentMap 中的 key */
  id: number;
  /** 菜单显示名称 */
  label: string;
  /** 菜单类型：M-目录（有子菜单）/ C-菜单（叶子节点） */
  menuType: 'M' | 'C';
  /** 是否显示：1-显示 0-隐藏 */
  visible: number;
}
```

#### 3. 函数 / 方法注释
所有函数必须使用 JSDoc 格式，禁止使用单行 `//` 注释替代：
```ts
/**
 * 生成不重复的菜单 key
 * @param label - 菜单名称，用于生成候选 key
 * @param excludeId - 编辑时排除自身 ID，避免与自己冲突
 * @returns 保证在数据库中唯一的 key 字符串
 */
export async function generateUniqueKey(label: string, excludeId?: number): Promise<string> {
```

#### 4. React 组件注释
```tsx
/**
 * 图标选择器组件
 *
 * 点击触发弹窗，展示图标网格供用户选择。
 * 支持搜索过滤，选中图标高亮显示。
 *
 * @param value - 当前选中的图标名称（如 'HomeOutlined'）
 * @param onChange - 选中图标后的回调，传入图标名称字符串
 */
const IconPicker: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
}> = ({ value, onChange }) => {
```

#### 5. 状态变量注释
组件内的 `useState` 必须有单行注释说明用途：
```ts
/** 菜单树形数据列表 */
const [menus, setMenus] = useState<MenuItem[]>([]);
/** 表格加载状态 */
const [loading, setLoading] = useState(false);
/** 新增/编辑弹窗是否打开 */
const [modalOpen, setModalOpen] = useState(false);
/** 当前正在编辑的菜单项，null 表示新增模式 */
const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
```

#### 6. 常量注释
```ts
/** componentMap 中已注册的组件 key 列表，用于菜单绑定组件时的下拉选项 */
const REGISTERED_KEYS = [...];

/** 可选图标列表，来自 @ant-design/icons，仅列出常用图标 */
const ICON_OPTIONS = [...];
```

#### 7. 复杂逻辑块注释
逻辑复杂的代码块前加说明注释：
```ts
// 把没有子菜单的 children:[] 设为 undefined
// 原因：antd Table 对 children 为空数组的行仍会显示展开按钮，设为 undefined 可避免此问题
const clean = (items: MenuItem[]): MenuItem[] => ...
```

---

### 禁止的注释写法

❌ 用单行注释替代 JSDoc：
```ts
// 获取菜单列表
const fetchMenus = async () => {
```

❌ 无意义的注释：
```ts
// 设置 loading 为 true
setLoading(true);
```

❌ 接口字段无注释：
```ts
interface MenuItem {
  id: number;
  label: string;
}
```

---

### API 路由文件注释规范

```ts
/**
 * GET /api/menu              → 侧边栏用，只返回启用+可见的菜单
 * GET /api/menu?admin=1      → 管理页用，返回全部菜单（含禁用/隐藏）
 * GET /api/menu?action=gen-key&label=xxx  → 生成不重复的菜单 key
 *
 * @param request - Next.js 请求对象
 * @returns JSON 响应
 */
export async function GET(request: NextRequest) {
```

---

### 执行要求

1. **新增文件**：必须完整包含以上所有注释
2. **修改文件**：修改到的函数/组件/接口必须补全注释
3. **不允许**：提交没有注释的新函数、接口、组件
