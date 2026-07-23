import type { Filters, SortKey } from '../types';
import { WEIGHT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../types';

interface Props {
  filters: Filters;
  sortKey: SortKey;
  sortAsc: boolean;
  rooms: string[];
  onChange: (f: Filters) => void;
  onSortChange: (key: SortKey) => void;
  onSortDirection: () => void;
  onReset: () => void;
}

export default function FilterBar({
  filters,
  sortKey,
  sortAsc,
  rooms,
  onChange,
  onSortChange,
  onSortDirection,
  onReset,
}: Props) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>关键词</label>
        <input
          type="text"
          placeholder="搜索编号/内容/备注..."
          value={filters.keyword}
          onChange={(e) => update('keyword', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>房间</label>
        <select value={filters.room} onChange={(e) => update('room', e.target.value)}>
          <option value="">全部房间</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>重量</label>
        <select value={filters.weight} onChange={(e) => update('weight', e.target.value as Filters['weight'])}>
          <option value="">全部</option>
          {Object.entries(WEIGHT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>优先级</label>
        <select value={filters.priority} onChange={(e) => update('priority', e.target.value as Filters['priority'])}>
          <option value="">全部</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>状态</label>
        <select value={filters.status} onChange={(e) => update('status', e.target.value as Filters['status'])}>
          <option value="">全部</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>易碎</label>
        <select value={filters.fragile} onChange={(e) => update('fragile', e.target.value as Filters['fragile'])}>
          <option value="">全部</option>
          <option value="yes">易碎</option>
          <option value="no">非易碎</option>
        </select>
      </div>

      <div className="filter-actions">
        <div className="filter-group">
          <label>排序</label>
          <select value={sortKey} onChange={(e) => onSortChange(e.target.value as SortKey)}>
            <option value="order">摆放顺序</option>
            <option value="code">编号</option>
            <option value="priority">优先级</option>
            <option value="weight">重量</option>
            <option value="updatedAt">更新时间</option>
          </select>
        </div>
        <button className="btn btn-icon" title={sortAsc ? '升序' : '降序'} onClick={onSortDirection}>
          {sortAsc ? '↑' : '↓'}
        </button>
        <button className="btn" onClick={onReset}>重置</button>
      </div>
    </div>
  );
}
