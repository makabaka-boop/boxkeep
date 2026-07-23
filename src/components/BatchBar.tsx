import type { ConfirmStatus } from '../types';
import { STATUS_LABELS } from '../types';

interface Props {
  selectedCount: number;
  totalCount: number;
  onBatchStatus: (status: ConfirmStatus) => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  onSelectAllVisible: () => void;
}

export default function BatchBar({
  selectedCount,
  totalCount,
  onBatchStatus,
  onBatchDelete,
  onClearSelection,
  onSelectAllVisible,
}: Props) {
  if (selectedCount === 0) return null;

  const statuses: ConfirmStatus[] = ['pending', 'confirmed', 'reinforce', 'deferred'];

  return (
    <div className="batch-bar">
      <span className="batch-count">已选 {selectedCount} / {totalCount}</span>
      <button className="btn btn-sm" onClick={onSelectAllVisible}>全选可见</button>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>标记为：</span>
      {statuses.map((s) => (
        <button key={s} className="btn btn-sm" onClick={() => onBatchStatus(s)}>
          {STATUS_LABELS[s]}
        </button>
      ))}
      <button className="btn btn-sm btn-danger" onClick={onBatchDelete}>批量删除</button>
      <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={onClearSelection}>取消选择</button>
    </div>
  );
}
