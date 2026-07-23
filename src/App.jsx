import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import {
  getAllBoxes,
  saveBox,
  saveBoxes,
  deleteBox,
  deleteBoxes as deleteBoxesDB,
  exportToJSON,
  importFromJSON,
} from './db/indexedDB.js';
import { createEmptyBox } from './data/model.js';
import { validateBoxes } from './data/validation.js';
import FilterPanel from './components/FilterPanel.jsx';
import BoxForm from './components/BoxForm.jsx';
import BoxList from './components/BoxList.jsx';
import BatchActions from './components/BatchActions.jsx';
import ValidationWarnings from './components/ValidationWarnings.jsx';
import CommonItemsView from './components/CommonItemsView.jsx';

export default function App() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBox, setEditingBox] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({ room: '', weight: '', priority: '', status: '', fragile: '' });
  const [sortBy, setSortBy] = useState('order');
  const [view, setView] = useState('all');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const data = await getAllBoxes();
      setBoxes(data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  };

  const rooms = useMemo(() => {
    return [...new Set(boxes.map(b => b.room))].sort();
  }, [boxes]);

  const warnings = useMemo(() => validateBoxes(boxes), [boxes]);

  const filteredBoxes = useMemo(() => {
    let result = [...boxes];
    if (filters.room) result = result.filter(b => b.room === filters.room);
    if (filters.weight) result = result.filter(b => b.weight === filters.weight);
    if (filters.priority) result = result.filter(b => b.priority === filters.priority);
    if (filters.status) result = result.filter(b => b.status === filters.status);
    if (filters.fragile === 'yes') result = result.filter(b => b.fragile);
    if (filters.fragile === 'no') result = result.filter(b => !b.fragile);

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const weightOrder = { heavy: 0, medium: 1, light: 2 };
    const statusOrder = { reinforce: 0, pending: 1, postponed: 2, confirmed: 3 };

    switch (sortBy) {
      case 'order':
        result.sort((a, b) => {
          if (a.room !== b.room) return a.room.localeCompare(b.room);
          return a.order - b.order;
        });
        break;
      case 'priority':
        result.sort((a, b) => {
          const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
          return diff !== 0 ? diff : a.order - b.order;
        });
        break;
      case 'code':
        result.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        break;
      case 'room':
        result.sort((a, b) => {
          if (a.room !== b.room) return a.room.localeCompare(b.room);
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        break;
      case 'weight':
        result.sort((a, b) => weightOrder[a.weight] - weightOrder[b.weight]);
        break;
      case 'status':
        result.sort((a, b) => {
          const diff = statusOrder[a.status] - statusOrder[b.status];
          return diff !== 0 ? diff : a.order - b.order;
        });
        break;
      default:
        break;
    }
    return result;
  }, [boxes, filters, sortBy]);

  const handleSaveBox = async (boxData) => {
    const saved = await saveBox(boxData);
    setBoxes(prev => {
      const idx = prev.findIndex(b => b.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditingBox(null);
  };

  const handleEdit = (box) => {
    setEditingBox(box);
    setShowForm(true);
  };

  const handleCopy = async (box) => {
    const newBox = { ...box, id: '', code: box.code + '-副本', order: boxes.length + 1 };
    delete newBox.createdAt;
    delete newBox.updatedAt;
    const saved = await saveBox(newBox);
    setBoxes(prev => [...prev, saved]);
  };

  const handleDelete = async (id) => {
    await deleteBox(id);
    setBoxes(prev => prev.filter(b => b.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSelect = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBoxes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBoxes.map(b => b.id)));
    }
  };

  const handleReorder = async (reorderedBoxes) => {
    setBoxes(prev => {
      const map = new Map(prev.map(b => [b.id, b]));
      for (const rb of reorderedBoxes) {
        const existing = map.get(rb.id);
        if (existing) {
          map.set(rb.id, { ...existing, order: rb.order });
        }
      }
      return [...map.values()];
    });
    await saveBoxes(reorderedBoxes.map(b => ({ ...boxes.find(x => x.id === b.id), order: b.order })));
  };

  const handleBatchStatus = async (status) => {
    const ids = [...selectedIds];
    const updated = boxes.map(b =>
      ids.includes(b.id) ? { ...b, status } : b
    );
    setBoxes(updated);
    const toSave = updated.filter(b => ids.includes(b.id));
    await saveBoxes(toSave);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    const ids = [...selectedIds];
    if (!confirm(`确定删除选中的 ${ids.length} 个收纳盒？`)) return;
    await deleteBoxesDB(ids);
    setBoxes(prev => prev.filter(b => !ids.includes(b.id)));
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    const json = await exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boxkeep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = await importFromJSON(text);
      setBoxes(imported);
      alert(`成功导入 ${imported.length} 条记录`);
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
    e.target.value = '';
  };

  const handleAddNew = () => {
    const maxOrder = boxes.length > 0 ? Math.max(...boxes.map(b => b.order)) : 0;
    const newBox = createEmptyBox();
    newBox.order = maxOrder + 1;
    setEditingBox(newBox);
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>📦 BoxKeep</h1>
          <span className="header-subtitle">家庭收纳盒整理 · 离线可用</span>
        </div>
        <div className="header-right">
          <button
            className={`btn-view ${view === 'all' ? 'active' : ''}`}
            onClick={() => setView('all')}
          >
            全部盒子
          </button>
          <button
            className={`btn-view ${view === 'attention' ? 'active' : ''}`}
            onClick={() => setView('attention')}
          >
            常用清单 {warnings.length > 0 && <span className="badge-count">{warnings.length}</span>}
          </button>
          <button className="btn-action" onClick={handleAddNew}>+ 新增收纳盒</button>
          <button className="btn-action secondary" onClick={handleExport}>导出 JSON</button>
          <button className="btn-action secondary" onClick={handleImportClick}>导入 JSON</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
        </div>
      </header>

      {view === 'attention' ? (
        <CommonItemsView boxes={boxes} onBack={() => setView('all')} />
      ) : (
        <>
          <ValidationWarnings warnings={warnings} />

          <div className="toolbar">
            <FilterPanel filters={filters} onFilterChange={setFilters} rooms={rooms} />
            <div className="sort-bar">
              <label>排序:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="order">摆放顺序</option>
                <option value="priority">优先级</option>
                <option value="code">编号</option>
                <option value="room">房间</option>
                <option value="weight">重量</option>
                <option value="status">确认状态</option>
              </select>
              <button className="btn-select-all" onClick={handleSelectAll}>
                {selectedIds.size === filteredBoxes.length && filteredBoxes.length > 0 ? '取消全选' : '全选'}
              </button>
              <span className="result-count">共 {filteredBoxes.length} 个盒子</span>
            </div>
          </div>

          <BatchActions
            selectedCount={selectedIds.size}
            onBatchStatus={handleBatchStatus}
            onBatchDelete={handleBatchDelete}
            onClearSelection={() => setSelectedIds(new Set())}
          />

          <BoxList
            boxes={filteredBoxes}
            onReorder={handleReorder}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingBox(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <BoxForm
              box={editingBox}
              onSave={handleSaveBox}
              onCancel={() => { setShowForm(false); setEditingBox(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
