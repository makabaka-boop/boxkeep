import React from 'react';
import { ROOMS, WEIGHT_LEVELS, PRIORITY_LEVELS, CONFIRM_STATUS } from '../data/model.js';

export default function FilterPanel({ filters, onFilterChange, rooms }) {
  const update = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeRoomOptions = rooms.length > 0 ? rooms : ROOMS;

  return (
    <div className="filter-panel">
      <div className="filter-row">
        <div className="filter-item">
          <label>房间</label>
          <select value={filters.room} onChange={e => update('room', e.target.value)}>
            <option value="">全部房间</option>
            {activeRoomOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>重量</label>
          <select value={filters.weight} onChange={e => update('weight', e.target.value)}>
            <option value="">全部重量</option>
            {WEIGHT_LEVELS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>优先级</label>
          <select value={filters.priority} onChange={e => update('priority', e.target.value)}>
            <option value="">全部优先级</option>
            {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>确认状态</label>
          <select value={filters.status} onChange={e => update('status', e.target.value)}>
            <option value="">全部状态</option>
            {CONFIRM_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>易碎</label>
          <select value={filters.fragile} onChange={e => update('fragile', e.target.value)}>
            <option value="">全部</option>
            <option value="yes">仅易碎</option>
            <option value="no">非易碎</option>
          </select>
        </div>
        <button className="btn-reset" onClick={() => onFilterChange({ room: '', weight: '', priority: '', status: '', fragile: '' })}>
          重置筛选
        </button>
      </div>
    </div>
  );
}
