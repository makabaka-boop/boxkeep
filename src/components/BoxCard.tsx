import type { StorageBox, Anomaly } from '../types';
import { WEIGHT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../types';
import { anomaliesForBox } from '../validation';

interface Props {
  box: StorageBox;
  allAnomalies: Anomaly[];
  selected: boolean;
  dragging: boolean;
  dragOver: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (box: StorageBox) => void;
  onCopy: (box: StorageBox) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onAnomalyClick?: (boxId: string) => void;
}

export default function BoxCard({
  box,
  allAnomalies,
  selected,
  dragging,
  dragOver,
  onToggleSelect,
  onEdit,
  onCopy,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: Props) {
  const boxAnomalies = anomaliesForBox(box.id, allAnomalies);
  const hasError = boxAnomalies.some((a) => a.severity === 'error');
  const hasWarning = boxAnomalies.some((a) => a.severity === 'warning');
  const cardClass = [
    'box-card',
    selected ? 'selected' : '',
    dragging ? 'dragging' : '',
    dragOver ? 'drag-over' : '',
    hasError ? 'has-error' : hasWarning ? 'has-anomaly' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      draggable
      onDragStart={() => onDragStart(box.id)}
      onDragOver={(e) => onDragOver(e, box.id)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(box.id)}
      onDragEnd={onDragEnd}
    >
      <div className="box-head">
        <span className="drag-handle" title="拖拽调整顺序">⠿</span>
        <input
          type="checkbox"
          className="box-checkbox"
          checked={selected}
          onChange={() => onToggleSelect(box.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="box-code">{box.code}</span>
        <span className="box-order" title="摆放顺序">#{box.order}</span>
        <span className="box-room">{box.room}</span>
      </div>

      <div className="box-summary">{box.summary || <em style={{ color: 'var(--text-muted)' }}>无摘要</em>}</div>

      <div className="box-meta">
        <span className={`tag tag-weight-${box.weight}`}>重量: {WEIGHT_LABELS[box.weight]}</span>
        <span className={`tag tag-priority-${box.priority}`}>优先级: {PRIORITY_LABELS[box.priority]}</span>
        <span className={`tag tag-status-${box.status}`}>{STATUS_LABELS[box.status]}</span>
        {box.fragile && <span className="tag tag-fragile">⚠ 易碎</span>}
      </div>

      {boxAnomalies.length > 0 && (
        <div className="box-anomalies">
          {boxAnomalies.map((a) => (
            <span key={a.id} className={`anomaly-item ${a.severity}`}>
              {a.severity === 'error' ? '●' : '▲'} {a.message}
            </span>
          ))}
        </div>
      )}

      {box.fragile && box.fragileNote && (
        <div className="box-notes" style={{ background: '#f3e8fd', color: '#7c3aed' }}>
          易碎提醒：{box.fragileNote}
        </div>
      )}

      <div className={`box-notes ${!box.notes ? 'box-notes-empty' : ''}`}>
        {box.notes || '暂无备注'}
      </div>

      <div className="box-actions">
        <button className="btn btn-sm" onClick={() => onEdit(box)}>编辑</button>
        <button className="btn btn-sm" onClick={() => onCopy(box)}>复制</button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(box.id)}>删除</button>
      </div>
    </div>
  );
}
