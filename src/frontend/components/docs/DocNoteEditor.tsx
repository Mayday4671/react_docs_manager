/**
 * 文档笔记编辑器组件
 *
 * 用于新建和编辑笔记，提供标题、分类、标签输入，以及 Markdown 实时预览编辑器。
 * 编辑器使用 @uiw/react-md-editor，通过 next/dynamic 动态加载以避免 SSR 报错。
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Space, theme, App } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

// 动态加载 MD 编辑器，禁用 SSR（编辑器依赖浏览器 API，服务端无法渲染）
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/** 笔记数据结构（编辑模式下从父组件传入） */
interface Note {
  id: number;
  title: string;
  content?: string;
  categoryId: number;
  tags?: string;
  pinned: number;
}

/** 组件 Props */
interface Props {
  /** 编辑模式传入已有笔记，新建模式传 null */
  note: Note | null;
  /** 分类下拉选项列表 */
  categories: { value: number; label: string }[];
  /** 新建笔记时的默认分类 ID（从左侧树点击"新建笔记"时传入） */
  defaultCategoryId?: number;
  /** 保存回调，将表单数据提交给父组件处理 */
  onSave: (data: { title: string; content: string; categoryId: number; tags?: string }) => void;
  /** 取消编辑回调 */
  onCancel: () => void;
}

const DocNoteEditor: React.FC<Props> = ({ note, categories, defaultCategoryId, onSave, onCancel }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  // 表单字段状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [tags, setTags] = useState('');

  /**
   * 当传入的 note 或 defaultCategoryId 变化时，重置表单数据。
   * 编辑模式：用 note 的字段填充表单。
   * 新建模式：清空表单，仅预填 defaultCategoryId。
   */
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

  /**
   * 保存前校验必填字段，通过后调用父组件的 onSave 回调。
   * tags 为空时传 undefined，避免存入空字符串。
   */
  const handleSave = () => {
    if (!title.trim()) { message.warning('请输入标题'); return; }
    if (!categoryId) { message.warning('请选择分类'); return; }
    onSave({ title: title.trim(), content, categoryId, tags: tags.trim() || undefined });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px' }}>
      {/* 顶部工具栏：标题、分类、标签、操作按钮 */}
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
        {/* 标签输入：多个标签用英文逗号分隔，如 "Linux,Shell,运维" */}
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

      {/*
        Markdown 编辑器区域
        data-color-mode 控制编辑器主题：根据当前 Ant Design 主题背景色判断明暗模式
        preview="live" 开启左右分栏实时预览
      */}
      <div
        style={{ flex: 1, overflow: 'hidden' }}
        data-color-mode={token.colorBgContainer === '#ffffff' ? 'light' : 'dark'}
      >
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
