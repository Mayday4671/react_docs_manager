/**
 * @file AiChat.tsx
 * @description AI 对话页面，支持 Chat（流式）和 Embedding 测试两种模式
 * @module AI对话
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Select, Button, Input, Space, Typography, Tag, App, theme,
  Tabs, Spin, Empty, Divider,
} from 'antd';
import {
  SendOutlined, RobotOutlined, UserOutlined, ClearOutlined,
  SettingOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/frontend/context/ThemeContext';
import AiConfigManager from './AiConfigManager';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

/**
 * 消息数据结构
 */
interface Message {
  /** 消息唯一 ID */
  id: string;
  /** 角色：user-用户 assistant-AI system-系统 */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容 */
  content: string;
  /** 是否正在流式输出 */
  streaming?: boolean;
}

/**
 * AI 配置数据结构（前端用）
 */
interface AiConfig {
  id: number;
  name: string;
  provider: string;
  models: string[];
  defaultModel?: string | null;
  status: number;
}

/**
 * AI 对话主页面组件
 */
const AiChat: React.FC = () => {
  const { token } = useToken();
  const { colorPrimary, darkMode } = useTheme();
  const { message: messageApi } = App.useApp();

  /** 当前激活的 Tab：chat-对话 embedding-向量测试 config-配置管理 */
  const [activeTab, setActiveTab] = useState('chat');
  /** AI 配置列表 */
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  /** 当前选中的配置 ID */
  const [configId, setConfigId] = useState<number | null>(null);
  /** 当前选中的模型 */
  const [model, setModel] = useState('');
  /** 对话消息列表 */
  const [messages, setMessages] = useState<Message[]>([]);
  /** 输入框内容 */
  const [input, setInput] = useState('');
  /** 是否正在请求 */
  const [loading, setLoading] = useState(false);
  /** Embedding 输入文本 */
  const [embInput, setEmbInput] = useState('');
  /** Embedding 结果 */
  const [embResult, setEmbResult] = useState<any>(null);
  /** Embedding 加载状态 */
  const [embLoading, setEmbLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** 自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 获取 AI 配置列表
   */
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/configs');
      const data = await res.json();
      if (data.success) {
        const enabled = data.data.filter((c: AiConfig) => c.status === 1);
        setConfigs(enabled);
        if (enabled.length > 0 && !configId) {
          setConfigId(enabled[0].id);
          setModel(enabled[0].defaultModel || enabled[0].models[0] || '');
        }
      }
    } catch { /* ignore */ }
  }, [configId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  /** 切换配置时更新模型 */
  const handleConfigChange = (id: number) => {
    setConfigId(id);
    const cfg = configs.find(c => c.id === id);
    if (cfg) setModel(cfg.defaultModel || cfg.models[0] || '');
  };

  /** 当前配置的模型列表 */
  const currentModels = configs.find(c => c.id === configId)?.models || [];

  /**
   * 发送 Chat 消息（流式）
   */
  const handleSend = async () => {
    if (!input.trim() || !configId || !model || loading) return;

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
          } catch { /* 忽略解析失败的行 */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        messageApi.error(`请求失败: ${e.message}`);
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: `❌ 错误: ${e.message}`, streaming: false } : m
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

  /**
   * 停止流式输出
   */
  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  /**
   * 测试 Embedding
   */
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

  /** 顶部模型选择栏 */
  const renderToolbar = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer, flexWrap: 'wrap',
    }}>
      <RobotOutlined style={{ color: colorPrimary, fontSize: 18 }} />
      <Text strong style={{ fontSize: 15 }}>AI 对话</Text>
      <Divider type="vertical" />
      <Select
        placeholder="选择配置"
        value={configId}
        onChange={handleConfigChange}
        style={{ width: 160 }}
        size="small"
        options={configs.map(c => ({ value: c.id, label: c.name }))}
      />
      <Select
        placeholder="选择模型"
        value={model || undefined}
        onChange={setModel}
        style={{ width: 180 }}
        size="small"
        options={currentModels.map(m => ({ value: m, label: m }))}
      />
      {configs.length === 0 && (
        <Tag color="warning">请先在「配置管理」中添加 AI 配置</Tag>
      )}
    </div>
  );

  /** 消息气泡 */
  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <div key={msg.id} style={{
        display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16, gap: 10, alignItems: 'flex-start',
      }}>
        {!isUser && (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}bb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
        )}
        <div style={{
          maxWidth: '72%',
          background: isUser
            ? `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)`
            : (darkMode ? 'rgba(255,255,255,0.06)' : token.colorBgLayout),
          color: isUser ? '#fff' : token.colorText,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          fontSize: 14, lineHeight: 1.7,
          border: isUser ? 'none' : `1px solid ${token.colorBorderSecondary}`,
          boxShadow: isUser ? `0 4px 12px ${colorPrimary}33` : 'none',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content || (msg.streaming ? <Spin size="small" /> : '')}
          {msg.streaming && msg.content && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: 'currentColor', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
          )}
        </div>
        {isUser && (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: token.colorBgLayout, border: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ color: token.colorTextSecondary, fontSize: 16 }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 222px)', minHeight: 500 }}>
      {renderToolbar()}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        tabBarStyle={{ padding: '0 16px', marginBottom: 0, flexShrink: 0 }}
        items={[
          {
            key: 'chat',
            label: <Space><ThunderboltOutlined />对话</Space>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* 消息区域 */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '20px 24px',
                  background: darkMode ? token.colorBgLayout : '#fafafa',
                }}>
                  {messages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                      <RobotOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
                      <Text type="secondary">选择配置和模型，开始对话</Text>
                    </div>
                  ) : (
                    messages.map(renderMessage)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                }}>
                  <Button
                    size="small" type="text" icon={<ClearOutlined />}
                    onClick={() => setMessages([])}
                    style={{ color: token.colorTextTertiary, flexShrink: 0 }}
                    title="清空对话"
                  />
                  <TextArea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                    autoSize={{ minRows: 1, maxRows: 5 }}
                    style={{ flex: 1, resize: 'none' }}
                    disabled={loading}
                  />
                  {loading ? (
                    <Button danger onClick={handleStop} style={{ flexShrink: 0 }}>停止</Button>
                  ) : (
                    <Button
                      type="primary" icon={<SendOutlined />} onClick={handleSend}
                      disabled={!input.trim() || !configId || !model}
                      style={{ flexShrink: 0, background: colorPrimary, borderColor: colorPrimary }}
                    >
                      发送
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'embedding',
            label: <Space><ThunderboltOutlined />Embedding 测试</Space>,
            children: (
              <div style={{ padding: 24, maxWidth: 700 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  输入文本，调用 Embedding 接口获取向量表示（仅展示维度和前10个值）
                </Text>
                <TextArea
                  value={embInput}
                  onChange={e => setEmbInput(e.target.value)}
                  placeholder="输入要向量化的文本..."
                  rows={4}
                  style={{ marginBottom: 12 }}
                />
                <Button
                  type="primary" loading={embLoading} onClick={handleEmbedding}
                  disabled={!embInput.trim() || !configId || !model}
                  style={{ background: colorPrimary, borderColor: colorPrimary }}
                >
                  获取 Embedding
                </Button>

                {embResult && (
                  <div style={{
                    marginTop: 20, padding: 16, borderRadius: 8,
                    background: darkMode ? 'rgba(255,255,255,0.04)' : token.colorBgLayout,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color="green">✓ 成功</Tag>
                        <Text>模型：<Text code>{embResult.model}</Text></Text>
                        <Text>维度：<Text strong style={{ color: colorPrimary }}>{embResult.dimension}</Text></Text>
                      </Space>
                      {embResult.usage && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Token 用量：{embResult.usage.prompt_tokens ?? embResult.usage.total_tokens ?? '-'}
                        </Text>
                      )}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>前 10 个维度值：</Text>
                        <div style={{
                          marginTop: 6, padding: '8px 12px', borderRadius: 6,
                          background: darkMode ? '#0d1117' : '#f6f8fa',
                          fontFamily: 'monospace', fontSize: 12,
                          overflowX: 'auto', whiteSpace: 'nowrap',
                        }}>
                          [{embResult.preview?.map((v: number) => v.toFixed(6)).join(', ')}...]
                        </div>
                      </div>
                    </Space>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'config',
            label: <Space><SettingOutlined />配置管理</Space>,
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
      `}</style>
    </div>
  );
};

export default AiChat;
