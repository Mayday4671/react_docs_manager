# 海康API URL锚点问题修复

## 问题发现

从日志对比发现，`#userId#` 在传输过程中被截断了：

**我们发送的签名路径**:
```
/artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=#userId#
```

**海康服务器收到的路径**:
```
/artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=
```

`#userId#` 变成了空字符串！

## 根本原因

在URL中，`#` 是特殊字符，表示**锚点（fragment）**。当使用 Node.js 的 `https.request` 或浏览器的 `URL` 对象解析URL时，`#` 后面的内容会被当作fragment处理，不会发送到服务器。

例如：
```javascript
const url = new URL('https://example.com/path?userId=#userId#');
console.log(url.pathname + url.search); 
// 输出: /path?userId=
// #userId# 被当作 fragment，不包含在 pathname 和 search 中
```

## 解决方案

需要区分两种场景：

### 1. 签名时：使用原始值
签名字符串必须包含原始的 `#userId#`，不能编码：

```typescript
// 签名用的查询字符串
queryStringForSignature = 'domainId=0&userId=#userId#';
```

### 2. 实际请求时：编码 # 字符
发送HTTP请求时，必须将 `#` 编码为 `%23`，避免被当作锚点：

```typescript
// URL用的查询字符串
queryStringForUrl = 'domainId=0&userId=%23userId%23';
```

## 实现代码

```typescript
for (const key of sortedKeys) {
  const value = config.requestParams[key];
  
  // 签名用：原始值
  paramPairsForSignature.push(`${key}=${value}`);
  
  // URL用：对 # 字符进行编码
  const encodedValue = String(value).replace(/#/g, '%23');
  paramPairsForUrl.push(`${key}=${encodedValue}`);
}

queryStringForSignature = paramPairsForSignature.join('&');
queryStringForUrl = paramPairsForUrl.join('&');
```

## 完整流程

1. **构建签名路径**（原始值）:
   ```
   /artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=#userId#
   ```

2. **生成签名**:
   ```
   POST\n*/*\napplication/json\nx-ca-key:20522666\n/artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=#userId#
   ```

3. **构建请求URL**（编码后）:
   ```
   https://192.168.30.3:443/artemis/api/video/v2/cameras/previewURLs?domainId=0&userId=%23userId%23
   ```

4. **发送请求**:
   - 签名使用原始值计算
   - URL中的 `#` 被编码为 `%23`
   - 服务器收到完整的参数值

## 测试步骤

1. **重启开发服务器**（必须！）
   ```bash
   npm run dev
   ```

2. **测试API调用**

3. **查看日志**
   应该看到：
   ```
   queryStringForSignature: 'domainId=0&userId=#userId#'
   queryStringForUrl: 'domainId=0&userId=%23userId%23'
   ```

4. **预期结果**
   - 签名验证通过
   - 海康服务器收到完整的参数值
   - 不再报签名错误

## 关于 #userId# 占位符

`#userId#` 是海康API的占位符，表示需要替换为实际的用户ID。在实际使用中：
- 如果你有实际的用户ID，应该替换这个占位符
- 如果没有，可以尝试传空字符串或省略该参数
- 某些API可能不需要这个参数

## 相关文件
- `src/app/api/hk-apis/route.ts` - API代理路由（已修复）

## 技术细节

### URL的组成部分
```
https://example.com:443/path?query=value#fragment
       \_________/  \_/ \__/ \__________/ \______/
          host     port path    search    hash
```

- `#` 后面的部分是 fragment（锚点），不会发送到服务器
- 必须编码为 `%23` 才能作为参数值的一部分

### 为什么签名不能编码？
海康威视的签名算法要求使用原始值，如果编码了，签名就会不匹配。这是海康API的特殊要求。
