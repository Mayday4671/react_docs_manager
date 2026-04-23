/**
 * @file AiChat.tsx
 * @description AI 对话页面，支持 Chat（流式）和 Embedding 测试两种模式
 * @module AI对话
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Select, Button, Input, Space, Typography, Tag, App, theme,
  Tabs, Spin, Avatar, Tooltip,
} from 'antd';
import {
  SendOutlined, RobotOutlined, UserOutlined, ClearOutlined,
  SettingOutlined, ThunderboltOutlined, StopOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/frontend/context/ThemeContext';
import AiConfigManager from './AiConfigManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

/** 判断是否为 Embedding 模型（不支持 chat） */
const isEmbeddingModel = (m: string) =>
  /embed|embedding/i.test(m);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: boolean;
}

interface AiConfig {
  id: number;
  name: string;
  provider: string;
  models: string[];
  defaultModel?: string | null;
  status: number;
}

const AiChat: React.FC = () => {
  const { token } = useToken();
  const { colorPrimary, darkMode } = useTheme();
  const { message: messageApi } = App.useApp();

  const [activeTab, setActiveTab] = useState('chat');
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [configId, setConfigId] = useState<number | null>(null);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [embInput, setEmbInput] = useState('');
  const [embResult, setEmbResult] = useState<any>(null);
  const [embLoading, setEmbLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/configs');
      const data = await res.json();
      if (data.success) {
        const enabled = data.data.filter((c: AiConfig) => c.status === 1);
        setConfigs(enabled);
        if (enabled.length > 0 && !configId) {
          setConfigId(enabled[0].id);
          // 默认选第一个非 embedding 模型
          const firstChat = enabled[0].models.find((m: string) => !isEmbeddingModel(m));
          setModel(firstChat || enabled[0].defaultModel || enabled[0].models[0] || '');
        }
      }
    } catch { /* ignore */ }
  }, [configId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleConfigChange = (id: number) => {
    setConfigId(id);
    const cfg = configs.find(c => c.id === id);
    if (cfg) {
      const firstChat = cfg.models.find(m => !isEmbeddingModel(m));
      setModel(firstChat || cfg.defaultModel || cfg.models[0] || '');
    }
  };

  const currentModels = configs.find(c => c.id === configId)?.models || [];
  const chatModels = currentModels.filter(m => !isEmbeddingModel(m));
  const embModels = currentModels.filter(m => isEmbeddingModel(m));

  const handleSend = async () => {
    if (!input.trim() || !configId || !model || loading) return;
    if (isEmbeddingModel(model)) {
      messageApi.warning('当前模型是 Embedding 模型，不支持对话，请切换到 Chat 模型');
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId, model, type: 'chat',
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: `请求失败: ${e.message}`, error: true, streaming: false } : m
        ));
      }
    } finally {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, streaming: false } : m
      ));
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setLoading(false); };

  const handleEmbedding = async () => {
    if (!embInput.trim() || !configId || !model) return;
    setEmbLoading(true);
    setEmbResult(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, model, type: 'embedding', input: embInput }),
      });
      const data = await res.json();
      if (data.success) setEmbResult(data);
      else messageApi.error(data.error || '请求失败');
    } catch (e: any) {
      messageApi.error(e.message);
    } finally {
      setEmbLoading(false);
    }
  };

  // ── 顶部工具栏 ──────────────────────────────────────────
  const toolbar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
      flexWrap: 'wrap',
    }}>
      {/* 配置选择 */}
      <Select
        placeholder="选择配置"
        value={configId ?? undefined}
        onChange={handleConfigChange}
        style={{ width: 150, height: 32 }}
        size="middle"
        options={configs.map(c => ({ value: c.id, label: c.name }))}
      />

      {/* 模型选择 - 只在选了配置后显示 */}
      {configId && (
        <Select
          placeholder="选择模型"
          value={model || undefined}
          onChange={setModel}
          style={{ width: 200, height: 32 }}
          size="middle"
          options={currentModels.map(m => ({
            value: m,
            label: (
              <Space size={4}>
                {m}
                {isEmbeddingModel(m) && <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>Emb</Tag>}
              </Space>
            ),
          }))}
        />
      )}

      {configs.length === 0 && (
        <Tag color="warning" style={{ fontSize: 12 }}>请先在「配置管理」中添加 AI 配置</Tag>
      )}
    </div>
  );

  // ── 消息气泡 ──────────────────────────────────────────
  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <div key={msg.id} style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 20, gap: 12, alignItems: 'flex-start',
        padding: '0 4px',
      }}>
        {!isUser && (
          <Avatar
            size={36}
            style={{
              background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}bb)`,
              flexShrink: 0, boxShadow: `0 2px 8px ${colorPrimary}44`,
            }}
            icon={<RobotOutlined />}
          />
        )}

        <div style={{ maxWidth: '70%', minWidth: 0 }}>
          <div style={{
            background: msg.error
              ? (darkMode ? 'rgba(255,77,79,0.1)' : '#fff2f0')
              : (isUser ? `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)` : (darkMode ? 'rgba(255,255,255,0.07)' : '#fff')),
            color: isUser ? '#fff' : (msg.error ? token.colorError : token.colorText),
            borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
            padding: '12px 16px',
            fontSize: 14, lineHeight: 1.75,
            border: isUser ? 'none' : `1px solid ${msg.error ? token.colorErrorBorder : token.colorBorderSecondary}`,
            boxShadow: isUser
              ? `0 4px 16px ${colorPrimary}33`
              : (darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'),
            wordBreak: 'break-word',
            display: 'inline-block',
            width: 'fit-content',
            maxWidth: '100%',
          }}>
            {msg.content ? (
              isUser ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              ) : (
                <div className="ai-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )
            ) : (
              msg.streaming ? (
                <Space size={4}>
                  <Spin size="small" />
                  <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>思考中...</Text>
                </Space>
              ) : null
            )}
            {msg.streaming && msg.content && (
              <span style={{
                display: 'inline-block', width: 2, height: 14,
                background: 'currentColor', marginLeft: 2,
                animation: 'blink 0.8s step-end infinite', verticalAlign: 'middle',
              }} />
            )}
          </div>
        </div>

        {isUser && (
          <Avatar
            size={36}
            style={{
              background: darkMode ? 'rgba(255,255,255,0.1)' : token.colorBgLayout,
              border: `1px solid ${token.colorBorderSecondary}`,
              flexShrink: 0,
            }}
            icon={<UserOutlined style={{ color: token.colorTextSecondary }} />}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 222px)', minHeight: 500,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`,
      overflow: 'hidden',
      background: token.colorBgContainer,
    }}>
      {toolbar}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        tabBarStyle={{ padding: '0 20px', marginBottom: 0, flexShrink: 0, background: token.colorBgContainer, zIndex: 1, position: 'relative' }}
        items={[
          // ── 对话 Tab ──────────────────────────────────
          {
            key: 'chat',
            label: <Space size={6}><ThunderboltOutlined />对话</Space>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                {/* 消息区域 */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '24px 20px',
                  background: darkMode
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                }}>
                  {messages.length === 0 ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      height: '100%', gap: 16,
                    }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: `${colorPrimary}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${colorPrimary}30`,
                      }}>
                        <RobotOutlined style={{ fontSize: 32, color: colorPrimary }} />
                      </div>
                      <Text style={{ color: token.colorTextTertiary, fontSize: 14 }}>
                        {configId ? '选择模型，开始对话' : '请先选择 AI 配置'}
                      </Text>
                      {chatModels.length > 0 && (
                        <Space wrap style={{ justifyContent: 'center' }}>
                          {chatModels.slice(0, 4).map(m => (
                            <Tag
                              key={m}
                              style={{ cursor: 'pointer', borderRadius: 20 }}
                              color={model === m ? 'blue' : 'default'}
                              onClick={() => setModel(m)}
                            >
                              {m}
                            </Tag>
                          ))}
                        </Space>
                      )}
                    </div>
                  ) : (
                    messages.map(renderMessage)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div style={{
                  padding: '10px 16px',
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                }}>
                  <Tooltip title="清空对话">
                    <Button
                      type="text" icon={<ClearOutlined />}
                      onClick={() => setMessages([])}
                      style={{ color: token.colorTextTertiary, flexShrink: 0, height: 36 }}
                    />
                  </Tooltip>

                  <TextArea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    style={{ flex: 1, resize: 'none', fontSize: 14, borderRadius: 8 }}
                    disabled={loading}
                  />

                  {loading ? (
                    <Button
                      danger icon={<StopOutlined />}
                      onClick={handleStop}
                      style={{ height: 36, borderRadius: 8, minWidth: 72, fontWeight: 500, flexShrink: 0 }}
                    >
                      停止
                    </Button>
                  ) : (
                    <Button
                      type="primary" icon={<SendOutlined />}
                      onClick={handleSend}
                      disabled={!input.trim() || !configId || !model || isEmbeddingModel(model)}
                      style={{
                        height: 36, borderRadius: 8, minWidth: 72, fontWeight: 600,
                        background: colorPrimary, borderColor: colorPrimary,
                        color: '#fff', fontSize: 14, flexShrink: 0,
                      }}
                    >
                      发送
                    </Button>
                  )}
                </div>
              </div>
            ),
          },

          // ── Embedding 测试 Tab ────────────────────────
          {
            key: 'embedding',
            label: <Space size={6}><ThunderboltOutlined />Embedding 测试</Space>,
            children: (
              <div style={{ padding: '24px 28px', maxWidth: 720 }}>
                {/* 说明卡片 */}
                <div style={{
                  padding: '14px 18px', borderRadius: 12, marginBottom: 20,
                  background: `${colorPrimary}0d`,
                  border: `1px solid ${colorPrimary}25`,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <ThunderboltOutlined style={{ color: colorPrimary, marginTop: 2 }} />
                  <div>
                    <Text strong style={{ color: colorPrimary, fontSize: 13 }}>Embedding 向量化测试</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      输入文本，调用 Embedding 接口获取向量表示。请选择 Embedding 模型（如 embedding-3）。
                    </Text>
                  </div>
                </div>

                {/* 模型选择提示 */}
                {embModels.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>推荐 Embedding 模型：</Text>
                    <Space style={{ marginLeft: 8 }}>
                      {embModels.map(m => (
                        <Tag
                          key={m} color={model === m ? 'purple' : 'default'}
                          style={{ cursor: 'pointer', borderRadius: 20 }}
                          onClick={() => setModel(m)}
                        >
                          {m}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 输入区域 */}
                <div style={{
                  borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  marginBottom: 16,
                }}>
                  <TextArea
                    value={embInput}
                    onChange={e => setEmbInput(e.target.value)}
                    placeholder="输入要向量化的文本，例如：今天天气真好"
                    rows={5}
                    variant="borderless"
                    style={{ fontSize: 14, padding: '14px 16px', resize: 'none' }}
                  />
                  <div style={{
                    padding: '8px 16px',
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    background: darkMode ? 'rgba(255,255,255,0.02)' : token.colorBgLayout,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                      {embInput.length} 字符
                    </Text>
                    <Button
                      type="primary" loading={embLoading}
                      onClick={handleEmbedding}
                      disabled={!embInput.trim() || !configId || !model}
                      style={{ background: colorPrimary, borderColor: colorPrimary, borderRadius: 20 ,
                        color: '#fff', fontSize: 14, flexShrink: 0,
                      }}
                      icon={<ThunderboltOutlined />}
                    >
                      获取向量
                    </Button>
                  </div>
                </div>

                {/* 结果展示 */}
                {embResult && (
                  <div style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: `1px solid ${token.colorSuccessBorder}`,
                    background: darkMode ? 'rgba(82,196,26,0.05)' : '#f6ffed',
                  }}>
                    {/* 结果头部 */}
                    <div style={{
                      padding: '12px 18px',
                      borderBottom: `1px solid ${token.colorSuccessBorder}`,
                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    }}>
                      <Tag color="success" style={{ borderRadius: 20 }}>✓ 成功</Tag>
                      <Space size={16}>
                        <Text style={{ fontSize: 13 }}>
                          模型：<Text code style={{ fontSize: 12 }}>{embResult.model}</Text>
                        </Text>
                        <Text style={{ fontSize: 13 }}>
                          维度：<Text strong style={{ color: colorPrimary, fontSize: 16 }}>{embResult.dimension}</Text>
                        </Text>
                        {embResult.usage && (
                          <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                            Tokens：{embResult.usage.prompt_tokens ?? embResult.usage.total_tokens ?? '-'}
                          </Text>
                        )}
                      </Space>
                    </div>

                    {/* 向量预览 */}
                    <div style={{ padding: '14px 18px' }}>
                      <Text style={{ fontSize: 12, color: token.colorTextSecondary, display: 'block', marginBottom: 8 }}>
                        前 10 个维度值（共 {embResult.dimension} 维）：
                      </Text>
                      <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: darkMode ? 'rgba(0,0,0,0.3)' : '#f0f0f0',
                        fontFamily: '"Cascadia Code", "Consolas", monospace',
                        fontSize: 12, color: darkMode ? '#9ece6a' : '#1a7f37',
                        overflowX: 'auto', whiteSpace: 'nowrap',
                        lineHeight: 1.8,
                      }}>
                        [&nbsp;{embResult.preview?.map((v: number, i: number) => (
                          <span key={i}>
                            <span style={{ color: darkMode ? '#7aa2f7' : '#0550ae' }}>{v.toFixed(6)}</span>
                            {i < embResult.preview.length - 1 ? ', ' : ''}
                          </span>
                        ))}&nbsp;... ]
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },

          // ── 配置管理 Tab ──────────────────────────────
          {
            key: 'config',
            label: <Space size={6}><SettingOutlined />配置管理</Space>,
            children: (
              <div style={{ padding: 24 }}>
                <AiConfigManager />
              </div>
            ),
          },
        ]}
      />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .ant-tabs-content-holder { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .ant-tabs-content { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
        .ant-tabs-tabpane { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
        .ant-tabs-tabpane-hidden { display: none !important; }
        .ai-markdown { line-height: 1.7; }
        .ai-markdown > * { margin-top: 0 !important; margin-bottom: 0 !important; }
        .ai-markdown p { margin: 0.25em 0 !important; }
        .ai-markdown p + p { margin-top: 0.5em !important; }
        .ai-markdown h1,.ai-markdown h2,.ai-markdown h3,.ai-markdown h4 { margin: 0.6em 0 0.3em !important; font-weight: 600; }
        .ai-markdown ul,.ai-markdown ol { padding-left: 1.4em; margin: 0.3em 0 !important; }
        .ai-markdown li { margin: 0.15em 0 !important; }
        .ai-markdown li > p { margin: 0 !important; }
        .ai-markdown code { background: rgba(128,128,128,0.15); padding: 1px 5px; border-radius: 4px; font-family: Consolas,monospace; font-size: 0.88em; }
        .ai-markdown pre { background: rgba(0,0,0,0.08); border-radius: 8px; padding: 10px 14px; overflow-x: auto; margin: 0.5em 0 !important; }
        .ai-markdown pre code { background: none; padding: 0; font-size: 13px; }
        .ai-markdown blockquote { border-left: 3px solid currentColor; margin: 0.5em 0 !important; padding: 4px 12px; opacity: 0.75; }
        .ai-markdown table { border-collapse: collapse; width: 100%; margin: 0.5em 0 !important; font-size: 13px; }
        .ai-markdown th,.ai-markdown td { border: 1px solid rgba(128,128,128,0.3); padding: 5px 10px; }
        .ai-markdown th { background: rgba(128,128,128,0.1); font-weight: 600; }
        .ai-markdown a { color: inherit; text-decoration: underline; opacity: 0.85; }
        .ai-markdown hr { border: none; border-top: 1px solid rgba(128,128,128,0.2); margin: 0.6em 0 !important; }
      `}</style>
    </div>
  );
};

export default AiChat;
