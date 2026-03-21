'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Button, Space, Tag, Typography, Popconfirm, Tooltip, theme, Anchor } from 'antd';
import { EditOutlined, DeleteOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/frontend/context/ThemeContext';

const { Title, Text } = Typography;

interface Note {
  id: number;
  title: string;
  content?: string;
  tags?: string;
  pinned: number;
  updatedAt: string;
  category?: { id: number; name: string };
}

interface HeadingItem {
  id: string;
  title: string;
  level: number;
}

interface Props {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

// 从 markdown 文本提取标题（跳过代码块内容）
function extractHeadings(content: string): HeadingItem[] {
  const lines = content.split('\n');
  const headings: HeadingItem[] = [];
  const counter: Record<string, number> = {};
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const baseId = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      counter[baseId] = (counter[baseId] || 0) + 1;
      const id = counter[baseId] > 1 ? `${baseId}-${counter[baseId]}` : baseId;
      headings.push({ id, title: text, level });
    }
  }
  return headings;
}

const DocNoteViewer: React.FC<Props> = ({ note, onEdit, onDelete, onTogglePin }) => {
  const { token } = theme.useToken();
  const { darkMode } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => extractHeadings(note.content || ''), [note.content]);

  // 渲染完成后直接给 DOM 里的标题元素按顺序打 id
  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return;
    const els = contentRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let idx = 0;
    els.forEach(el => {
      if (idx < headings.length) {
        el.id = headings[idx].id;
        idx++;
      }
    });
  }, [note.content, headings]);

  const codeRenderer = ({ node, inline, className, children, ...props }: any) => {const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={darkMode ? oneDark : oneLight}
        language={match[1]}
        PreTag="div"
        customStyle={{ borderRadius: 8, fontSize: 13, margin: '0.6em 0' }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code style={{
        background: 'rgba(128,128,128,0.12)', padding: '2px 6px',
        borderRadius: 4, fontSize: '0.9em', fontFamily: 'Fira Code, Consolas, monospace'
      }} {...props}>
        {children}
      </code>
    );
  };

  const [outlineWidth, setOutlineWidth] = useState(200);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onDragStart = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = outlineWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      setOutlineWidth(Math.max(120, Math.min(400, startWidthRef.current + delta)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // 给标题加 id：渲染后由 useEffect 直接操作 DOM，不在渲染时干预

  const anchorItems = headings.map(h => ({
    key: h.id,
    href: `#${h.id}`,
    title: (
      <span style={{ paddingLeft: (h.level - 1) * 10, fontSize: 12 }}>
        {h.title}
      </span>
    ),
  }));

  const borderColor = token.colorBorderSecondary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer }}>
      {/* 标题栏 */}
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={4} style={{ margin: 0, lineHeight: '32px' }} ellipsis>{note.title}</Title>
          <Space size={6} style={{ marginTop: 4 }}>
            {note.category && <Tag color="blue" style={{ margin: 0 }}>{note.category.name}</Tag>}
            {note.tags?.split(',').filter(Boolean).map(t => <Tag key={t} style={{ margin: 0 }}>{t.trim()}</Tag>)}
            <Text type="secondary" style={{ fontSize: 11 }}>
              最后更新：{new Date(note.updatedAt).toLocaleString()}
            </Text>
          </Space>
        </div>
        <Space style={{ flexShrink: 0 }}>
          <Tooltip title={note.pinned ? '取消置顶' : '置顶'}>
            <Button type="text" icon={note.pinned ? <PushpinFilled style={{ color: token.colorPrimary }} /> : <PushpinOutlined />} onClick={onTogglePin} />
          </Tooltip>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>编辑</Button>
          <Popconfirm title="确认删除这篇笔记？" onConfirm={onDelete} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 内容区：大纲 + 正文 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* 左侧大纲 */}
        {anchorItems.length > 0 && (
          <>
            <div style={{
              width: outlineWidth, flexShrink: 0,
              borderRight: 'none',
              padding: '16px 8px',
              overflow: 'auto',
              minWidth: 0,
            }}>
              <Text type="secondary" style={{ fontSize: 11, padding: '0 8px', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>大纲</Text>
              <Anchor
                affix={false}
                className="doc-outline"
                getContainer={() => contentRef.current || window as any}
                onClick={(e, link) => {
                  e.preventDefault();
                  const id = link.href.split('#')[1];
                  const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
                  if (el && contentRef.current) {
                    const containerRect = contentRef.current.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    const offset = elRect.top - containerRect.top + contentRef.current.scrollTop - 16;
                    contentRef.current.scrollTo({ top: offset, behavior: 'smooth' });
                  }
                }}
                items={anchorItems}
                style={{ fontSize: 12 }}
              />
            </div>
            {/* 拖拽分隔条 */}
            <div
              onMouseDown={onDragStart}
              style={{
                width: 4, flexShrink: 0, cursor: 'col-resize',
                background: borderColor,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = token.colorPrimary)}
              onMouseLeave={e => (e.currentTarget.style.background = borderColor)}
            />
          </>
        )}

        {/* 正文 */}
        <div ref={contentRef} style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
          <div className="doc-markdown-body" style={{ lineHeight: 1.8, color: token.colorText, fontSize: token.fontSize }}>
            {note.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ code: codeRenderer }}
              >
                {note.content}
              </ReactMarkdown>
            ) : (
              <Text type="secondary">暂无内容，点击编辑添加内容。</Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocNoteViewer;
