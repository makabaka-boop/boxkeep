import { useMemo } from 'react';
import type { StorageBox } from '../types';
import { PRIORITY_LABELS, WEIGHT_LABELS, STATUS_LABELS } from '../types';
import { isHighPriority } from '../validation';

interface Props {
  boxes: StorageBox[];
}

interface CommonBox {
  box: StorageBox;
  reasons: string[];
}

function getCommonReasons(b: StorageBox): string[] {
  const reasons: string[] = [];
  if (isHighPriority(b.priority)) reasons.push(`优先查找(${PRIORITY_LABELS[b.priority]})`);
  if (b.status === 'reinforce') reasons.push('需加固');
  if (!b.notes.trim()) reasons.push('备注不完整');
  return reasons;
}

export default function CommonItemsView({ boxes }: Props) {
  const commonBoxes = useMemo<CommonBox[]>(() => {
    return boxes
      .map((b) => ({ box: b, reasons: getCommonReasons(b) }))
      .filter((c) => c.reasons.length > 0)
      .sort((a, b) => {
        const pa = a.box.priority === 'urgent' ? 0 : a.box.priority === 'high' ? 1 : 2;
        const pb = b.box.priority === 'urgent' ? 0 : b.box.priority === 'high' ? 1 : 2;
        if (pa !== pb) return pa - pb;
        return a.box.room.localeCompare(b.box.room, 'zh');
      });
  }, [boxes]);

  const byRoom = useMemo(() => {
    const map = new Map<string, CommonBox[]>();
    for (const c of commonBoxes) {
      const room = c.box.room || '未分类';
      const arr = map.get(room) ?? [];
      arr.push(c);
      map.set(room, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'zh'));
  }, [commonBoxes]);

  const highPriorityCount = commonBoxes.filter((c) => isHighPriority(c.box.priority)).length;
  const reinforceCount = commonBoxes.filter((c) => c.box.status === 'reinforce').length;
  const noNotesCount = commonBoxes.filter((c) => !c.box.notes.trim()).length;

  if (commonBoxes.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">✓</div>
        <h3>一切井然有序</h3>
        <p>没有需要优先查找、加固或补充备注的盒子。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="common-summary">
        <div className="summary-card">
          <div className="label">需关注总数</div>
          <div className="value">{commonBoxes.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">优先查找</div>
          <div className="value" style={{ color: '#c8704a' }}>{highPriorityCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">需加固</div>
          <div className="value" style={{ color: '#b8800a' }}>{reinforceCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">备注不完整</div>
          <div className="value" style={{ color: '#7c3aed' }}>{noNotesCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">涉及房间</div>
          <div className="value" style={{ color: '#4a7c8a' }}>{byRoom.length}</div>
        </div>
      </div>

      {byRoom.map(([room, items]) => (
        <div key={room} className="room-group">
          <div className="room-group-head">
            {room}
            <span className="room-count">{items.length} 个盒子</span>
          </div>
          <div className="room-group-body">
            {items.map(({ box, reasons }) => (
              <div key={box.id} className="room-box-item">
                <span className="code">{box.code}</span>
                <span className="summary">
                  {box.summary}
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>
                    {WEIGHT_LABELS[box.weight]} · {STATUS_LABELS[box.status]}
                  </span>
                </span>
                <div className="reason-tags">
                  {isHighPriority(box.priority) && <span className="mini-tag priority">优先</span>}
                  {box.status === 'reinforce' && <span className="mini-tag reinforce">加固</span>}
                  {!box.notes.trim() && <span className="mini-tag notes">缺备注</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
