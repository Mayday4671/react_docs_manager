# AI 对话功能

## 完成时间
2026-04-22

## 功能概述
新增通用 AI 对话模块，支持多厂商模型配置（API Key 加密入库），提供聊天气泡对话界面和 Embedding 向量测试功能。

## 主要功能
- ✅ AI 模型配置管理（增删改查）
- ✅ API Key AES-256-GCM 加密存储，密钥存 .env，数据库只存密文
- ✅ 厂商预设（智谱 AI / DeepSeek / 通义千问 / OpenAI / 自定义）
- ✅ Chat 流式对话（SSE 透传），聊天气泡 UI
- ✅ Embedding 测试（显示维度和前10个值预览）
- ✅ 停止流式输出按钮
- ✅ 清空对话记录

## 支持厂商
| 厂商 | Base URL | 代表模型 |
|------|----------|---------|
| 智谱 AI | https://open.bigmodel.cn/api/paas/v4 | glm-4, embedding-3 |
| DeepSeek | https://api.deepseek.com/v1 | deepseek-chat |
| 通义千问 | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-turbo |
| OpenAI | https://api.openai.com/v1 | gpt-4o |
| 自定义 | 手动填写 | 手动填写 |

## 数据库变更
- 新增 `ai_model_config` 表（AI模型配置）

## 相关文件

### 后端
- `src/backend/services/aiService.ts` — 加解密、配置 CRUD、请求代理
- `src/app/api/ai/configs/route.ts` — 配置管理 API
- `src/app/api/ai/chat/route.ts` — Chat/Embedding 代理接口

### 前端
- `src/frontend/components/ai/AiChat.tsx` — 对话主页面（含 Embedding 测试和配置管理 Tab）
- `src/frontend/components/ai/AiConfigManager.tsx` — 配置管理子组件
- `src/frontend/config/componentMap.tsx` — 注册 `ai-chat` 组件

### 数据库脚本
- `prisma/add-ai-menu.ts` — 插入 AI 对话菜单（已执行）

## 新增依赖
无（使用 Node.js 内置 `crypto` 模块加密）

## 注意事项
- `AI_ENCRYPT_KEY` 在 `.env` 中配置，生产环境必须替换为随机 64 位 hex 字符串
- 所有厂商均使用 OpenAI 兼容格式（`/chat/completions` 和 `/embeddings`）
- Embedding 结果只展示维度和前10个值，完整向量不返回前端
