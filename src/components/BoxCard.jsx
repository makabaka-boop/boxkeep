import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WEIGHT_LEVELS, PRIORITY_LEVELS, CONFIRM_STATUS } from '../data/model.js';

const getLabel = (arr, val) => arr.find(x => x.value === val) || { label: val, color: '#999' };

export default function BoxCard({ box, selected, onSelect, onEdit, onCopy, onDelete, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: box.id, data: { box } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const weightInfo = getLabel(WEIGHT_LEVELS, box.weight);
  const priorityInfo = getLabel(PRIORITY_LEVELS, box.priority);
  const statusInfo = getLabel(CONFIRM_STATUS, box.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`box-card ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-header">
        <div className="card-drag-handle" {...attributes} {...listeners} title="拖拽调整顺序">
          ⋮⋮
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(box.id, e.target.checked)}
          className="card-checkbox"
        />
        <span className="card-code">{box.code || '(无编号)'}</span>
        <span className="card-badge" style={{ background: statusInfo.color }}>{statusInfo.label}</span>
        {box.fragile && <span className="card-badge fragile-badge">⚠ 易碎</span>}
        <div className="card-actions">
          <button className="icon-btn" onClick={() => onCopy(box)} title="复制">⧉</button>
          <button className="icon-btn" onClick={() => onEdit(box)} title="编辑">✎</button>
          <button className="icon-btn delete" onClick={() => onDelete(box.id)} title="删除">✕</button>
        </div>
      </div>
      <div className="card-body">
        <div className="card-room">📍 {box.room} · 顺序 #{box.order}</div>
        <div className="card-summary">{box.summary || '(无内容摘要)'}</div>
        <div className="card-tags">
          <span className="tag" style={{ borderColor: weightInfo.color, color: weightInfo.color }}>
            重量: {weightInfo.label}
          </span>
          <span className="tag" style={{ borderColor: priorityInfo.color, color: priorityInfo.color }}>
            优先级: {priorityInfo.label}
          </span>
        </div>
        {box.fragile && box.fragileNote && (
          <div className="card-note fragile-note-text">⚠ {box.fragileNote}</div>
        )}
        {box.notes && (
          <div className="card-note">📝 {box.notes}</div>
        )}
      </div>
    </div>
  );
}
