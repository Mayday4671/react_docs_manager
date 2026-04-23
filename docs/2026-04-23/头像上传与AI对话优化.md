# 头像上传与 AI 对话优化

## 完成时间
2026-04-23

## 功能概述
新增头像上传功能，优化 AI 对话界面布局和 Markdown 渲染。

## 主要改动

### 头像上传
- ✅ 新增 `/api/upload` 接口，支持图片上传（JPG/PNG/GIF/WebP，最大 5MB）
- ✅ 个人信息页：头像可点击，hover 显示相机图标，选择图片后自动上传并更新
- ✅ 用户管理表格：用户名前展示头像
- ✅ 用户管理编辑弹窗：头像改为图片预览 + 点击上传，不再显示路径

### AI 对话界面
- ✅ 消息气泡宽度由内容决定（fit-content），不再撑满整行
- ✅ AI 回复支持 Markdown 渲染（标题/列表/代码块/表格等）
- ✅ 顶部工具栏去掉品牌标识，只保留配置和模型下拉，高度统一
- ✅ 输入框单行起始，内容多时自动扩展，发送按钮在右侧
- ✅ Tab 栏加 zIndex 防止消息内容滚动时穿透遮挡
- ✅ 自动识别 Embedding 模型，防止用 Embedding 模型发 Chat 请求

## 相关文件
- `src/app/api/upload/route.ts` — 文件上传 API
- `src/frontend/components/auth/ProfilePage.tsx` — 个人信息页头像上传
- `src/frontend/components/system/UserManagement.tsx` — 用户管理头像展示和上传
- `src/frontend/components/ai/AiChat.tsx` — AI 对话界面优化
- `public/uploads/avatars/` — 头像存储目录
