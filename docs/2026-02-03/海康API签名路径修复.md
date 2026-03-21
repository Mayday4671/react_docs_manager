# 海康API签名路径修复

## 问题描述

用户在调用海康威视API时遇到签名验证失败的问题：

```json
{
  "code": "0x02401003",
  "msg": "api AK/SK signature authentication failed,Invalid Signature! and StringToSign: POST\n*/*\napplication/json\nx-ca-key:20522666\n/artemis/api/irds/v2/resource/resourcesByParams"
}
```

## 问题分析

### 数据结构
- **数据库中的API路径**: `/api/video/v2/cameras/previewURLs`
- **用户配置的baseUrl**: `https://192.168.30.3:443/artemis`
- **海康期望的完整路径**: `/artemis/api/video/v2/cameras/previewURLs`

### 问题根源
1. 数据库中存储的path只包含 `/api/...` 部分（从YAML文件导入）
2. 用户的baseUrl包含 `/artemis` 路径前缀
3. 签名时需要使用完整路径（包含 `/artemis` 前缀）
4. 实际请求URL也需要使用完整路径

### 原代码问题
原代码在处理路径时有逻辑缺陷：
```typescript
// 原代码
let baseUrl = config.baseUrl.replace(/\/$/, '');
let requestUrl = `${baseUrl}${config.path}`;
// 结果: https://192.168.30.3:443/artemis/api/video/v2/cameras/previewURLs
// 但签名路径可能不一致
```

## 解决方案

### 修复代码
修改 `src/app/api/hk-apis/route.ts` 中的路径处理逻辑：

```typescript
// 解析 baseUrl 获取路径前缀
const parsedBaseUrl = new URL(config.baseUrl);
const baseUrlPath = parsedBaseUrl.pathname.replace(/\/$/, ''); // 去除末尾斜杠

// 构建完整路径用于签名和请求
let fullPath = config.path;
if (baseUrlPath && baseUrlPath !== '/' && !config.path.startsWith(baseUrlPath)) {
  // path 不包含 baseUrl 的路径前缀，需要补全
  fullPath = baseUrlPath + config.path;
}

// 签名时使用完整路径
const signature = generateSignature(
  fullPath,
  config.appKey,
  config.appSecret,
  config.method
);

// 构建完整URL（使用协议+域名+端口+完整路径）
const baseOrigin = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;
let requestUrl = `${baseOrigin}${fullPath}`;
```

### 修复逻辑
1. **解析baseUrl**: 使用 `new URL()` 解析，分离出协议、域名、端口和路径前缀
2. **构建完整路径**: 如果baseUrl包含路径前缀（如 `/artemis`），将其与API路径拼接
3. **统一使用**: 签名和实际请求都使用同一个完整路径
4. **URL构建**: 使用 `协议://域名:端口` + `完整路径` 的方式构建最终URL

### 示例

#### 场景1: baseUrl包含路径前缀
- **baseUrl**: `https://192.168.30.3:443/artemis`
- **API path**: `/api/video/v2/cameras/previewURLs`
- **解析结果**:
  - `baseOrigin`: `https://192.168.30.3:443`
  - `baseUrlPath`: `/artemis`
  - `fullPath`: `/artemis/api/video/v2/cameras/previewURLs`
  - `requestUrl`: `https://192.168.30.3:443/artemis/api/video/v2/cameras/previewURLs`
- **签名路径**: `/artemis/api/video/v2/cameras/previewURLs` ✅

#### 场景2: baseUrl不包含路径前缀
- **baseUrl**: `https://192.168.30.3:443`
- **API path**: `/api/video/v2/cameras/previewURLs`
- **解析结果**:
  - `baseOrigin`: `https://192.168.30.3:443`
  - `baseUrlPath`: `/` (或空)
  - `fullPath`: `/api/video/v2/cameras/previewURLs`
  - `requestUrl`: `https://192.168.30.3:443/api/video/v2/cameras/previewURLs`
- **签名路径**: `/api/video/v2/cameras/previewURLs` ✅

## 测试验证

### 测试步骤
1. 配置baseUrl为 `https://192.168.30.3:443/artemis`
2. 选择任意API（如"获取点位预览取流URLv2"）
3. 填写正确的AppKey和AppSecret
4. 点击"调用API"按钮
5. 查看控制台日志和响应结果

### 预期结果
- 控制台日志显示正确的路径处理：
  ```
  路径处理: {
    baseUrl: 'https://192.168.30.3:443/artemis',
    baseUrlPath: '/artemis',
    originalPath: '/api/video/v2/cameras/previewURLs',
    fullPath: '/artemis/api/video/v2/cameras/previewURLs',
    method: 'POST'
  }
  ```
- API调用成功，不再报签名错误

## 相关文件
- `src/app/api/hk-apis/route.ts` - API代理路由（已修复）
- `src/backend/utils/hkSignature.ts` - 签名算法（无需修改）
- `prisma/import-artemis-api.ts` - 数据导入脚本（无需修改）

## 注意事项
1. 数据库中的API路径保持不变（只存储 `/api/...` 部分）
2. baseUrl配置由用户决定（可以包含或不包含路径前缀）
3. 代码会自动处理路径拼接，确保签名和请求一致
4. 支持HTTPS自签名证书（已在之前的修复中实现）
