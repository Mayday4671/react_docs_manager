# 海康API签名包含查询参数修复

## 问题发现

从后端日志可以看到，海康威视服务器返回的错误信息显示，它期望的签名字符串包含查询参数：

```
POST\n*/*\napplication/json\nx-ca-key:20522666\n/artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=#userId#
```

但我们的代码在签名时只使用了路径，没有包含查询参数。

## 根本原因

海康威视API的签名算法要求：
1. 签名字符串必须包含完整的请求路径
2. 如果有查询参数，必须包含在签名路径中
3. 格式：`/path?param1=value1&param2=value2`

## 修复方案

修改 `src/app/api/hk-apis/route.ts`，在签名前构建包含查询参数的完整路径：

```typescript
// 构建查询字符串
let queryString = '';
if (config.requestParams) {
  const params = new URLSearchParams(config.requestParams);
  queryString = params.toString();
}

// 签名时需要包含查询参数
const signaturePath = queryString ? `${fullPath}?${queryString}` : fullPath;

// 签名时使用完整路径（包含查询参数）
const signature = generateSignature(
  signaturePath,
  config.appKey,
  config.appSecret,
  config.method
);
```

## 关于Head参数

在YAML文件中，`userId` 和 `domainId` 的 `paramPos` 是 `"Head"`，但实际上它们被当作查询参数处理。

这可能是海康API的特殊设计：
- 虽然标记为 `Head`，但实际上需要放在URL查询参数中
- 签名时必须包含这些参数

导入脚本已经正确处理了这种情况（第176行）：
```typescript
const queryParams = api.inParms.filter((p: any) => p.paramPos === 'Query' || p.paramPos === 'Head');
```

## 测试步骤

1. **重启开发服务器**（必须！）
   ```bash
   npm run dev
   ```

2. **测试API调用**
   - 选择"获取点位预览取流URLv2"
   - 配置baseUrl、AppKey、AppSecret
   - 点击"调用API"

3. **查看日志**
   应该看到：
   ```
   路径处理: {
     signaturePath: '/artemis/api/video/v2/cameras/previewURLs?userId=#userId#&domainId=0'
   }
   ```

4. **预期结果**
   - 不再报签名验证失败错误
   - 可能返回其他业务错误（如点位不存在），但签名应该通过

## 相关文件
- `src/app/api/hk-apis/route.ts` - API代理路由（已修复）
- `src/backend/utils/hkSignature.ts` - 签名算法（无需修改）
- `prisma/import-artemis-api.ts` - 数据导入脚本（已正确处理Head参数）
