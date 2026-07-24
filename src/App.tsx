import { useEffect, useMemo, useRef, useState } from 'react'
import type { Box, ConfirmStatus } from './types'
import { createEmptyBox } from './types'
import {
  deleteBox,
  deleteBoxes,
  getAllBoxes,
  putBox,
  putBoxes,
  replaceAll,
} from './db'
import { downloadJSON, parseImportJSON } from './exchange'
import {
  collectRooms,
  detectIssues,
  emptyFilters,
  filterBoxes,
  issuesByBox,
  sortBoxes,
} from './logic'
import type { Filters, SortKey } from './logic'
import BoxCard from './components/BoxCard'
import BoxEditor from './components/BoxEditor'
import FilterBar from './components/FilterBar'
import BulkBar from './components/BulkBar'
import IssuePanel from './components/IssuePanel'
import CommonItemsView from './components/CommonItemsView'

type ViewMode = 'all' | 'common' | 'issues'

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sortKey, setSortKey] = useState<SortKey>('order')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Box | null>(null)
  const [view, setView] = useState<ViewMode>('all')
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string>('')

  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // ------- 初次加载：从 IndexedDB 恢复 -------
  useEffect(() => {
    getAllBoxes()
      .then((data) => setBoxes(data))
      .catch((e) => showToast(`本地数据加载失败：${String(e)}`))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  // ------- 派生数据 -------
  const rooms = useMemo(() => collectRooms(boxes), [boxes])
  const issues = useMemo(() => detectIssues(boxes), [boxes])
  const issueMap = useMemo(() => issuesByBox(issues), [issues])

  const visibleBoxes = useMemo(() => {
    const filtered = filterBoxes(boxes, filters)
    return sortBoxes(filtered, sortKey)
  }, [boxes, filters, sortKey])

  // 当可见集合变化（筛选/搜索/删除）时，剔除已不可见的选中项，
  // 避免批量操作改到看不见的盒子。
  useEffect(() => {
    const visibleIds = new Set(visibleBoxes.map((b) => b.id))
    setSelected((prev) => {
      let changed = false
      const next = new Set<string>()
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id)
        else changed = true
      })
      return changed ? next : prev
    })
  }, [visibleBoxes])

  // 仅在“摆放顺序”排序且无筛选时允许拖拽
  const canDrag =
    sortKey === 'order' &&
    !filters.keyword &&
    !filters.room &&
    !filters.weight &&
    !filters.priority &&
    !filters.status &&
    filters.fragile === 'all'

  // ------- 持久化辅助 -------
  async function commit(next: Box[]) {
    setBoxes(next)
  }

  async function upsert(box: Box) {
    const exists = boxes.some((b) => b.id === box.id)
    const next = exists ? boxes.map((b) => (b.id === box.id ? box : b)) : [...boxes, box]
    await commit(next)
    await putBox(box)
  }

  // ------- 增删改 -------
  function handleAdd() {
    const maxOrder = boxes.reduce((m, b) => Math.max(m, b.order), 0)
    setEditing(createEmptyBox(maxOrder + 1))
  }

  async function handleSave(box: Box) {
    await upsert(box)
    setEditing(null)
    showToast('已保存')
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这个收纳盒？')) return
    await commit(boxes.filter((b) => b.id !== id))
    await deleteBox(id)
    setSelected((s) => {
      const n = new Set(s)
      n.delete(id)
      return n
    })
    showToast('已删除')
  }

  async function handleDuplicate(src: Box) {
    const maxOrder = boxes.reduce((m, b) => Math.max(m, b.order), 0)
    const now = Date.now()
    const copy: Box = {
      ...src,
      id: createEmptyBox(0).id,
      code: src.code ? `${src.code}-副本` : '',
      order: maxOrder + 1,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await commit([...boxes, copy])
    await putBox(copy)
    showToast('已复制相似盒子')
  }

  // ------- 选择 -------
  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function selectAllVisible() {
    setSelected(new Set(visibleBoxes.map((b) => b.id)))
  }
  function clearSelection() {
    setSelected(new Set())
  }

  // ------- 批量操作 -------
  // 批量仅作用于「当前可见且被选中」的盒子，双重保险避免改到隐藏项。
  function selectedVisibleIds(): Set<string> {
    return new Set(visibleBoxes.filter((b) => selected.has(b.id)).map((b) => b.id))
  }

  async function bulkStatus(status: ConfirmStatus) {
    const target = selectedVisibleIds()
    if (target.size === 0) return
    const now = Date.now()
    const changed: Box[] = []
    const next = boxes.map((b) => {
      if (target.has(b.id)) {
        const nb = { ...b, status, updatedAt: now }
        changed.push(nb)
        return nb
      }
      return b
    })
    await commit(next)
    await putBoxes(changed)
    showToast(`已批量标记 ${changed.length} 个`)
  }

  async function bulkDelete() {
    const target = selectedVisibleIds()
    if (target.size === 0) return
    if (!confirm(`确认删除选中的 ${target.size} 个收纳盒？`)) return
    const ids = [...target]
    await commit(boxes.filter((b) => !target.has(b.id)))
    await deleteBoxes(ids)
    clearSelection()
    showToast(`已删除 ${ids.length} 个`)
  }

  // ------- 拖拽排序 -------
  function onDragStart(id: string) {
    dragId.current = id
    setDraggingId(id)
  }
  function onDragOver(id: string) {
    if (id !== dragOverId) setDragOverId(id)
  }
  function onDragEnd() {
    dragId.current = null
    setDraggingId(null)
    setDragOverId(null)
  }
  async function onDrop(targetId: string) {
    const srcId = dragId.current
    onDragEnd()
    if (!srcId || srcId === targetId || !canDrag) return

    const ordered = sortBoxes(boxes, 'order')
    const from = ordered.findIndex((b) => b.id === srcId)
    const to = ordered.findIndex((b) => b.id === targetId)
    if (from < 0 || to < 0) return

    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)

    const now = Date.now()
    const renumbered = ordered.map((b, i) => ({ ...b, order: i + 1, updatedAt: now }))
    await commit(renumbered)
    await putBoxes(renumbered)
    showToast('已调整摆放顺序')
  }

  // ------- 导入 / 导出 -------
  function handleExport() {
    if (boxes.length === 0) {
      showToast('暂无数据可导出')
      return
    }
    downloadJSON(boxes)
    showToast('已导出 JSON')
  }

  function handleImportClick() {
    fileInput.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseImportJSON(text)
      if (
        boxes.length > 0 &&
        !confirm(`导入将替换当前 ${boxes.length} 个盒子，改为导入的 ${imported.length} 个。是否继续？`)
      ) {
        return
      }
      await commit(imported)
      await replaceAll(imported)
      clearSelection()
      showToast(`已导入 ${imported.length} 个收纳盒`)
    } catch (err) {
      showToast(`导入失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  function highlight(ids: string[]) {
    setView('all')
    setFilters(emptyFilters)
    setHighlighted(new Set(ids))
    window.setTimeout(() => setHighlighted(new Set()), 3000)
  }

  const errorCount = issues.filter((i) => i.level === 'error').length
  const warnCount = issues.filter((i) => i.level === 'warning').length

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>📦 BoxKeep</h1>
          <span className="tagline">家庭收纳盒内容整理 · 离线本地存储</span>
        </div>
        <div className="header-actions">
          <button className="btn primary" onClick={handleAdd}>
            ＋ 新增盒子
          </button>
          <button className="btn ghost" onClick={handleImportClick}>
            导入 JSON
          </button>
          <button className="btn ghost" onClick={handleExport}>
            导出 JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImportFile}
          />
        </div>
      </header>

      <nav className="tabs">
        <button className={view === 'all' ? 'tab active' : 'tab'} onClick={() => setView('all')}>
          全部盒子 <span className="count">{boxes.length}</span>
        </button>
        <button
          className={view === 'common' ? 'tab active' : 'tab'}
          onClick={() => setView('common')}
        >
          常用物品清单
        </button>
        <button
          className={view === 'issues' ? 'tab active' : 'tab'}
          onClick={() => setView('issues')}
        >
          异常提醒
          {issues.length > 0 && (
            <span className={`count ${errorCount ? 'bad' : 'warn'}`}>{issues.length}</span>
          )}
        </button>
      </nav>

      {loading ? (
        <div className="empty-state">正在从本地恢复数据…</div>
      ) : view === 'all' ? (
        <>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            rooms={rooms}
            sortKey={sortKey}
            onSortChange={setSortKey}
            onReset={() => setFilters(emptyFilters)}
          />
          <BulkBar
            selectedCount={selected.size}
            totalCount={visibleBoxes.length}
            onSelectAll={selectAllVisible}
            onClearSelection={clearSelection}
            onBulkStatus={bulkStatus}
            onBulkDelete={bulkDelete}
          />
          {!canDrag && sortKey === 'order' && (
            <div className="hint">提示：当前有筛选条件，清空筛选后可拖拽调整摆放顺序。</div>
          )}
          {sortKey !== 'order' && (
            <div className="hint">提示：切换到「摆放顺序」排序后可拖拽卡片调整顺序。</div>
          )}

          {visibleBoxes.length === 0 ? (
            <div className="empty-state">
              {boxes.length === 0
                ? '还没有收纳盒，点击右上角「新增盒子」开始整理。'
                : '没有符合筛选条件的盒子。'}
            </div>
          ) : (
            <div className="card-grid">
              {visibleBoxes.map((box) => (
                <div key={box.id} className={highlighted.has(box.id) ? 'highlight-wrap' : ''}>
                  <BoxCard
                    box={box}
                    selected={selected.has(box.id)}
                    issues={issueMap.get(box.id) ?? []}
                    draggable={canDrag}
                    dragging={draggingId === box.id}
                    dragOver={dragOverId === box.id}
                    onToggleSelect={toggleSelect}
                    onEdit={setEditing}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : view === 'common' ? (
        <CommonItemsView boxes={boxes} onEdit={setEditing} />
      ) : (
        <IssuePanel issues={issues} onHighlight={highlight} />
      )}

      {view === 'all' && !loading && (
        <footer className="app-footer">
          共 {boxes.length} 个盒子 · 显示 {visibleBoxes.length} 个
          {errorCount > 0 && <span className="pill error">{errorCount} 错误</span>}
          {warnCount > 0 && <span className="pill warning">{warnCount} 提醒</span>}
        </footer>
      )}

      {editing && (
        <BoxEditor box={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
