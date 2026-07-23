import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { StorageBox, BoxDraft, Filters, SortKey, ConfirmStatus } from './types';
import { PRIORITY_ORDER, WEIGHT_ORDER } from './types';
import {
  getAllBoxes,
  saveBox,
  deleteBox,
  bulkPutBoxes,
  bulkDeleteBoxes,
  createBoxFromDraft,
  exportData,
  importData,
} from './db';
import { detectAnomalies } from './validation';
import FilterBar from './components/FilterBar';
import BoxCard from './components/BoxCard';
import BoxForm from './components/BoxForm';
import BatchBar from './components/BatchBar';
import AnomalyBanner from './components/AnomalyBanner';
import CommonItemsView from './components/CommonItemsView';

const DEFAULT_FILTERS: Filters = {
  room: '',
  weight: '',
  priority: '',
  status: '',
  fragile: '',
  keyword: '',
};

type Tab = 'all' | 'common';

export default function App() {
  const [boxes, setBoxes] = useState<StorageBox[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'copy';
    box: StorageBox | null;
  }>({ open: false, mode: 'create', box: null });
  const [toast, setToast] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllBoxes().then((data) => {
      setBoxes(data);
      setLoaded(true);
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const anomalies = useMemo(() => detectAnomalies(boxes), [boxes]);

  const allRooms = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.room).filter(Boolean))).sort(),
    [boxes]
  );

  const existingCodes = useMemo(() => boxes.map((b) => b.code), [boxes]);

  const nextOrder = useMemo(() => {
    if (boxes.length === 0) return 1;
    return Math.max(...boxes.map((b) => b.order)) + 1;
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    let result = boxes.filter((b) => {
      if (filters.room && b.room !== filters.room) return false;
      if (filters.weight && b.weight !== filters.weight) return false;
      if (filters.priority && b.priority !== filters.priority) return false;
      if (filters.status && b.status !== filters.status) return false;
      if (filters.fragile === 'yes' && !b.fragile) return false;
      if (filters.fragile === 'no' && b.fragile) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const haystack = `${b.code} ${b.room} ${b.summary} ${b.notes} ${b.fragileNote}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'order':
          cmp = a.order - b.order;
          break;
        case 'code':
          cmp = a.code.localeCompare(b.code, 'zh', { numeric: true });
          break;
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'weight':
          cmp = WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight];
          break;
        case 'updatedAt':
          cmp = a.updatedAt - b.updatedAt;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [boxes, filters, sortKey, sortAsc]);

  const commonCount = useMemo(() => {
    return boxes.filter((b) => {
      if (b.priority === 'high' || b.priority === 'urgent') return true;
      if (b.status === 'reinforce') return true;
      if (!b.notes.trim()) return true;
      return false;
    }).length;
  }, [boxes]);

  async function persistBox(draft: BoxDraft) {
    const existing = formState.mode === 'edit' && formState.box ? formState.box : undefined;
    const box = createBoxFromDraft(draft, existing);
    await saveBox(box);
    const fresh = await getAllBoxes();
    setBoxes(fresh);
    setFormState({ open: false, mode: 'create', box: null });
    showToast(formState.mode === 'edit' ? '已更新收纳盒' : '已保存收纳盒');
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除该收纳盒？')) return;
    await deleteBox(id);
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('已删除收纳盒');
  }

  async function handleBatchStatus(status: ConfirmStatus) {
    const ids = Array.from(selected);
    const updated = boxes
      .filter((b) => ids.includes(b.id))
      .map((b) => ({ ...b, status, updatedAt: Date.now() }));
    await bulkPutBoxes(updated);
    const fresh = await getAllBoxes();
    setBoxes(fresh);
    setSelected(new Set());
    showToast(`已将 ${ids.length} 个盒子标记为「${statusLabel(status)}」`);
  }

  async function handleBatchDelete() {
    const ids = Array.from(selected);
    if (!confirm(`确定删除选中的 ${ids.length} 个收纳盒？`)) return;
    await bulkDeleteBoxes(ids);
    setBoxes((prev) => prev.filter((b) => !ids.includes(b.id)));
    setSelected(new Set());
    showToast(`已删除 ${ids.length} 个收纳盒`);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(filteredBoxes.map((b) => b.id)));
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (dragId && dragId !== id) {
      setDragOverId(id);
    }
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const sourceBox = boxes.find((b) => b.id === dragId);
    const targetBox = boxes.find((b) => b.id === targetId);
    if (!sourceBox || !targetBox) return;

    const sourceOrder = sourceBox.order;
    const targetOrder = targetBox.order;

    const updated = boxes.map((b) => {
      if (b.id === dragId) return { ...b, order: targetOrder, updatedAt: Date.now() };
      if (b.id === targetId) return { ...b, order: sourceOrder, updatedAt: Date.now() };
      return b;
    });
    await bulkPutBoxes(updated.filter((b) => b.id === dragId || b.id === targetId));
    setBoxes(updated);
    setDragId(null);
    setDragOverId(null);
    showToast('已交换摆放顺序');
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  async function handleExport() {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boxkeep-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('已导出 JSON 文件');
    } catch {
      showToast('导出失败');
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importData(text);
      const fresh = await getAllBoxes();
      setBoxes(fresh);
      showToast(`已导入 ${count} 个收纳盒`);
    } catch (err) {
      showToast('导入失败：' + (err instanceof Error ? err.message : '格式错误'));
    }
    e.target.value = '';
  }

  function openCreate() {
    setFormState({ open: true, mode: 'create', box: null });
  }

  function openEdit(box: StorageBox) {
    setFormState({ open: true, mode: 'edit', box });
  }

  function openCopy(box: StorageBox) {
    setFormState({ open: true, mode: 'copy', box });
  }

  function closeForm() {
    setFormState({ open: false, mode: 'create', box: null });
  }

  function jumpToBox(boxId: string) {
    const el = document.querySelector(`[data-box-id="${boxId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).style.transition = 'background 0.3s';
      (el as HTMLElement).style.background = 'var(--warning-soft)';
      setTimeout(() => {
        (el as HTMLElement).style.background = '';
      }, 2000);
    }
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSortKey('order');
    setSortAsc(true);
  }

  if (!loaded) {
    return (
      <div className="app">
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>加载中...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>📦 BoxKeep</h1>
          <span className="subtitle">家庭收纳盒整理 · 离线可用 · 数据保存在本地浏览器</span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={handleImportClick}>导入 JSON</button>
          <button className="btn" onClick={handleExport}>导出 JSON</button>
          <button className="btn btn-primary" onClick={openCreate}>+ 新增盒子</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          全部盒子<span className="tab-count">{boxes.length}</span>
        </button>
        <button
          className={`tab ${tab === 'common' ? 'active' : ''}`}
          onClick={() => setTab('common')}
        >
          常用物品清单<span className="tab-count">{commonCount}</span>
        </button>
      </div>

      {tab === 'all' && (
        <>
          <AnomalyBanner anomalies={anomalies} onJumpToBox={jumpToBox} />

          <FilterBar
            filters={filters}
            sortKey={sortKey}
            sortAsc={sortAsc}
            rooms={allRooms}
            onChange={setFilters}
            onSortChange={setSortKey}
            onSortDirection={() => setSortAsc((v) => !v)}
            onReset={resetFilters}
          />

          <div className="sort-bar">
            <span>共 {filteredBoxes.length} 个盒子</span>
            <span className="result-count">
              提示：拖拽卡片可以交换摆放顺序
            </span>
          </div>

          {filteredBoxes.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>{boxes.length === 0 ? '还没有收纳盒记录' : '没有符合条件的盒子'}</h3>
              <p>{boxes.length === 0 ? '点击右上角「新增盒子」开始记录' : '尝试调整筛选条件'}</p>
              {boxes.length === 0 && (
                <button className="btn btn-primary" onClick={openCreate}>+ 新增第一个盒子</button>
              )}
            </div>
          ) : (
            <div className="box-grid">
              {filteredBoxes.map((box) => (
                <div key={box.id} data-box-id={box.id}>
                  <BoxCard
                    box={box}
                    allAnomalies={anomalies}
                    selected={selected.has(box.id)}
                    dragging={dragId === box.id}
                    dragOver={dragOverId === box.id}
                    onToggleSelect={toggleSelect}
                    onEdit={openEdit}
                    onCopy={openCopy}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              ))}
            </div>
          )}

          <BatchBar
            selectedCount={selected.size}
            totalCount={filteredBoxes.length}
            onBatchStatus={handleBatchStatus}
            onBatchDelete={handleBatchDelete}
            onClearSelection={() => setSelected(new Set())}
            onSelectAllVisible={selectAllVisible}
          />
        </>
      )}

      {tab === 'common' && (
        <CommonItemsView boxes={boxes} />
      )}

      {formState.open && (
        <BoxForm
          initial={formState.box}
          mode={formState.mode}
          allRooms={allRooms}
          nextOrder={nextOrder}
          existingCodes={existingCodes}
          onSave={persistBox}
          onClose={closeForm}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function statusLabel(s: ConfirmStatus): string {
  const labels: Record<ConfirmStatus, string> = {
    pending: '待整理',
    confirmed: '已确认',
    reinforce: '需加固',
    deferred: '暂缓处理',
  };
  return labels[s];
}
