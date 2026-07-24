import { useEffect, useState } from 'react'
import type { Box } from '../types'
import {
  COMMON_ROOMS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  WEIGHT_LABELS,
  WEIGHT_OPTIONS,
} from '../types'

interface Props {
  box: Box
  onSave: (box: Box) => void
  onCancel: () => void
}

/** 收纳盒新增 / 编辑表单 */
export default function BoxEditor({ box, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Box>(box)

  useEffect(() => setDraft(box), [box])

  function set<K extends keyof Box>(key: K, value: Box[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...draft, updatedAt: Date.now() })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{box.code ? `编辑 · ${box.code}` : '新增收纳盒'}</h2>

        <div className="form-grid">
          <label>
            编号
            <input
              value={draft.code}
              placeholder="如 A-01"
              onChange={(e) => set('code', e.target.value)}
              autoFocus
            />
          </label>

          <label>
            所在房间
            <input
              list="room-options"
              value={draft.room}
              placeholder="如 储物间"
              onChange={(e) => set('room', e.target.value)}
            />
            <datalist id="room-options">
              {COMMON_ROOMS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>

          <label className="span-2">
            内容摘要
            <input
              value={draft.summary}
              placeholder="盒子里装了什么"
              onChange={(e) => set('summary', e.target.value)}
            />
          </label>

          <label>
            重量等级
            <select value={draft.weight} onChange={(e) => set('weight', e.target.value as Box['weight'])}>
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_LABELS[w]}
                </option>
              ))}
            </select>
          </label>

          <label>
            查找优先级
            <select
              value={draft.priority}
              onChange={(e) => set('priority', e.target.value as Box['priority'])}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label>
            摆放顺序
            <input
              type="number"
              value={draft.order}
              onChange={(e) => set('order', Number(e.target.value))}
            />
          </label>

          <label>
            确认状态
            <select
              value={draft.status}
              onChange={(e) => set('status', e.target.value as Box['status'])}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-label span-2">
            <input
              type="checkbox"
              checked={draft.fragile}
              onChange={(e) => set('fragile', e.target.checked)}
            />
            易碎物品
          </label>

          {draft.fragile && (
            <label className="span-2">
              易碎提醒
              <input
                value={draft.fragileNote}
                placeholder="如 轻拿轻放 / 内含玻璃"
                onChange={(e) => set('fragileNote', e.target.value)}
              />
            </label>
          )}

          <label className="span-2">
            备注
            <textarea
              value={draft.note}
              rows={2}
              placeholder="补充说明"
              onChange={(e) => set('note', e.target.value)}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn primary">
            保存
          </button>
        </div>
      </form>
    </div>
  )
}
