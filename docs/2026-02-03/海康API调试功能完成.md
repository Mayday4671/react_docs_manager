# 海康威视 API 调试功能完成说明

## 完成时间
2026-02-03

## 功能概述
实现了完整的海康威视 API 调试功能，支持配置管理、签名验证、远程调用等。

## 主要功能

### 1. API 配置管理
- ✅ 配置可以保存到数据库
- ✅ 支持多个配置（内网环境、外网环境等）
- ✅ 支持设置默认配置
- ✅ 配置包含：名称、目标地址、AppKey、AppSecret、描述
- ✅ 页面加载时自动加载默认配置

### 2. 签名算法实现
- ✅ 完全按照海康威视 Artemis API 签名规范实现
- ✅ 使用 HMAC-SHA256 算法
- ✅ 签名字符串格式：`METHOD\n*/*\napplication/json\nx-ca-key:APP_KEY\nPATH`
- ✅ 智能处理 baseUrl 和 path 的拼接，避免路径重复

### 3. HTTPS 自签名证书支持
- ✅ 使用 Node.js https 模块处理自签名证书
- ✅ 设置 `rejectUnauthorized: false` 忽略证书验证
- ✅ 适用于内网开发环境

### 4. 请求体编辑
- ✅ 支持编辑 JSON 格式的请求体
- ✅ 自动格式化显示
- ✅ 实时验证 JSON 格式
- ⏳ 待优化：添加 JSON 编辑器，支持折叠和语法高亮

### 5. 响应结果显示
- ✅ JSON 格式化显示
- ✅ 支持暗色模式
- ⏳ 待优化：添加 JSON 查看器，支持折叠

## 技术实现

### 数据库表结构
```sql
CREATE TABLE hk_api_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  baseUrl TEXT NOT NULL,
  appKey TEXT NOT NULL,
  appSecret TEXT NOT NULL,
  description TEXT,
  isDefault INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  createdBy INTEGER,
  updatedBy INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 签名算法（TypeScript）
```typescript
export function generateSignature(
  path: string,
  appKey: string,
  appSecret: string,
  method: string = 'POST'
): string {
  const stringToSign = 
    `${method.toUpperCase()}\n` +
    `*/*\n` +
    `application/json\n` +
    `x-ca-key:${appKey}\n` +
    `${path}`;
  
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(stringToSign, 'utf8');
  return hmac.digest('base64');
}
```

### 请求头构建
```typescript
{
  'Accept': '*/*',
  'Content-Type': 'application/json',
  'X-Ca-Key': appKey,
  'X-Ca-Signature': signature,
  'X-Ca-Signature-Headers': 'x-ca-key'
}
```

## 使用说明

### 1. 保存配置
1. 在 API 详情抽屉中填写目标地址、AppKey、AppSecret
2. 点击"保存配置"按钮
3. 输入配置名称（如"南京环境"、"外网环境"）
4. 可选：输入描述信息
5. 可选：勾选"设为默认配置"
6. 点击"保存"

### 2. 调用 API
1. 在左侧树形菜单中选择 API
2. 在右侧详情抽屉中选择已保存的配置（或手动填写）
3. 编辑请求体，添加必需参数（如 pageNo、pageSize）
4. 点击"调用远程API"按钮
5. 查看响应结果

### 3. 管理配置
1. 点击"管理配置"按钮
2. 查看所有已保存的配置
3. 可以设置默认配置或删除配置

## 已知问题

### 1. 数据库示例数据问题
- 当前数据库中的 API 示例数据不完整
- requestBody 字段包含乱数据
- 需要从海康威视 API 文档中导入真实数据

### 2. JSON 编辑器优化
- 当前使用普通文本框编辑 JSON
- 缺少语法高亮和折叠功能
- 计划使用 `@uiw/react-json-view` 组件优化

## 下一步计划

1. ✅ 安装 `@uiw/react-json-view` 组件
2. ⏳ 替换请求体编辑器为 JSON 编辑器
3. ⏳ 替换响应结果显示为 JSON 查看器
4. ⏳ 清理数据库中的示例数据
5. ⏳ 从海康威视 API 文档导入真实数据

## 相关文件

### 前端
- `src/frontend/components/hk/HkApiDocs.tsx` - 主组件

### 后端
- `src/app/api/hk-apis/route.ts` - API 路由（包含代理调用）
- `src/app/api/hk-configs/route.ts` - 配置管理路由
- `src/backend/services/hkApiConfigService.ts` - 配置管理服务
- `src/backend/utils/hkSignature.ts` - 签名工具

### 数据库
- `prisma/schema.prisma` - 数据库模型定义
- `prisma/migrations/20260203114113_add_hk_api_config/` - 配置表迁移

## 测试结果

### 签名验证
✅ 签名算法正确，海康威视服务器验证通过

### API 调用
✅ 成功调用海康威视 API
✅ 返回业务错误（缺少参数），说明签名和请求都正确

### 配置管理
✅ 配置可以正常保存、加载、删除
✅ 默认配置功能正常

## 总结

海康威视 API 调试功能的核心功能已经完成，签名验证通过，可以成功调用远程 API。接下来需要优化用户体验，添加更好的 JSON 编辑和查看功能。
