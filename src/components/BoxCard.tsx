import type { Box } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS, WEIGHT_LABELS } from '../types'
import type { Issue } from '../logic'

interface Props {
  box: Box
  selected: boolean
  issues: Issue[]
  draggable: boolean
  dragging: boolean
  dragOver: boolean
  onToggleSelect: (id: string) => void
  onEdit: (box: Box) => void
  onDuplicate: (box: Box) => void
  onDelete: (id: string) => void
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDrop: (id: string) => void
  onDragEnd: () => void
}

/** 单个收纳盒卡片 */
export default function BoxCard({
  box,
  selected,
  issues,
  draggable,
  dragging,
  dragOver,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const hasError = issues.some((i) => i.level === 'error')
  const hasWarning = issues.some((i) => i.level === 'warning')
  const cls = [
    'card',
    selected ? 'selected' : '',
    dragging ? 'dragging' : '',
    dragOver ? 'drag-over' : '',
    hasError ? 'has-error' : hasWarning ? 'has-warning' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      draggable={draggable}
      onDragStart={() => onDragStart(box.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(box.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(box.id)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="card-top">
        <label className="select-box">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(box.id)}
          />
        </label>
        <span className="card-code">{box.code || '未编号'}</span>
        <span className="card-order" title="摆放顺序">
          #{box.order}
        </span>
        {draggable && <span className="drag-handle" title="拖拽调整摆放顺序">⠿</span>}
      </div>

      <div className="card-room">{box.room || '未填房间'}</div>
      <div className="card-summary">{box.summary || '（无内容摘要）'}</div>

      <div className="badges">
        <span className={`badge weight-${box.weight}`}>{WEIGHT_LABELS[box.weight]}</span>
        <span className={`badge priority-${box.priority}`}>
          优先{PRIORITY_LABELS[box.priority]}
        </span>
        <span className={`badge status-${box.status}`}>{STATUS_LABELS[box.status]}</span>
        {box.fragile && <span className="badge fragile">易碎</span>}
      </div>

      {box.fragile && box.fragileNote && (
        <div className="card-fragile-note">⚠ {box.fragileNote}</div>
      )}
      {box.note && <div className="card-note">📝 {box.note}</div>}

      {issues.length > 0 && (
        <ul className="card-issues">
          {issues.map((i, idx) => (
            <li key={idx} className={i.level}>
              {i.message}
            </li>
          ))}
        </ul>
      )}

      <div className="card-actions">
        <button className="btn tiny" onClick={() => onEdit(box)}>
          编辑
        </button>
        <button className="btn tiny" onClick={() => onDuplicate(box)}>
          复制
        </button>
        <button className="btn tiny danger" onClick={() => onDelete(box.id)}>
          删除
        </button>
      </div>
    </div>
  )
}
