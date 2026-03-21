'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Space, Tag, Typography, theme, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

// 动态加载 MD 编辑器，避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const { Text } = Typography;

interface Note {
  id: number;
  title: string;
  content?: string;
  categoryId: number;
  tags?: string;
  pinned: number;
}

interface Props {
  note: Note | null;
  categories: { value: number; label: string }[];
  defaultCategoryId?: number;
  onSave: (data: { title: string; content: string; categoryId: number; tags?: string }) => void;
  onCancel: () => void;
}

const DocNoteEditor: React.FC<Props> = ({ note, categories, defaultCategoryId, onSave, onCancel }) => {
  const { token } = theme.useToken();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategoryId(note.categoryId);
      setTags(note.tags || '');
    } else {
      setTitle('');
      setContent('');
      setCategoryId(defaultCategoryId);
      setTags('');
    }
  }, [note, defaultCategoryId]);

  const handleSave = () => {
    if (!title.trim()) { message.warning('请输入标题'); return; }
    if (!categoryId) { message.warning('请选择分类'); return; }
    onSave({ title: title.trim(), content, categoryId, tags: tags.trim() || undefined });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px' }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="笔记标题"
          style={{ flex: 1, minWidth: 200, fontSize: 16, fontWeight: 600 }}
          size="large"
        />
        <Select
          value={categoryId}
          onChange={setCategoryId}
          options={categories}
          placeholder="选择分类"
          style={{ width: 160 }}
          size="large"
        />
        <Input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="标签（逗号分隔）"
          style={{ width: 180 }}
          size="large"
        />
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} size="large">保存</Button>
          <Button icon={<CloseOutlined />} onClick={onCancel} size="large">取消</Button>
        </Space>
      </div>

      {/* MD 编辑器 */}
      <div style={{ flex: 1, overflow: 'hidden' }} data-color-mode={token.colorBgContainer === '#ffffff' ? 'light' : 'dark'}>
        <MDEditor
          value={content}
          onChange={v => setContent(v || '')}
          height="100%"
          style={{ height: '100%' }}
          preview="live"
        />
      </div>
    </div>
  );
};

export default DocNoteEditor;
