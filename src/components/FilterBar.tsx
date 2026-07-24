import type { Filters, SortKey } from '../logic'
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  WEIGHT_LABELS,
  WEIGHT_OPTIONS,
} from '../types'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  rooms: string[]
  sortKey: SortKey
  onSortChange: (k: SortKey) => void
  onReset: () => void
}

const SORT_LABELS: Record<SortKey, string> = {
  order: '摆放顺序',
  priority: '优先级',
  weight: '重量',
  room: '房间',
  code: '编号',
  status: '确认状态',
}

/** 筛选与排序工具条 */
export default function FilterBar({
  filters,
  onChange,
  rooms,
  sortKey,
  onSortChange,
  onReset,
}: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="filter-bar">
      <input
        className="search"
        value={filters.keyword}
        placeholder="搜索编号 / 内容 / 备注…"
        onChange={(e) => set('keyword', e.target.value)}
      />

      <select value={filters.room} onChange={(e) => set('room', e.target.value)}>
        <option value="">全部房间</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select value={filters.weight} onChange={(e) => set('weight', e.target.value as Filters['weight'])}>
        <option value="">全部重量</option>
        {WEIGHT_OPTIONS.map((w) => (
          <option key={w} value={w}>
            {WEIGHT_LABELS[w]}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => set('priority', e.target.value as Filters['priority'])}
      >
        <option value="">全部优先级</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      <select value={filters.status} onChange={(e) => set('status', e.target.value as Filters['status'])}>
        <option value="">全部状态</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select value={filters.fragile} onChange={(e) => set('fragile', e.target.value as Filters['fragile'])}>
        <option value="all">易碎：全部</option>
        <option value="yes">仅易碎</option>
        <option value="no">仅非易碎</option>
      </select>

      <div className="sort-group">
        <span>排序</span>
        <select value={sortKey} onChange={(e) => onSortChange(e.target.value as SortKey)}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <button className="btn ghost" onClick={onReset}>
        重置筛选
      </button>
    </div>
  )
}
