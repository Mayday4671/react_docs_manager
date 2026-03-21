# 快速测试指南

## 1. 重启开发服务器（必须！）

```bash
# 按 Ctrl+C 停止当前服务器
# 然后重新启动
npm run dev
```

## 2. 打开浏览器

访问: http://localhost:3000

## 3. 进入海康API文档页面

导航到: 系统管理 > HK API文档

## 4. 配置调试参数

在右侧"API调试"面板中：

- **目标地址**: `https://192.168.30.3:443/artemis`
- **AppKey**: 你的实际AppKey
- **AppSecret**: 你的实际AppSecret

## 5. 选择一个API测试

建议先测试简单的API：
- "获取根区域信息" (GET请求，无需请求体)

或者测试你之前的API：
- "获取点位预览取流URLv2"

## 6. 修改请求体（如果需要）

对于"获取点位预览取流URLv2"，确保 `cameraIndexCode` 是你系统中实际存在的值。

## 7. 点击"调用API"按钮

## 8. 查看结果

### 成功的标志：
- 不再报 `0x02401003` 签名错误
- 返回正常的业务数据或业务错误（如点位不存在）

### 查看日志：
按F12打开浏览器控制台，应该看到：

```
路径处理: {
  baseUrl: 'https://192.168.30.3:443/artemis',
  baseUrlPath: '/artemis',
  originalPath: '/api/video/v2/cameras/previewURLs',
  fullPath: '/artemis/api/video/v2/cameras/previewURLs',
  method: 'POST'
}
```

## 9. 如果还是失败

请截图以下内容：
1. 浏览器控制台的完整日志
2. API响应结果
3. 你的配置（baseUrl, AppKey）

然后告诉我具体的错误信息。

## 常见错误

### 错误1: 签名验证失败 (0x02401003)
- 原因: 服务器没有重启，旧代码还在运行
- 解决: 重启开发服务器

### 错误2: 点位不存在 (0x00072xxx)
- 原因: 请求体中的 `cameraIndexCode` 在系统中不存在
- 解决: 使用实际存在的点位编码

### 错误3: 参数缺失 (0x00072001)
- 原因: 请求体缺少必需参数
- 解决: 检查请求体JSON格式

### 错误4: 连接失败
- 原因: 网络不通或地址错误
- 解决: 检查baseUrl是否正确，网络是否连通
