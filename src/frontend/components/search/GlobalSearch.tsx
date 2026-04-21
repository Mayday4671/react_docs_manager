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

interface SearchResult {
  menus: Array<{ id: number; key: string; label: string; icon?: string }>;
  notes: Array<{ id: number; title: string; tags?: string; fileType?: string; updatedAt: string; category?: { id: number; name: string } }>;
  files: Array<{ id: number; fileName: string; fileType: string; fileSize: number; fileUrl: string; createdAt: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (key: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const GlobalSearch: React.FC<Props> = ({ open, onClose, onNavigate }) => {
  const { darkMode, colorPrimary } = useTheme();
  const { token } = theme.useToken();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<any>(null);
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

  // 防抖搜索
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && flatItems[activeIndex]) {
      handleSelect(flatItems[activeIndex]);
    }
    if (e.key === 'Escape') onClose();
  };

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

  const hasResults = results && (results.menus.length + results.notes.length + results.files.length) > 0;
  const isEmpty = results && !hasResults;

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
