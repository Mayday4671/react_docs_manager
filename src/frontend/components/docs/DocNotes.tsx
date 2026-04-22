/**
 * @file DocNotes.tsx
 * @description 文档笔记主页面组件，整体布局为左侧文件树（分类+笔记）+ 右侧内容区（查看器/编辑器）
 * @module 文档笔记
 *
 * 主要功能：
 *   - 分类管理：新建、编辑、软删除
 *   - 笔记管理：新建、编辑、删除、置顶
 *   - 关键词搜索（标题 + 内容）
 *   - 批量导入：支持拖拽文件/文件夹，支持 md/txt/sh/bat/docx/xlsx 格式
 *     - .sh/.bat 自动包裹为 markdown 代码块
 *     - .xlsx/.xls 转换为 markdown 表格
 *     - .docx 以 base64 存储，viewer 端实时解析渲染
 *     - 文件夹拖拽时自动以文件夹名创建/匹配分类
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Layout, Tree, Button, Input, Modal, Form, Select, Typography,
  Tooltip, Dropdown, App, Empty, Spin, theme,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, FolderOutlined,
  FileTextOutlined, FolderAddOutlined, MoreOutlined, FileAddOutlined, UploadOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import DocNoteEditor from './DocNoteEditor';
import DocNoteViewer from './DocNoteViewer';

const { Content } = Layout;
const { Text } = Typography;
const { Search } = Input;

// ── 类型定义 ──────────────────────────────────────────────────

/** 文档分类数据结构 */
interface Category {
  id: number;
  name: string;
  /** 父分类 ID，undefined 表示顶级分类 */
  parentId?: number;
  /** 子分类列表（由后端关联查询返回） */
  children?: Category[];
}

/** 文档笔记数据结构（列表项，不含完整 content） */
interface Note {
  id: number;
  title: string;
  /** markdown 文本 或 docx base64，列表接口也会返回（用于搜索） */
  content?: string;
  categoryId: number;
  tags?: string;
  /** 是否置顶：1-置顶 0-普通 */
  pinned: number;
  updatedAt: string;
  category?: { id: number; name: string };
}

// ── 常量 ──────────────────────────────────────────────────────

/** 树节点 key 前缀：分类节点 */
const CAT_PREFIX = 'cat-';
/** 树节点 key 前缀：笔记节点 */
const NOTE_PREFIX = 'note-';

// ── 工具函数 ──────────────────────────────────────────────────

/**
 * 将 Excel 文件（xlsx/xls）转换为 markdown 表格字符串。
 *
 * 处理逻辑：
 *   - 使用 FileReader 以 binary string 方式读取文件
 *   - 通过 SheetJS 解析工作簿，遍历每个 Sheet
 *   - 每个 Sheet 生成一个二级标题 + markdown 表格
 *   - 单元格内容中的 | 字符转义为 \|，避免破坏表格结构
 *
 * @param file xlsx 或 xls 文件对象
 * @returns 包含所有 Sheet 内容的 markdown 字符串
 */
function xlsxToMarkdown(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target!.result, { type: 'binary' });
        const parts: string[] = [];

        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          // header: 1 表示返回二维数组，defval: '' 表示空单元格填充空字符串
          const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
          if (!rows.length) return;

          // Sheet 名作为二级标题
          parts.push(`## ${name}\n`);

          // 第一行作为表头
          const header = rows[0].map(c => String(c));
          parts.push('| ' + header.join(' | ') + ' |');
          parts.push('| ' + header.map(() => '---').join(' | ') + ' |');

          // 其余行作为数据行
          rows.slice(1).forEach(row => {
            parts.push(
              '| ' + header.map((_, i) => String(row[i] ?? '').replace(/\|/g, '\\|')).join(' | ') + ' |',
            );
          });
          parts.push('');
        });

        resolve(parts.join('\n'));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── 主组件 ────────────────────────────────────────────────────

