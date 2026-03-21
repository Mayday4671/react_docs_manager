/**
 * 文档笔记查看器组件
 *
 * 负责渲染笔记内容，支持两种内容类型：
 *   - markdown（fileType = 'md' 或未设置）：使用 ReactMarkdown + Prism 代码高亮渲染
 *   - Word 文档（fileType = 'docx'）：content 为 base64 编码的 docx 文件，
 *     通过 mammoth 在浏览器端实时转换为 HTML 渲染，图片以 base64 内嵌保留
 *
 * 功能特性：
 *   - 左侧大纲导航（支持拖拽调整宽度 120px ~ 400px）
 *   - 大纲点击精确滚动定位
 *   - 代码块一键复制
 *   - 置顶、编辑、删除操作
 */

'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Button, Space, Tag, Typography, Popconfirm, Tooltip, theme, Anchor } from 'antd';
import { EditOutlined, DeleteOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/frontend/context/ThemeContext';
import mammoth from 'mammoth';

const { Title, Text } = Typography;

/** 笔记数据结构 */
interface Note {
  id: number;
  title: string;
  /** markdown 文本 或 docx 文件的 base64 编码 */
  content?: string;
  /** 文件类型标识：'md' | 'docx'，决定内容的渲染方式 */
  fileType?: string;
  tags?: string;
  /** 是否置顶：1-置顶 0-普通 */
  pinned: number;
  updatedAt: string;
  category?: { id: number; name: string };
}

/** 大纲条目结构 */
interface HeadingItem {
  /** 用于锚点跳转的 DOM id，由标题文本生成 */
  id: string;
  /** 标题显示文本 */
  title: string;
  /** 标题层级：1~6 对应 h1~h6 */
  level: number;
}

/** 组件 Props */
interface Props {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

/**
 * 从 markdown 文本中提取标题列表，用于生成大纲。
 *
 * 处理逻辑：
 *   - 跳过代码块（``` 包裹的内容）内的 # 符号，避免 shell 注释被误识别为标题
 *   - 同名标题自动加数字后缀（如 foo、foo-2、foo-3），保证 id 唯一
 *
 * @param content markdown 原始文本
 * @returns 标题列表，按文档顺序排列
 */
function extractHeadings(content: string): HeadingItem[] {
  const lines = content.split('\n');
  const headings: HeadingItem[] = [];
  const counter: Record<string, number> = {}; // 记录各 baseId 出现次数，用于去重
  let inCodeBlock = false;

  for (const line of lines) {
    // 检测代码块开始/结束（``` 开头的行）
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // 将标题文本转为合法的 DOM id：小写、非字母数字汉字替换为连字符
      const baseId = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      counter[baseId] = (counter[baseId] || 0) + 1;
      const id = counter[baseId] > 1 ? `${baseId}-${counter[baseId]}` : baseId;
      headings.push({ id, title: text, level });
    }
  }
  return headings;
}

/**
 * 带一键复制按钮的代码块组件
 *
 * 鼠标悬停时右上角显示"复制"按钮，点击后调用 Clipboard API 写入剪贴板，
 * 2 秒后按钮文字恢复为"复制"。
 */
const CodeBlock: React.FC<{ code: string; language: string; darkMode: boolean }> = ({ code, language, darkMode }) => {
  const [copied, setCopied] = useState(false);
  const { token } = theme.useToken();

  /** 将代码写入系统剪贴板，成功后短暂显示"已复制"反馈 */
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{ position: 'relative', margin: '0.6em 0' }}
      // 鼠标进入/离开时控制复制按钮的显隐（通过 opacity 实现平滑过渡）
      onMouseEnter={e => {
        const btn = e.currentTarget.querySelector<HTMLElement>('.copy-btn');
        if (btn) btn.style.opacity = '1';
      }}
      onMouseLeave={e => {
        const btn = e.currentTarget.querySelector<HTMLElement>('.copy-btn');
        if (btn) btn.style.opacity = '0';
      }}
    >
      {/* 复制按钮：绝对定位在代码块右上角，默认透明，悬停时显示 */}
      <button
        className="copy-btn"
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1,
          opacity: 0, transition: 'opacity 0.15s',
          background: copied ? token.colorSuccess : token.colorBgElevated,
          color: copied ? '#fff' : token.colorTextSecondary,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 4, padding: '2px 8px', fontSize: 11,
          cursor: 'pointer', lineHeight: '20px',
        }}
      >
        {copied ? '已复制' : '复制'}
      </button>

      {/* Prism 语法高亮渲染器，根据当前主题切换明暗配色 */}
      <SyntaxHighlighter
        style={darkMode ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{ borderRadius: 8, fontSize: 13, margin: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const DocNoteViewer: React.FC<Props> = ({ note, onEdit, onDelete, onTogglePin }) => {
  const { token } = theme.useToken();
  const { darkMode } = useTheme();

  /** 正文滚动容器的 ref，用于大纲点击时精确计算滚动偏移量 */
  const contentRef = useRef<HTMLDivElement>(null);

  // ── docx 渲染相关 ──────────────────────────────────────────
  /** mammoth 转换后的 HTML 字符串，仅 fileType='docx' 时使用 */
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  /** 是否为 Word 文档类型 */
  const isDocx = note.fileType === 'docx';

  /**
   * 当笔记切换或内容变化时，若为 docx 类型则触发转换。
   *
   * 转换流程：
   *   1. 将 base64 字符串解码为 Uint8Array（二进制数据）
   *   2. 调用 mammoth.convertToHtml，配置图片转换器将图片内嵌为 base64 data URL
   *   3. 将转换结果存入 docxHtml state，触发重渲染
   */
  useEffect(() => {
    if (!isDocx || !note.content) { setDocxHtml(null); return; }
    (async () => {
      try {
        // base64 → 二进制 → ArrayBuffer
        const binary = atob(note.content!);
        const buf = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);

        const result = await mammoth.convertToHtml(
          { arrayBuffer: buf.buffer },
          {
            // 将文档内嵌图片转为 base64 data URL，避免图片丢失
            convertImage: mammoth.images.imgElement(img =>
              img.read('base64').then(d => ({ src: `data:${img.contentType};base64,${d}` }))
            ),
          },
        );
        setDocxHtml(result.value);
      } catch {
        setDocxHtml('<p>文档解析失败</p>');
      }
    })();
  }, [note.id, note.content, isDocx]);

  // ── 大纲提取 ──────────────────────────────────────────────
  /**
   * 根据内容类型提取标题列表：
   *   - docx：从 mammoth 转换后的 HTML DOM 中查询 h1~h6 元素
   *   - markdown：调用 extractHeadings 解析文本
   *
   * 依赖 docxHtml 变化，确保 docx 转换完成后大纲才更新。
   */
  const headings = useMemo(() => {
    if (isDocx && docxHtml) {
      // 创建临时 DOM 节点解析 HTML，提取标题元素
      const div = document.createElement('div');
      div.innerHTML = docxHtml;
      const els = div.querySelectorAll('h1,h2,h3,h4,h5,h6');
      const counter: Record<string, number> = {};
      return Array.from(els).map(el => {
        const level = parseInt(el.tagName[1]);
        const text = el.textContent?.trim() || '';
        const baseId = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
        counter[baseId] = (counter[baseId] || 0) + 1;
        const id = counter[baseId] > 1 ? `${baseId}-${counter[baseId]}` : baseId;
        return { id, title: text, level };
      });
    }
    return extractHeadings(note.content || '');
  }, [note.content, isDocx, docxHtml]);

  /**
   * 渲染完成后，通过 DOM 操作给正文中的标题元素按顺序打上 id。
   *
   * 不在 ReactMarkdown 的 components 里直接设置 id，是为了避免
   * React 重渲染时计数器错位导致 id 与大纲不对应的问题。
   */
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

  // ── 代码块渲染器 ──────────────────────────────────────────
  /**
   * ReactMarkdown 的自定义 code 渲染器。
   *
   * 判断逻辑：
   *   - 有语言标识（```bash 等）且非行内代码 → 使用 CodeBlock 组件（带高亮和复制按钮）
   *   - 行内代码（`code`）→ 使用简单 <code> 标签
   */
  const codeRenderer = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      const code = String(children).replace(/\n$/, '');
      return <CodeBlock code={code} language={match[1]} darkMode={darkMode} />;
    }
    return (
      <code
        style={{
          background: 'rgba(128,128,128,0.12)', padding: '2px 6px',
          borderRadius: 4, fontSize: '0.9em', fontFamily: 'Fira Code, Consolas, monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  };

  // ── 大纲拖拽缩放 ──────────────────────────────────────────
  /** 大纲面板当前宽度（px），范围 120~400 */
  const [outlineWidth, setOutlineWidth] = useState(200);
  const draggingRef = useRef(false);    // 是否正在拖拽
  const startXRef = useRef(0);          // 拖拽开始时的鼠标 X 坐标
  const startWidthRef = useRef(0);      // 拖拽开始时的大纲宽度

  /**
   * 大纲分隔条拖拽开始处理器。
   *
   * 在 document 上注册 mousemove / mouseup 监听，拖拽结束后自动清理，
   * 避免鼠标移出组件范围时拖拽失效。
   */
  const onDragStart = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = outlineWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 拖拽期间禁止文字选中

    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      // 限制宽度在 120px ~ 400px 之间
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

  // ── 大纲 Anchor 配置 ──────────────────────────────────────
  /** 将 headings 转换为 Ant Design Anchor 组件所需的 items 格式 */
  const anchorItems = headings.map(h => ({
    key: h.id,
    href: `#${h.id}`,
    title: (
      // 根据标题层级缩进，视觉上体现层次结构
      <span style={{ paddingLeft: (h.level - 1) * 10, fontSize: 12 }}>
        {h.title}
      </span>
    ),
  }));

  const borderColor = token.colorBorderSecondary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer }}>
      {/* ── 顶部标题栏 ── */}
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={4} style={{ margin: 0, lineHeight: '32px' }} ellipsis>{note.title}</Title>
          <Space size={6} style={{ marginTop: 4 }}>
            {/* 所属分类标签 */}
            {note.category && <Tag color="blue" style={{ margin: 0 }}>{note.category.name}</Tag>}
            {/* 自定义标签列表，逗号分隔后逐个渲染 */}
            {note.tags?.split(',').filter(Boolean).map(t => (
              <Tag key={t} style={{ margin: 0 }}>{t.trim()}</Tag>
            ))}
            <Text type="secondary" style={{ fontSize: 11 }}>
              最后更新：{new Date(note.updatedAt).toLocaleString()}
            </Text>
          </Space>
        </div>
        <Space style={{ flexShrink: 0 }}>
          <Tooltip title={note.pinned ? '取消置顶' : '置顶'}>
            <Button
              type="text"
              icon={note.pinned
                ? <PushpinFilled style={{ color: token.colorPrimary }} />
                : <PushpinOutlined />}
              onClick={onTogglePin}
            />
          </Tooltip>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>编辑</Button>
          <Popconfirm
            title="确认删除这篇笔记？"
            onConfirm={onDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* ── 内容区：左侧大纲 + 拖拽条 + 右侧正文 ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* 左侧大纲面板（仅有标题时显示） */}
        {anchorItems.length > 0 && (
          <>
            <div style={{
              width: outlineWidth, flexShrink: 0,
              padding: '16px 8px',
              overflow: 'auto',
              minWidth: 0,
            }}>
              <Text type="secondary" style={{
                fontSize: 11, padding: '0 8px', display: 'block',
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                大纲
              </Text>
              <Anchor
                affix={false}
                className="doc-outline"
                // 指定滚动容器为正文区域，而非 window
                getContainer={() => contentRef.current || window as any}
                onClick={(e, link) => {
                  e.preventDefault();
                  const id = link.href.split('#')[1];
                  const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
                  if (el && contentRef.current) {
                    // 计算目标元素相对于滚动容器顶部的偏移量，减 16px 留出视觉间距
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

            {/* 拖拽分隔条：鼠标按下触发 onDragStart，悬停时高亮 */}
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

        {/* 正文滚动区域 */}
        <div ref={contentRef} style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
          <div
            className="doc-markdown-body"
            style={{ lineHeight: 1.8, color: token.colorText, fontSize: token.fontSize }}
          >
            {note.content ? (
              isDocx ? (
                // docx 类型：渲染 mammoth 转换后的 HTML
                docxHtml
                  ? <div className="doc-word-body" dangerouslySetInnerHTML={{ __html: docxHtml }} />
                  : <Text type="secondary">解析中...</Text>
              ) : (
                // markdown 类型：使用 ReactMarkdown 渲染，代码块使用自定义 CodeBlock
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: codeRenderer }}>
                  {note.content}
                </ReactMarkdown>
              )
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
