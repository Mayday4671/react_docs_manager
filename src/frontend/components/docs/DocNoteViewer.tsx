/**
 * @file DocNoteViewer.tsx
 * @description 文档笔记查看器组件，支持 Markdown 渲染和 Word 文档（docx）在线预览
 * @module 文档笔记
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
import { Button, Space, Tag, Typography, Popconfirm, Tooltip, theme, Anchor, Image, Dropdown, App } from 'antd';
import { EditOutlined, DeleteOutlined, PushpinOutlined, PushpinFilled, DownloadOutlined, FilePdfOutlined, FileWordOutlined, LoadingOutlined, FileTextOutlined } from '@ant-design/icons';
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
  const { message: messageApi } = App.useApp();

  /** 正文滚动容器的 ref，用于大纲点击时精确计算滚动偏移量 */
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // ── docx 渲染相关 ──────────────────────────────────────────
  /** mammoth 转换后的 HTML 字符串，仅 fileType='docx' 时使用 */
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  /** 是否为 Word 文档类型 */
  const isDocx = note.fileType === 'docx';

  /**
   * 当笔记切换或内容变化时，若为 docx 类型则触发转换。
   *
   * 转换流程：
   *   1. base64 → Uint8Array → ArrayBuffer
   *   2. mammoth.convertToHtml，图片内嵌为 base64 data URL
   *   3. 用 DOMParser 解析 HTML，给所有标题元素直接注入 id（避免两步时序问题）
   *   4. 序列化回 HTML 字符串存入 state
   */
  useEffect(() => {
    if (!isDocx || !note.content) { setDocxHtml(null); return; }
    (async () => {
      try {
        const binary = atob(note.content!);
        const buf = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);

        const result = await mammoth.convertToHtml(
          { arrayBuffer: buf.buffer },
          {
            convertImage: mammoth.images.imgElement(img =>
              img.read('base64').then(d => ({ src: `data:${img.contentType};base64,${d}` }))
            ),
          },
        );

        // 直接在 HTML 字符串里注入标题 id，避免依赖后续 DOM effect 的时序
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.value, 'text/html');
        const counter: Record<string, number> = {};
        doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(el => {
          const text = el.textContent?.trim() || '';
          const baseId = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
          counter[baseId] = (counter[baseId] || 0) + 1;
          el.id = counter[baseId] > 1 ? `${baseId}-${counter[baseId]}` : baseId;
        });
        // 只取 body 内容，去掉 DOMParser 自动补全的 html/head/body 包装
        setDocxHtml(doc.body.innerHTML);
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
   * 切换文档时，正文区域滚动位置重置到顶部
   */
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [note.id]);

  /**
   * 渲染完成后，给正文中的标题元素按顺序打上 id（仅 markdown 需要）。
   * docx 的标题 id 已在 mammoth 转换时直接注入 HTML，无需此步骤。
   */
  useEffect(() => {
    if (isDocx || !contentRef.current || headings.length === 0) return;
    const els = contentRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let idx = 0;
    els.forEach(el => {
      if (idx < headings.length) {
        el.id = headings[idx].id;
        idx++;
      }
    });
  }, [note.content, headings, isDocx]);

  /**
   * 切换文档时，正文区域滚动位置重置到顶部
   */
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [note.id]);

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

  // ── 图片预览 ──────────────────────────────────────────────
  /** 当前预览的图片 src，null 表示未打开预览 */
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  /** 预览图片列表（docx 内所有图片），用于支持翻页 */
  const [previewList, setPreviewList] = useState<string[]>([]);
  /** 当前预览图片在列表中的索引 */
  const [previewIndex, setPreviewIndex] = useState(0);

  /**
   * docxHtml 渲染完成后，在容器上用事件委托监听图片点击。
   * 收集所有图片 src 构建预览列表，点击 img 时定位到对应索引。
   * 使用事件委托而非逐个绑定，避免 dangerouslySetInnerHTML 重渲染后事件丢失。
   */
  useEffect(() => {
    if (!isDocx || !docxHtml || !contentRef.current) return;
    const container = contentRef.current;

    // 收集所有图片，构建预览列表
    const timer = setTimeout(() => {
      const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('.doc-word-body img'));
      setPreviewList(imgs.map(img => img.src));
    }, 100);

    // 事件委托：在容器上监听点击，判断目标是否为 img
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'IMG') return;
      const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('.doc-word-body img'));
      const srcs = imgs.map(img => img.src);
      const idx = imgs.indexOf(target as HTMLImageElement);
      if (idx === -1) return;
      setPreviewList(srcs);
      setPreviewIndex(idx);
      setPreviewSrc(srcs[idx]);
    };

    container.addEventListener('click', handleClick);
    return () => {
      clearTimeout(timer);
      container.removeEventListener('click', handleClick);
    };
  }, [isDocx, docxHtml]);
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

  // ── 导出功能 ──────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const el = contentRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: token.colorBgContainer,
        scrollY: 0,
        height: el.scrollHeight,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, imgW, imgH);
        y += pageH;
      }

      pdf.save(`${note.title}.pdf`);
      messageApi.success('PDF 导出成功');
    } catch (e: any) {
      messageApi.error(`导出失败: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  // 导出原始文件，用真实后缀还原文件名
  const handleExportOriginal = () => {
    if (!note.content) { messageApi.warning('笔记内容为空'); return; }

    const ext = note.fileType || 'md';

    if (ext === 'docx') {
      // docx：base64 → 二进制 → 下载
      const binary = atob(note.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${note.title}.docx`; a.click();
      URL.revokeObjectURL(url);
    } else {
      // 其他所有格式（md、txt、sh、bat、xlsx 等）：直接下载文本内容，用原始后缀
      const mimeMap: Record<string, string> = {
        sh: 'text/x-sh',
        bat: 'text/x-bat',
        txt: 'text/plain',
        md: 'text/markdown',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
      };
      const mime = mimeMap[ext] || 'text/plain';
      const blob = new Blob([note.content], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${note.title}.${ext}`; a.click();
      URL.revokeObjectURL(url);
    }
    messageApi.success('导出成功');
  };

  const handleExportWord = async () => {
    if (!note.content) return;
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const lines = (note.content || '').split('\n');
      const children: any[] = [];

      for (const line of lines) {
        const h = line.match(/^(#{1,6})\s+(.+)/);
        if (h) {
          const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
          children.push(new Paragraph({ text: h[2], heading: levels[h[1].length - 1] }));
        } else if (line.trim() === '') {
          children.push(new Paragraph({ text: '' }));
        } else {
          children.push(new Paragraph({ children: [new TextRun(line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1'))] }));
        }
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${note.title}.docx`; a.click();
      URL.revokeObjectURL(url);
      messageApi.success('Word 导出成功');
    } catch (e: any) {
      messageApi.error(`导出失败: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

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
          <Dropdown
            menu={{
              items: [
                {
                  key: 'original',
                  label: `下载原文件 (.${note.fileType || 'md'})`,
                  icon: note.fileType === 'docx' ? <FileWordOutlined /> : <FileTextOutlined />,
                  onClick: handleExportOriginal,
                },
                { type: 'divider' },
                { key: 'pdf', label: '导出为 PDF', icon: <FilePdfOutlined />, onClick: handleExportPDF },
                ...(note.fileType !== 'docx' ? [{ key: 'word', label: '转换为 Word (.docx)', icon: <FileWordOutlined />, onClick: handleExportWord }] : []),
              ],
            }}
            disabled={exporting}
          >
            <Button icon={exporting ? <LoadingOutlined /> : <DownloadOutlined />}>
              导出
            </Button>
          </Dropdown>
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
                key={note.id}
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

      {/* ── 图片预览弹窗（docx 内图片点击触发，支持放大缩小、翻页） ── */}
      {previewSrc && (
        <div style={{ display: 'none' }}>
          {/* Image.PreviewGroup 提供多图翻页能力，current 控制当前显示索引 */}
          <Image.PreviewGroup
            preview={{
              visible: true,
              current: previewIndex,
              onChange: idx => setPreviewIndex(idx),
              onVisibleChange: visible => { if (!visible) setPreviewSrc(null); },
            }}
          >
            {previewList.map((src, i) => (
              <Image key={i} src={src} alt={`图片${i + 1}`} />
            ))}
          </Image.PreviewGroup>
        </div>
      )}
    </div>
  );
};

export default DocNoteViewer;
