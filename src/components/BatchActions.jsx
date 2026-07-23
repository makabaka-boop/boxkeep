import React from 'react';
import { CONFIRM_STATUS } from '../data/model.js';

export default function BatchActions({ selectedCount, onBatchStatus, onBatchDelete, onClearSelection }) {
  if (selectedCount === 0) return null;

  return (
    <div className="batch-actions">
      <span className="batch-count">已选 {selectedCount} 项</span>
      <div className="batch-buttons">
        {CONFIRM_STATUS.map(s => (
          <button
            key={s.value}
            className="btn-batch"
            style={{ borderColor: s.color, color: s.color }}
            onClick={() => onBatchStatus(s.value)}
          >
            标记为「{s.label}」
          </button>
        ))}
        <button className="btn-batch delete-btn" onClick={onBatchDelete}>删除选中</button>
        <button className="btn-batch cancel-btn" onClick={onClearSelection}>取消选择</button>
      </div>
    </div>
  );
}