const DocNotes: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp(); // 使用 App.useApp() 获取 message 实例，避免静态调用警告

  // ── State ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  /** 当前选中的笔记 ID，null 表示未选中 */
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  /** 右侧内容区模式：view-查看 edit-编辑 new-新建 */
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  /** 新建笔记时预填的分类 ID（从左侧树点击"新建笔记"时传入） */
  const [newNoteCategoryId, setNewNoteCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  /** 树节点展开状态，存储展开的节点 key 列表 */
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // 分类弹窗相关
  const [catModalOpen, setCatModalOpen] = useState(false);
  /** 当前正在编辑的分类，null 表示新建模式 */
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm] = Form.useForm();

  // 导入弹窗相关
  const [importModalOpen, setImportModalOpen] = useState(false);
  /** 导入时手动选择的目标分类（仅非文件夹导入时需要） */
  const [importCategoryId, setImportCategoryId] = useState<number | undefined>();
  /** 待导入的文件列表 */
  const [importFiles, setImportFiles] = useState<File[]>([]);
  /** 是否正在执行导入，用于禁用按钮防止重复提交 */
  const [importing, setImporting] = useState(false);
  /** 拖拽悬停状态，用于高亮拖拽区域 */
  const [isDragOver, setIsDragOver] = useState(false);
  /** 隐藏的 file input 元素 ref，用于点击触发文件选择 */
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  /** 当前选中的笔记对象（从 allNotes 中查找） */
  const selectedNote = useMemo(
    () => allNotes.find(n => n.id === selectedNoteId) || null,
    [allNotes, selectedNoteId],
  );

  // ── 数据加载 ──────────────────────────────────────────────

  /** 从服务端拉取分类列表并更新 state */
  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/doc-categories');
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }, []);

  /** 从服务端拉取全量笔记列表并更新 state */
  const loadAllNotes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/doc-notes');
    const json = await res.json();
    if (json.success) setAllNotes(json.data);
    setLoading(false);
  }, []);

  /** 组件挂载时初始化加载分类和笔记 */
  useEffect(() => {
    loadCategories();
    loadAllNotes();
  }, [loadCategories, loadAllNotes]);

  // ── 树数据构建 ────────────────────────────────────────────

  /**
   * 将分类和笔记数据组合为 Ant Design Tree 所需的 DataNode 树结构。
   *
   * 结构规则：
   *   - 顶级分类作为根节点
   *   - 子分类作为父分类的子节点
   *   - 笔记作为所属分类的叶子节点
   *   - 节点 key 格式：分类用 "cat-{id}"，笔记用 "note-{id}"
   */
  const treeData = useMemo(() => {
    // 按分类 ID 分组笔记，方便后续快速查找
    const notesByCat: Record<number, Note[]> = {};
    allNotes.forEach(n => {
      if (!notesByCat[n.categoryId]) notesByCat[n.categoryId] = [];
      notesByCat[n.categoryId].push(n);
    });

    /** 递归构建分类节点（含子分类和笔记） */
    const buildCatNode = (cat: Category): DataNode => {
      const catNotes = notesByCat[cat.id] || [];
      const noteNodes: DataNode[] = catNotes.map(note => ({
        key: `${NOTE_PREFIX}${note.id}`,
        isLeaf: true,
        icon: <FileTextOutlined style={{ color: token.colorTextSecondary }} />,
        title: note.title,
      }));
      const subCatNodes = (cat.children || []).map(buildCatNode);
      return {
        key: `${CAT_PREFIX}${cat.id}`,
        icon: <FolderOutlined />,
        title: cat.name,
        children: [...subCatNodes, ...noteNodes],
      };
    };

    // 只渲染顶级分类（parentId 为空），子分类由 buildCatNode 递归处理
    return categories.filter(c => !c.parentId).map(buildCatNode);
  }, [categories, allNotes, token]);

  // ── 事件处理 ──────────────────────────────────────────────

  /**
   * 树节点点击处理器。
   *
   * 笔记节点：切换右侧为查看模式并显示对应笔记。
   * 分类节点：切换展开/折叠状态（不触发内容区变化）。
   */
  const handleTreeSelect = useCallback((keys: React.Key[], info: any) => {
    const key = (keys.length > 0 ? keys[0] : info.node.key) as string;
    if (!key) return;
    if (key.startsWith(NOTE_PREFIX)) {
      const noteId = parseInt(key.replace(NOTE_PREFIX, ''));
      setSelectedNoteId(noteId);
      setMode('view');
    } else if (key.startsWith(CAT_PREFIX)) {
      // 分类节点点击时切换展开状态
      setExpandedKeys(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
      );
    }
  }, []);

  /** 删除笔记，成功后若当前正在查看该笔记则清空选中状态 */
  const handleDeleteNote = async (id: number) => {
    const res = await fetch(`/api/doc-notes?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      message.success('删除成功');
      if (selectedNoteId === id) setSelectedNoteId(null);
      loadAllNotes();
    }
  };

  /** 软删除分类，成功后刷新分类和笔记列表 */
  const handleDeleteCat = async (id: number) => {
    const res = await fetch(`/api/doc-categories?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) { message.success('删除成功'); loadCategories(); loadAllNotes(); }
  };

  /** 打开编辑分类弹窗，预填当前分类数据 */
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    catForm.setFieldsValue(cat);
    setCatModalOpen(true);
  };

  /** 保存分类（新建或编辑），成功后关闭弹窗并刷新列表 */
  const handleSaveCat = async () => {
    const values = await catForm.validateFields();
    const method = editingCat ? 'PUT' : 'POST';
    const body = editingCat ? { id: editingCat.id, ...values } : values;
    const res = await fetch('/api/doc-categories', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      message.success(editingCat ? '更新成功' : '创建成功');
      setCatModalOpen(false);
      loadCategories();
    } else {
      message.error(json.message);
    }
  };

  /**
   * 保存笔记（新建或编辑）。
   *
   * 成功后：
   *   - 切换到查看模式并选中该笔记
   *   - 自动展开所属分类节点，确保笔记在树中可见
   */
  const handleSaveNote = async (data: { title: string; content: string; categoryId: number; tags?: string }) => {
    const isEdit = mode === 'edit' && selectedNote;
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { id: selectedNote!.id, ...data } : data;
    const res = await fetch('/api/doc-notes', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      message.success('保存成功');
      setSelectedNoteId(json.data.id);
      setMode('view');
      loadAllNotes();
      // 确保所属分类节点展开，让新笔记在树中可见
      const catKey = `${CAT_PREFIX}${data.categoryId}`;
      setExpandedKeys(prev => prev.includes(catKey) ? prev : [...prev, catKey]);
    } else {
      message.error(json.message);
    }
  };

  // ── 导入相关 ──────────────────────────────────────────────

  /**
   * 递归读取拖拽事件中的 DataTransferItem，支持文件夹拖拽。
   *
   * 处理逻辑：
   *   - 文件条目（isFile）：过滤支持的扩展名，通过 Object.defineProperty 附加
   *     webkitRelativePath（包含文件夹路径信息），供后续分类匹配使用
   *   - 目录条目（isDirectory）：使用 createReader().readEntries() 递归读取，
   *     readEntries 每次最多返回 100 条，需循环调用直到返回空数组
   *
   * @param items 拖拽事件的 DataTransferItemList
   * @returns 所有符合条件的 File 对象列表（扁平化）
   */
  const readDropItems = (items: DataTransferItemList): Promise<File[]> => {
    const readEntry = (entry: any): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise(resolve => {
          entry.file((f: File) => {
            if (/\.(md|txt|markdown|sh|bat|docx|xlsx|xls)$/i.test(f.name)) {
              // 附加相对路径（去掉开头的 /），格式如 "文件夹名/文件名.md"
              Object.defineProperty(f, 'webkitRelativePath', {
                value: entry.fullPath.replace(/^\//, ''),
                writable: false,
              });
              resolve([f]);
            } else {
              resolve([]); // 不支持的格式直接跳过
            }
          });
        });
      } else if (entry.isDirectory) {
        return new Promise(resolve => {
          const reader = entry.createReader();
          // readEntries 每次最多返回 100 条，需循环直到返回空数组
          const readAll = (acc: File[]) => {
            reader.readEntries(async (entries: any[]) => {
              if (!entries.length) { resolve(acc); return; }
              const results = await Promise.all(entries.map(readEntry));
              readAll([...acc, ...results.flat()]);
            });
          };
          readAll([]);
        });
      }
      return Promise.resolve([]);
    };

    const entries = Array.from(items)
      .filter(i => i.kind === 'file')
      .map(i => i.webkitGetAsEntry?.())
      .filter(Boolean);
    return Promise.all(entries.map(readEntry)).then(r => r.flat());
  };

  /**
   * 从 FileList 中收集支持的文件，去重后追加到 importFiles 列表。
   * 去重依据：webkitRelativePath（文件夹上传时有值）或 name。
   *
   * @param fileList input[type=file] 或 dataTransfer.files 返回的 FileList
   */
  const collectFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const MAX_BINARY = 20 * 1024 * 1024; // 20MB
    const MAX_TEXT = 5 * 1024 * 1024;    // 5MB
    const oversized: string[] = [];

    const valid = Array.from(fileList).filter(f => {
      if (!/\.(md|txt|markdown|sh|bat|docx|xlsx|xls)$/i.test(f.name)) return false;
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const isBinary = ['docx', 'xlsx', 'xls'].includes(ext);
      const limit = isBinary ? MAX_BINARY : MAX_TEXT;
      if (f.size > limit) {
        oversized.push(`${f.name}（${(f.size / 1024 / 1024).toFixed(1)}MB，限制 ${isBinary ? '20MB' : '5MB'}）`);
        return false;
      }
      return true;
    });

    if (oversized.length > 0) {
      message.warning(`以下文件过大已跳过：${oversized.join('、')}`);
    }

    setImportFiles(prev => {
      const existing = new Set(prev.map(f => f.webkitRelativePath || f.name));
      const newOnes = valid.filter(f => !existing.has(f.webkitRelativePath || f.name));
      return [...prev, ...newOnes];
    });
  };

  /**
   * 执行批量导入。
   *
   * 处理流程：
   *   1. 校验：有文件 + 非文件夹导入时必须选分类
   *   2. 拉取最新分类列表，构建 name→id 缓存（catCache），避免同一文件夹重复创建分类
   *   3. 逐文件处理：
   *      - .docx：读取 ArrayBuffer → base64，fileType='docx'
   *      - .xlsx/.xls：调用 xlsxToMarkdown 转换，fileType='md'
   *      - .sh/.bat：包裹为 markdown 代码块，fileType='md'
   *      - 其他（.md/.txt）：直接读取文本，fileType='md'
   *   4. 文件夹文件：从 webkitRelativePath 提取父文件夹名，查缓存或创建新分类
   *   5. 调用 POST /api/doc-notes 创建笔记，成功后展开对应分类节点
   *   6. 完成后刷新分类和笔记列表，显示导入结果
   */
  const handleImport = async () => {
    if (importFiles.length === 0) { message.warning('请先选择文件'); return; }
    const hasFolderFiles = importFiles.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
    if (!hasFolderFiles && !importCategoryId) { message.warning('请选择目标分类'); return; }

    setImporting(true);
    let successCount = 0;

    // 拉取最新分类，构建 name→id 缓存，避免循环中重复创建同名分类
    // 注意：latestCats 是嵌套结构，需要同时遍历顶级和子分类
    const catRes = await fetch('/api/doc-categories');
    const catJson = await catRes.json();
    const latestCats: Category[] = catJson.success ? catJson.data : categories;
    const catCache: Record<string, number> = {};
    latestCats.forEach((c: Category) => {
      catCache[c.name] = c.id;
      // 子分类也加入缓存
      c.children?.forEach(ch => { catCache[ch.name] = ch.id; });
    });

    for (const file of importFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 文件大小限制：docx/xlsx 等二进制文件 ≤ 20MB，文本文件 ≤ 5MB
      const MAX_BINARY = 20 * 1024 * 1024; // 20MB
      const MAX_TEXT = 5 * 1024 * 1024;    // 5MB
      const isBinary = ['docx', 'xlsx', 'xls'].includes(ext);
      const limit = isBinary ? MAX_BINARY : MAX_TEXT;
      if (file.size > limit) {
        message.warning(`「${file.name}」文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），已跳过。限制：${isBinary ? '20MB' : '5MB'}`);
        continue;
      }

      // shell/batch 扩展名到代码块语言标识的映射
      const langMap: Record<string, string> = { sh: 'bash', bat: 'batch' };
      let content: string;
      let fileType: string | undefined;

      if (ext === 'docx') {
        // Word 文档：读取二进制 → base64 存储，viewer 端用 mammoth 解析
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        content = btoa(binary);
        fileType = 'docx';
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Excel：转换为 markdown 表格，保留真实后缀
        content = await xlsxToMarkdown(file);
        fileType = ext; // 'xlsx' 或 'xls'
      } else if (langMap[ext]) {
        // 脚本文件：包裹为 markdown 代码块，保留真实后缀
        const rawContent = await file.text();
        content = `\`\`\`${langMap[ext]}\n${rawContent}\n\`\`\``;
        fileType = ext; // 'sh' 或 'bat'
      } else {
        // markdown/txt：直接读取文本，保留真实后缀
        content = await file.text();
        fileType = ext || 'md'; // 'md'、'txt' 等
      }

      // 文件名去掉扩展名作为笔记标题
      const title = file.name.replace(/\.(md|txt|markdown|sh|bat|docx|xlsx|xls)$/i, '');
      let catId = importCategoryId;

      // 文件夹拖拽时，从相对路径提取父文件夹名，查缓存或创建新分类
      if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
        const parts = file.webkitRelativePath.split('/');
        const folderName = parts[parts.length - 2]; // 取直接父文件夹名
        if (catCache[folderName]) {
          catId = catCache[folderName]; // 命中缓存，复用已有分类
        } else {
          // 未命中缓存，创建新分类并写入缓存
          const res = await fetch('/api/doc-categories', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName }),
          });
          const json = await res.json();
          if (json.success) {
            catCache[folderName] = json.data.id;
            catId = json.data.id;
          }
        }
      }

      if (!catId) {
        // 无法确定分类：既没有文件夹路径，也没有手动选择分类，跳过并记录
        console.warn(`跳过文件 ${file.name}：未指定目标分类`);
        continue;
      }

      const res = await fetch('/api/doc-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, categoryId: catId, fileType }),
      });
      const json = await res.json();
      if (json.success) {
        successCount++;
        // 自动展开对应分类节点，让导入的笔记立即可见
        const k = `${CAT_PREFIX}${catId}`;
        setExpandedKeys(prev => prev.includes(k) ? prev : [...prev, k]);
      } else {
        console.error(`导入失败 [${file.name}]:`, json.message);
      }
    }

    setImporting(false);
    setImportModalOpen(false);
    setImportFiles([]);
    setImportCategoryId(undefined);
    message.success(`成功导入 ${successCount} / ${importFiles.length} 个文件`);
    if (successCount < importFiles.length) {
      message.warning(`${importFiles.length - successCount} 个文件导入失败，请检查是否选择了目标分类`);
    }
    loadCategories();
    loadAllNotes();
  };

  /**
   * 切换笔记置顶状态。
   * pinned 为 1 时改为 0，为 0 时改为 1。
   */
  const handleTogglePin = async (note: Note) => {
    await fetch('/api/doc-notes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, pinned: note.pinned ? 0 : 1 }),
    });
    loadAllNotes();
  };

  // ── 派生数据 ──────────────────────────────────────────────

  /**
   * 分类下拉选项列表（用于笔记编辑器和导入弹窗）。
   * 子分类用缩进符号 "└" 视觉区分层级。
   */
  const allCatOptions = categories.flatMap(c => [
    { value: c.id, label: c.name },
    ...(c.children?.map(ch => ({ value: ch.id, label: `  └ ${ch.name}` })) || []),
  ]);

  const borderColor = token.colorBorderSecondary;
  /** 当前选中笔记对应的树节点 key，用于高亮显示 */
  const selectedNoteKey = selectedNoteId ? `${NOTE_PREFIX}${selectedNoteId}` : undefined;

  // ── 渲染 ──────────────────────────────────────────────────

  return (
    <Layout style={{
      background: 'transparent', overflow: 'hidden', margin: -24,
      height: 'calc(100vh - 146px)', display: 'flex', flexDirection: 'row',
    }}>
      {/* ── 左侧文件树面板 ── */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: `1px solid ${borderColor}`,
        background: token.colorBgContainer, display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}>
        {/* 顶部工具栏：标题 + 新建分类/笔记/导入按钮 */}
        <div style={{
          padding: '10px 12px', borderBottom: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <Text strong style={{ fontSize: 13 }}>文档笔记</Text>
          <div style={{ display: 'flex', gap: 2 }}>
            <Tooltip title="新建分类">
              <Button size="small" type="text" icon={<FolderAddOutlined />}
                onClick={() => { setEditingCat(null); catForm.resetFields(); setCatModalOpen(true); }} />
            </Tooltip>
            <Tooltip title="新建笔记">
              <Button size="small" type="text" icon={<FileAddOutlined />}
                onClick={() => { setNewNoteCategoryId(undefined); setSelectedNoteId(null); setMode('new'); }} />
            </Tooltip>
            <Tooltip title="导入文件">
              <Button size="small" type="text" icon={<UploadOutlined />}
                onClick={() => setImportModalOpen(true)} />
            </Tooltip>
          </div>
        </div>

        {/* 搜索框：实时搜索标题和内容，清空时恢复全量列表 */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Search
            placeholder="搜索笔记..."
            size="small"
            allowClear
            onSearch={async val => {
              if (!val) { loadAllNotes(); return; }
              setLoading(true);
              const res = await fetch(`/api/doc-notes?keyword=${encodeURIComponent(val)}`);
              const json = await res.json();
              if (json.success) setAllNotes(json.data);
              setLoading(false);
            }}
            onChange={e => { if (!e.target.value) loadAllNotes(); }}
          />
        </div>

        {/* 树形列表区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          ) : treeData.length === 0 ? (
            <Empty description="暂无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
          ) : (
            <Tree
              treeData={treeData}
              selectedKeys={selectedNoteKey ? [selectedNoteKey] : []}
              expandedKeys={expandedKeys}
              onExpand={keys => setExpandedKeys(keys)}
              onSelect={handleTreeSelect}
              showIcon
              blockNode
              className="doc-notes-tree"
              titleRender={(node: any) => (
                <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* 节点标题，超长时截断显示 */}
                  <span style={{
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontSize: 13,
                  }}>
                    {node.title}
                  </span>
                  {/* 右键菜单按钮（MoreOutlined），默认透明，hover 时通过 CSS 显示 */}
                  <Dropdown
                    menu={{
                      items: node.key.startsWith(NOTE_PREFIX)
                        ? [{ key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true }]
                        : [
                            { key: 'add-note', label: '新建笔记', icon: <FileAddOutlined /> },
                            { key: 'edit', label: '编辑分类', icon: <EditOutlined /> },
                            { key: 'delete', label: '删除分类', icon: <DeleteOutlined />, danger: true },
                          ],
                      onClick: ({ domEvent, key }) => {
                        domEvent.stopPropagation(); // 阻止冒泡，避免触发树节点选中
                        if (node.key.startsWith(NOTE_PREFIX)) {
                          const noteId = parseInt(node.key.replace(NOTE_PREFIX, ''));
                          if (key === 'delete') handleDeleteNote(noteId);
                        } else {
                          const catId = parseInt(node.key.replace(CAT_PREFIX, ''));
                          const cat = categories.find(c => c.id === catId) || { id: catId, name: node.title };
                          if (key === 'add-note') { setNewNoteCategoryId(catId); setSelectedNoteId(null); setMode('new'); }
                          if (key === 'edit') openEditCat(cat as Category);
                          if (key === 'delete') handleDeleteCat(catId);
                        }
                      },
                    }}
                    trigger={['click']}
                  >
                    <MoreOutlined
                      onClick={e => e.stopPropagation()}
                      style={{ padding: '0 4px', opacity: 0, flexShrink: 0 }}
                      className="tree-node-more"
                    />
                  </Dropdown>
                </span>
              )}
            />
          )}
        </div>
      </div>

      {/* ── 右侧内容区 ── */}
      <Content style={{
        flex: 1, minWidth: 0, background: token.colorBgContainer,
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      }}>
        {mode === 'view' && selectedNote ? (
          // 查看模式：渲染笔记内容
          <DocNoteViewer
            note={selectedNote}
            onEdit={() => setMode('edit')}
            onDelete={() => handleDeleteNote(selectedNote.id)}
            onTogglePin={() => handleTogglePin(selectedNote)}
          />
        ) : (mode === 'edit' || mode === 'new') ? (
          // 编辑/新建模式：渲染编辑器
          <DocNoteEditor
            note={mode === 'edit' ? selectedNote : null}
            categories={allCatOptions}
            defaultCategoryId={mode === 'new' ? newNoteCategoryId : selectedNote?.categoryId}
            onSave={handleSaveNote}
            onCancel={() => setMode('view')}
          />
        ) : (
          // 未选中任何笔记时的空状态提示
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Empty description="从左侧选择笔记，或新建笔记" />
          </div>
        )}
      </Content>

      {/* ── 新建/编辑分类弹窗 ── */}
      <Modal
        title={editingCat ? '编辑分类' : '新建分类'}
        open={catModalOpen}
        onOk={handleSaveCat}
        onCancel={() => setCatModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={catForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="parentId" label="父分类（可选）">
            <Select allowClear placeholder="不选则为顶级分类"
              options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 导入文档弹窗 ── */}
      <Modal
        title="导入文档"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => {
          setImportModalOpen(false);
          setImportFiles([]);
          setImportCategoryId(undefined);
          setIsDragOver(false);
        }}
        okText={importing ? '导入中...' : `导入${importFiles.length > 0 ? ` (${importFiles.length})` : ''}`}
        cancelText="取消"
        okButtonProps={{ disabled: importing }}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {/* 拖拽上传区域：支持拖拽文件/文件夹，点击触发 file input */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={async e => {
              e.preventDefault();
              setIsDragOver(false);
              // 优先使用 webkitGetAsEntry 读取（支持文件夹），降级到 dataTransfer.files
              const files = await readDropItems(e.dataTransfer.items);
              if (files.length) {
                setImportFiles(prev => {
                  const existing = new Set(prev.map(f => f.webkitRelativePath || f.name));
                  return [...prev, ...files.filter(f => !existing.has(f.webkitRelativePath || f.name))];
                });
              } else {
                collectFiles(e.dataTransfer.files);
              }
            }}
            style={{
              border: `2px dashed ${isDragOver ? token.colorPrimary : borderColor}`,
              borderRadius: 8, padding: '28px 16px', textAlign: 'center',
              background: isDragOver ? token.colorPrimaryBg : token.colorBgLayout,
              transition: 'all 0.2s', cursor: 'pointer',
            }}
            onClick={() => importFileInputRef.current?.click()}
          >
            <UploadOutlined style={{ fontSize: 28, color: token.colorTextSecondary, marginBottom: 8, display: 'block' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>拖拽文件或文件夹到此处，或点击选择文件</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              支持 .md / .txt / .sh / .bat / .docx / .xlsx；文件夹上传时自动按文件夹名创建分类
            </Text>
          </div>

          {/* 非文件夹导入时显示分类选择器 */}
          {importFiles.length > 0 && !importFiles.some(f => f.webkitRelativePath?.includes('/')) && (
            <Select
              style={{ width: '100%' }}
              placeholder="选择目标分类"
              value={importCategoryId}
              onChange={setImportCategoryId}
              options={allCatOptions}
            />
          )}

          {/* 已选文件列表，支持单个移除和全部清空 */}
          {importFiles.length > 0 && (
            <div style={{
              maxHeight: 180, overflow: 'auto',
              border: `1px solid ${borderColor}`, borderRadius: 6, padding: '4px 8px',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '2px 0 6px', borderBottom: `1px solid ${borderColor}`, marginBottom: 4,
              }}>
                <Text type="secondary" style={{ fontSize: 11 }}>共 {importFiles.length} 个文件</Text>
                <Button type="text" size="small" danger
                  style={{ fontSize: 11, height: 18, padding: '0 4px' }}
                  onClick={() => setImportFiles([])}>
                  清空
                </Button>
              </div>
              {importFiles.map((f, i) => (
                <div key={i} style={{
                  fontSize: 12, padding: '2px 0', color: token.colorText,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {f.webkitRelativePath || f.name}
                  </span>
                  <Button type="text" size="small" danger
                    style={{ fontSize: 11, height: 18, padding: '0 4px', flexShrink: 0 }}
                    onClick={() => setImportFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 隐藏的 file input，由拖拽区域点击事件触发，支持多文件选择 */}
        <input
          ref={importFileInputRef}
          type="file"
          multiple
          accept=".md,.txt,.markdown,.sh,.bat,.docx,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => { collectFiles(e.target.files); e.target.value = ''; }}
        />
      </Modal>
    </Layout>
  );
};

export default DocNotes;
