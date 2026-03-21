# 紧急修复：HkApiDocs.tsx 编码损坏

## 问题
使用PowerShell批量替换时破坏了UTF-8编码，导致中文字符损坏。

## 解决方案

### 方法1：从Git恢复（推荐）
```bash
git checkout src/frontend/components/hk/HkApiDocs.tsx
```

然后手动应用以下修改。

### 方法2：手动修复

需要修改的内容：

1. **导入App组件**
```typescript
import { ..., App } from 'antd';
```

2. **在组件内使用hooks**
```typescript
const HkApiDocs: React.FC = () => {
  const { darkMode, colorPrimary } = useTheme();
  const { message: messageApi } = App.useApp();  // 添加这行
  // ... 其他代码
```

3. **包裹组件**
```typescript
return (
  <App>  {/* 添加 */}
    <div style={{ ... }}>
      {/* 所有现有内容 */}
    </div>
  </App>  {/* 添加 */}
);
```

4. **替换message调用**（手动查找替换）
- `message.success` → `messageApi.success`
- `message.error` → `messageApi.error`  
- `message.info` → `messageApi.info`
- `message.warning` → `messageApi.warning`

## 注意事项
- 不要使用PowerShell的批量替换，会破坏UTF-8编码
- 使用VS Code的查找替换功能（Ctrl+H）
- 确保文件编码为UTF-8
