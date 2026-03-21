'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layout, Tree, Button, Input, Modal, Form, Select, Typography,
  Tooltip, Dropdown, App, Empty, Spin, theme
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

interface Category {
  id: number;
  name: string;
  parentId?: number;
  children?: Category[];
}

interface Note {
  id: number;
  title: string;
  content?: string;
  categoryId: number;
  tags?: string;
  pinned: number;
  updatedAt: string;
  category?: { id: number; name: string };
}

const CAT_PREFIX = 'cat-';
const NOTE_PREFIX = 'note-';

const DocNotes: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [newNoteCategoryId, setNewNoteCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCategoryId, setImportCategoryId] = useState<number | undefined>();
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedNote = useMemo(() => 
    allNotes.find(n => n.id === selectedNoteId) || null,
    [allNotes, selectedNoteId]
  );

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/doc-categories');
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }, []);

  const loadAllNotes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/doc-notes');
    const json = await res.json();
    if (json.success) setAllNotes(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
    loadAllNotes();
  }, [loadCategories, loadAllNotes]);

  const treeData = useMemo(() => {
    const notesByCat: Record<number, Note[]> = {};
    allNotes.forEach(n => {
      if (!notesByCat[n.categoryId]) notesByCat[n.categoryId] = [];
      notesByCat[n.categoryId].push(n);
    });

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

    return categories.filter(c => !c.parentId).map(buildCatNode);
  }, [categories, allNotes, token]);

  const handleTreeSelect = useCallback((keys: React.Key[], info: any) => {
    const key = (keys.length > 0 ? keys[0] : info.node.key) as string;
    if (!key) return;
    
    if (key.startsWith(NOTE_PREFIX)) {
      const noteId = parseInt(key.replace(NOTE_PREFIX, ''));
      setSelectedNoteId(noteId);
      setMode('view');
    } else if (key.startsWith(CAT_PREFIX)) {
      setExpandedKeys(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    }
  }, [allNotes]);

  const handleDeleteNote = async (id: number) => {
    const res = await fetch(`/api/doc-notes?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      message.success('删除成功');
      if (selectedNoteId === id) setSelectedNoteId(null);
      loadAllNotes();
    }
  };

  const handleDeleteCat = async (id: number) => {
    const res = await fetch(`/api/doc-categories?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) { message.success('删除成功'); loadCategories(); loadAllNotes(); }
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat); catForm.setFieldsValue(cat); setCatModalOpen(true);
  };

  const handleSaveCat = async () => {
    const values = await catForm.validateFields();
    const method = editingCat ? 'PUT' : 'POST';
    const body = editingCat ? { id: editingCat.id, ...values } : values;
    const res = await fetch('/api/doc-categories', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (json.success) { message.success(editingCat ? '更新成功' : '创建成功'); setCatModalOpen(false); loadCategories(); }
    else message.error(json.message);
  };

  const handleSaveNote = async (data: { title: string; content: string; categoryId: number; tags?: string }) => {
    const isEdit = mode === 'edit' && selectedNote;
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { id: selectedNote!.id, ...data } : data;
    const res = await fetch('/api/doc-notes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (json.success) {
      message.success('保存成功');
      setSelectedNoteId(json.data.id);
      setMode('view');
      loadAllNotes();
      const catKey = `${CAT_PREFIX}${data.categoryId}`;
      setExpandedKeys(prev => prev.includes(catKey) ? prev : [...prev, catKey]);
    } else message.error(json.message);
  };

  // 递归读取 DataTransferItem（支持文件夹拖拽）
  const readDropItems = (items: DataTransferItemList): Promise<File[]> => {
    const readEntry = (entry: any): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise(resolve => {
          entry.file((f: File) => {
            if (/\.(md|txt|markdown)$/i.test(f.name)) {
              // 给文件附加相对路径信息
              Object.defineProperty(f, 'webkitRelativePath', { value: entry.fullPath.replace(/^\//, ''), writable: false });
              resolve([f]);
            } else resolve([]);
          });
        });
      } else if (entry.isDirectory) {
        return new Promise(resolve => {
          const reader = entry.createReader();
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

  const collectFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(f => /\.(md|txt|markdown)$/i.test(f.name));
    setImportFiles(prev => {
      const existing = new Set(prev.map(f => f.webkitRelativePath || f.name));
      const newOnes = valid.filter(f => !existing.has(f.webkitRelativePath || f.name));
      return [...prev, ...newOnes];
    });
  };

  const handleImport = async () => {
    if (importFiles.length === 0) { message.warning('请先选择文件'); return; }
    const hasFolderFiles = importFiles.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
    if (!hasFolderFiles && !importCategoryId) { message.warning('请选择目标分类'); return; }

    setImporting(true);
    let successCount = 0;

    // 先拉最新分类，构建本地 name->id 缓存，避免循环里重复创建
    const catRes = await fetch('/api/doc-categories');
    const catJson = await catRes.json();
    const latestCats: Category[] = catJson.success ? catJson.data : categories;
    const catCache: Record<string, number> = {};
    latestCats.forEach((c: Category) => { catCache[c.name] = c.id; });

    for (const file of importFiles) {
      const content = await file.text();
      const title = file.name.replace(/\.(md|txt|markdown)$/i, '');
      let catId = importCategoryId;

      if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
        const parts = file.webkitRelativePath.split('/');
        const folderName = parts[parts.length - 2];
        if (catCache[folderName]) {
          catId = catCache[folderName];
        } else {
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

      if (!catId) continue;
      const res = await fetch('/api/doc-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, categoryId: catId }),
      });
      const json = await res.json();
      if (json.success) {
        successCount++;
        const k = `${CAT_PREFIX}${catId}`;
        setExpandedKeys(prev => prev.includes(k) ? prev : [...prev, k]);
      }
    }

    setImporting(false);
    setImportModalOpen(false);
    setImportFiles([]);
    setImportCategoryId(undefined);
    message.success(`成功导入 ${successCount} / ${importFiles.length} 个文件`);
    loadCategories();
    loadAllNotes();
  };

  const handleTogglePin = async (note: Note) => {    await fetch('/api/doc-notes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, pinned: note.pinned ? 0 : 1 })
    });
    loadAllNotes();
  };

  const allCatOptions = categories.flatMap(c => [
    { value: c.id, label: c.name },
    ...(c.children?.map(ch => ({ value: ch.id, label: `  └ ${ch.name}` })) || [])
  ]);

  const borderColor = token.colorBorderSecondary;
  const selectedNoteKey = selectedNoteId ? `${NOTE_PREFIX}${selectedNoteId}` : undefined;

  return (
    <Layout style={{ background: 'transparent', overflow: 'hidden', margin: -24, height: 'calc(100vh - 146px)', display: 'flex', flexDirection: 'row' }}>
      <div style={{
        width: 260, flexShrink: 0, borderRight: `1px solid ${borderColor}`,
        background: token.colorBgContainer, display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 12px', borderBottom: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <Text strong style={{ fontSize: 13 }}>文档笔记</Text>
          <div style={{ display: 'flex', gap: 2 }}>
            <Tooltip title="新建分类">
              <Button size="small" type="text" icon={<FolderAddOutlined />} onClick={() => { setEditingCat(null); catForm.resetFields(); setCatModalOpen(true); }} />
            </Tooltip>
            <Tooltip title="新建笔记">
              <Button size="small" type="text" icon={<FileAddOutlined />} onClick={() => { setNewNoteCategoryId(undefined); setSelectedNoteId(null); setMode('new'); }} />
            </Tooltip>
            <Tooltip title="导入文件">
              <Button size="small" type="text" icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)} />
            </Tooltip>
          </div>
        </div>

        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Search placeholder="搜索笔记..." size="small" allowClear
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
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {node.title}
                  </span>
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
                        domEvent.stopPropagation();
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
                      }
                    }}
                    trigger={['click']}
                  >
                    <MoreOutlined onClick={e => e.stopPropagation()} style={{ padding: '0 4px', opacity: 0, flexShrink: 0 }} className="tree-node-more" />
                  </Dropdown>
                </span>
              )}
            />
          )}
        </div>
      </div>

      <Content style={{ flex: 1, minWidth: 0, background: token.colorBgContainer, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {mode === 'view' && selectedNote ? (
          <DocNoteViewer note={selectedNote} onEdit={() => setMode('edit')} onDelete={() => handleDeleteNote(selectedNote.id)} onTogglePin={() => handleTogglePin(selectedNote)} />
        ) : (mode === 'edit' || mode === 'new') ? (
          <DocNoteEditor note={mode === 'edit' ? selectedNote : null} categories={allCatOptions} defaultCategoryId={mode === 'new' ? newNoteCategoryId : selectedNote?.categoryId} onSave={handleSaveNote} onCancel={() => setMode('view')} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Empty description="从左侧选择笔记，或新建笔记" />
          </div>
        )}
      </Content>

      <Modal title={editingCat ? '编辑分类' : '新建分类'} open={catModalOpen} onOk={handleSaveCat} onCancel={() => setCatModalOpen(false)}>
        <Form form={catForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input placeholder="请输入分类名称" /></Form.Item>
          <Form.Item name="parentId" label="父分类（可选）"><Select allowClear placeholder="不选则为顶级分类" options={categories.map(c => ({ value: c.id, label: c.name }))} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入文档"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => { setImportModalOpen(false); setImportFiles([]); setImportCategoryId(undefined); setIsDragOver(false); }}
        okText={importing ? '导入中...' : `导入${importFiles.length > 0 ? ` (${importFiles.length})` : ''}`}
        cancelText="取消"
        okButtonProps={{ disabled: importing }}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={async e => {
              e.preventDefault();
              setIsDragOver(false);
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
            <Text type="secondary" style={{ fontSize: 11 }}>支持 .md / .txt / .markdown；文件夹上传时自动按文件夹名创建分类</Text>
          </div>

          {importFiles.length > 0 && !importFiles.some(f => f.webkitRelativePath?.includes('/')) && (
            <Select
              style={{ width: '100%' }}
              placeholder="选择目标分类"
              value={importCategoryId}
              onChange={setImportCategoryId}
              options={allCatOptions}
            />
          )}

          {importFiles.length > 0 && (
            <div style={{ maxHeight: 180, overflow: 'auto', border: `1px solid ${borderColor}`, borderRadius: 6, padding: '4px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0 6px', borderBottom: `1px solid ${borderColor}`, marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>共 {importFiles.length} 个文件</Text>
                <Button type="text" size="small" danger style={{ fontSize: 11, height: 18, padding: '0 4px' }} onClick={() => setImportFiles([])}>清空</Button>
              </div>
              {importFiles.map((f, i) => (
                <div key={i} style={{ fontSize: 12, padding: '2px 0', color: token.colorText, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.webkitRelativePath || f.name}</span>
                  <Button type="text" size="small" danger style={{ fontSize: 11, height: 18, padding: '0 4px', flexShrink: 0 }}
                    onClick={() => setImportFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <input ref={importFileInputRef} type="file" multiple accept=".md,.txt,.markdown"
          style={{ display: 'none' }} onChange={e => { collectFiles(e.target.files); e.target.value = ''; }} />
      </Modal>
    </Layout>
  );
};

export default DocNotes;
