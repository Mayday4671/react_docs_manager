/**
 * @file GlobalSearch.tsx
 * @description 全局搜索弹窗组件，支持搜索菜单、文档笔记和文件，提供键盘导航功能
 * @module 搜索
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Input, Typography, Tag, Spin, Empty, Divider, theme } from 'antd';
import {
  SearchOutlined, MenuOutlined, FileTextOutlined,
  FileOutlined, EnterOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/frontend/context/ThemeContext';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * 全局搜索结果数据结构
 */
interface SearchResult {
  /** 匹配的菜单列表 */
  menus: Array<{
    /** 菜单 ID */
    id: number;
    /** 菜单 key，用于导航跳转 */
    key: string;
    /** 菜单显示名称 */
    label: string;
    /** 菜单图标名称（可选） */
    icon?: string;
  }>;
  /** 匹配的文档笔记列表 */
  notes: Array<{
    /** 笔记 ID */
    id: number;
    /** 笔记标题 */
    title: string;
    /** 标签，逗号分隔（可选） */
    tags?: string;
    /** 文件类型（可选） */
    fileType?: string;
    /** 最后更新时间 */
    updatedAt: string;
    /** 所属分类（可选） */
    category?: {
      /** 分类 ID */
      id: number;
      /** 分类名称 */
      name: string;
    };
  }>;
  /** 匹配的文件列表 */
  files: Array<{
    /** 文件 ID */
    id: number;
    /** 文件名 */
    fileName: string;
    /** 文件类型 */
    fileType: string;
    /** 文件大小（字节） */
    fileSize: number;
    /** 文件访问 URL */
    fileUrl: string;
    /** 创建时间 */
    createdAt: string;
  }>;
}

/**
 * GlobalSearch 组件 Props
 */
interface Props {
  /** 弹窗是否打开 */
  open: boolean;
  /** 关闭弹窗的回调 */
  onClose: () => void;
  /** 导航到指定菜单 key 的回调 */
  onNavigate: (key: string) => void;
}

/**
 * 将字节数格式化为可读的文件大小字符串
 *
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的大小字符串，如 "1.2 MB"
 */
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 全局搜索弹窗组件
 *
 * 提供跨菜单、文档笔记、文件的统一搜索入口，支持键盘上下键导航和 Enter 确认。
 * 搜索请求带 250ms 防抖，避免频繁请求。
 *
 * @param open - 弹窗是否打开
 * @param onClose - 关闭弹窗的回调
 * @param onNavigate - 导航到指定菜单 key 的回调
 */
