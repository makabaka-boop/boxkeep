import type { ConfirmStatus } from '../types'
import { STATUS_LABELS, STATUS_OPTIONS } from '../types'

interface Props {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkStatus: (status: ConfirmStatus) => void
  onBulkDelete: () => void
}

/** 批量操作条 */
export default function BulkBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkStatus,
  onBulkDelete,
}: Props) {
  const disabled = selectedCount === 0
  return (
    <div className="bulk-bar">
      <span className="bulk-count">
        已选 <b>{selectedCount}</b> / {totalCount}
      </span>
      <button className="btn ghost" onClick={onSelectAll}>
        全选当前
      </button>
      <button className="btn ghost" onClick={onClearSelection} disabled={disabled}>
        清除选择
      </button>

      <span className="bulk-sep">批量标记：</span>
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s}
          className={`btn small status-${s}`}
          disabled={disabled}
          onClick={() => onBulkStatus(s)}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}

      <button className="btn small danger" disabled={disabled} onClick={onBulkDelete}>
        批量删除
      </button>
    </div>
  )
}