const GlobalSearch: React.FC<Props> = ({ open, onClose, onNavigate }) => {
  const { darkMode, colorPrimary } = useTheme();
  const { token } = theme.useToken();
  /** 当前搜索关键词 */
  const [query, setQuery] = useState('');
  /** 搜索结果数据，null 表示尚未搜索 */
  const [results, setResults] = useState<SearchResult | null>(null);
  /** 搜索请求加载状态 */
  const [loading, setLoading] = useState(false);
  /** 当前键盘高亮的结果项索引（扁平化后） */
  const [activeIndex, setActiveIndex] = useState(0);
  /** 搜索输入框 ref，用于自动聚焦 */
  const inputRef = useRef<any>(null);
  /** 防抖定时器 ref */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 打开时聚焦
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /**
   * 执行搜索请求，将结果写入 results 状态
   *
   * @param q - 搜索关键词，空字符串时清空结果
   */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // 防抖：query 变化后延迟 250ms 执行搜索
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  // 扁平化所有结果用于键盘导航
  const flatItems = results ? [
    ...results.menus.map(m => ({ type: 'menu' as const, ...m })),
    ...results.notes.map(n => ({ type: 'note' as const, ...n })),
    ...results.files.map(f => ({ type: 'file' as const, ...f })),
  ] : [];

  /**
   * 处理键盘事件，支持上下键导航、Enter 确认和 Escape 关闭
   *
   * @param e - React 键盘事件对象
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && flatItems[activeIndex]) {
      handleSelect(flatItems[activeIndex]);
    }
    if (e.key === 'Escape') onClose();
  };

  /**
   * 处理搜索结果项的选中操作，根据类型导航到对应页面
   *
   * @param item - 被选中的搜索结果项（菜单/笔记/文件）
   */
  const handleSelect = (item: any) => {
    if (item.type === 'menu') {
      onNavigate(item.key);
      onClose();
    } else if (item.type === 'note') {
      onNavigate('doc-notes');
      onClose();
    } else if (item.type === 'file') {
      onNavigate('file-management');
      onClose();
    }
  };

  /** 是否有搜索结果（至少一类有数据） */
  const hasResults = results && (results.menus.length + results.notes.length + results.files.length) > 0;
  /** 是否搜索完成但无结果 */
  const isEmpty = results && !hasResults;

  /**
   * 生成结果列表项的内联样式，高亮当前激活项
   *
   * @param idx - 当前项在扁平化列表中的索引
   * @returns React 内联样式对象
   */
  const itemStyle = (idx: number): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
    background: activeIndex === idx ? `${colorPrimary}18` : 'transparent',
    border: `1px solid ${activeIndex === idx ? colorPrimary + '44' : 'transparent'}`,
    transition: 'all 0.12s',
    marginBottom: 2,
  });

  let globalIdx = 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
      closable={false}
      styles={{
        content: {
          padding: 0,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px ${token.colorBorderSecondary}`,
        },
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.3)' },
      }}
    >
      {/* 搜索输入框 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}>
        <SearchOutlined style={{ fontSize: 18, color: colorPrimary, flexShrink: 0 }} />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="搜索菜单、文档、文件..."
          variant="borderless"
          style={{ fontSize: 16, flex: 1 }}
          autoComplete="off"
        />
        {loading && <Spin size="small" />}
        <Tag style={{ flexShrink: 0, color: token.colorTextTertiary, borderColor: token.colorBorderSecondary, background: 'transparent' }}>
          ESC
        </Tag>
      </div>

      {/* 搜索结果 */}
      <div style={{ maxHeight: 480, overflowY: 'auto', padding: '8px 10px' }}>
        {!query && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <SearchOutlined style={{ fontSize: 32, color: token.colorTextTertiary, display: 'block', marginBottom: 8 }} />
            <Text style={{ color: token.colorTextTertiary, fontSize: 13 }}>输入关键词搜索菜单、文档笔记、文件</Text>
          </div>
        )}

        {isEmpty && (
          <Empty description="没有找到相关内容" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '24px 0' }} />
        )}

        {hasResults && (
          <>
            {/* 菜单结果 */}
            {results!.menus.length > 0 && (
              <>
                <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AppstoreOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                  <Text style={{ fontSize: 11, color: token.colorTextTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>菜单</Text>
                </div>
                {results!.menus.map(item => {
                  const idx = globalIdx++;
                  return (
                    <div key={`menu-${item.id}`} style={itemStyle(idx)}
                      onClick={() => handleSelect({ type: 'menu', ...item })}
                      onMouseEnter={() => setActiveIndex(idx)}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: `${colorPrimary}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MenuOutlined style={{ fontSize: 13, color: colorPrimary }} />
                      </div>
                      <Text style={{ flex: 1, fontSize: 14 }}>{item.label}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: token.colorTextTertiary, fontSize: 11 }}>
                        <span>跳转</span>
                        <EnterOutlined style={{ fontSize: 10 }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* 文档笔记结果 */}
            {results!.notes.length > 0 && (
              <>
                {results!.menus.length > 0 && <Divider style={{ margin: '6px 0' }} />}
                <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                  <Text style={{ fontSize: 11, color: token.colorTextTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>文档笔记</Text>
                </div>
                {results!.notes.map(item => {
                  const idx = globalIdx++;
                  return (
                    <div key={`note-${item.id}`} style={itemStyle(idx)}
                      onClick={() => handleSelect({ type: 'note', ...item })}
                      onMouseEnter={() => setActiveIndex(idx)}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: `${token.colorWarning}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileTextOutlined style={{ fontSize: 13, color: token.colorWarning }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
                          {item.category?.name} · {dayjs(item.updatedAt).format('MM-DD HH:mm')}
                        </Text>
                      </div>
                      {item.tags && (
                        <Tag style={{ fontSize: 10, flexShrink: 0 }}>{item.tags.split(',')[0]}</Tag>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* 文件结果 */}
            {results!.files.length > 0 && (
              <>
                {(results!.menus.length > 0 || results!.notes.length > 0) && <Divider style={{ margin: '6px 0' }} />}
                <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                  <Text style={{ fontSize: 11, color: token.colorTextTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>文件</Text>
                </div>
                {results!.files.map(item => {
                  const idx = globalIdx++;
                  return (
                    <div key={`file-${item.id}`} style={itemStyle(idx)}
                      onClick={() => handleSelect({ type: 'file', ...item })}
                      onMouseEnter={() => setActiveIndex(idx)}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: `${token.colorSuccess}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileOutlined style={{ fontSize: 13, color: token.colorSuccess }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.fileName}
                        </Text>
                        <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
                          {formatSize(item.fileSize)} · {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* 底部快捷键提示 */}
      <div style={{
        padding: '8px 18px',
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        {[
          { key: '↑↓', desc: '导航' },
          { key: 'Enter', desc: '打开' },
          { key: 'ESC', desc: '关闭' },
        ].map(({ key, desc }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag style={{ fontSize: 10, padding: '0 5px', margin: 0, color: token.colorTextSecondary, borderColor: token.colorBorderSecondary, background: token.colorBgLayout }}>
              {key}
            </Tag>
            <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>{desc}</Text>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
          {flatItems.length > 0 ? `${flatItems.length} 个结果` : ''}
        </Text>
      </div>
    </Modal>
  );
};

export default GlobalSearch;
