import { useState, useEffect } from 'react';
import type { StorageBox, BoxDraft, WeightLevel, Priority, ConfirmStatus } from '../types';
import { DEFAULT_ROOMS, WEIGHT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../types';

interface Props {
  initial?: StorageBox | null;
  mode: 'create' | 'edit' | 'copy';
  allRooms: string[];
  nextOrder: number;
  existingCodes: string[];
  onSave: (draft: BoxDraft) => void;
  onClose: () => void;
}

const EMPTY_DRAFT: BoxDraft = {
  code: '',
  room: DEFAULT_ROOMS[0],
  summary: '',
  weight: 'medium',
  fragile: false,
  fragileNote: '',
  priority: 'normal',
  order: 1,
  status: 'pending',
  notes: '',
};

export default function BoxForm({ initial, mode, allRooms, nextOrder, existingCodes, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<BoxDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      const d: BoxDraft = {
        code: mode === 'copy' ? initial.code + '-副本' : initial.code,
        room: initial.room,
        summary: initial.summary,
        weight: initial.weight,
        fragile: initial.fragile,
        fragileNote: initial.fragileNote,
        priority: initial.priority,
        order: mode === 'copy' ? nextOrder : initial.order,
        status: initial.status,
        notes: initial.notes,
      };
      setDraft(d);
    } else {
      setDraft({ ...EMPTY_DRAFT, order: nextOrder });
    }
  }, [initial, mode, nextOrder]);

  const rooms = Array.from(new Set([...DEFAULT_ROOMS, ...allRooms]));

  function update<K extends keyof BoxDraft>(key: K, value: BoxDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const code = draft.code.trim();
    if (!code) e.code = '请填写编号';
    else {
      let isDup = false;
      if (mode === 'edit' && initial) {
        if (code !== initial.code.trim()) {
          isDup = existingCodes.some((c) => c === code);
        }
      } else {
        isDup = existingCodes.some((c) => c === code);
      }
      if (isDup) {
        e.code = mode === 'copy' ? '编号已存在，请修改' : '编号已存在';
      }
    }
    if (!draft.room.trim()) e.room = '请填写房间';
    if (!draft.summary.trim()) e.summary = '请填写内容摘要';
    if (draft.order < 0) e.order = '顺序不能为负';
    if (draft.fragile && !draft.fragileNote.trim()) {
      e.fragileNote = '易碎盒请填写提醒内容';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) {
      onSave({
        ...draft,
        code: draft.code.trim(),
        room: draft.room.trim(),
        summary: draft.summary.trim(),
        fragileNote: draft.fragileNote.trim(),
        notes: draft.notes.trim(),
      });
    }
  }

  const title = mode === 'edit' ? '编辑收纳盒' : mode === 'copy' ? '复制收纳盒' : '新增收纳盒';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-head">
            <h2>{title}</h2>
            <button type="button" className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label>编号 <span className="req">*</span></label>
                <input
                  type="text"
                  value={draft.code}
                  onChange={(e) => update('code', e.target.value)}
                  placeholder="如 A-01"
                  autoFocus
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
              </div>
              <div className="form-field">
                <label>所在房间 <span className="req">*</span></label>
                <input
                  type="text"
                  list="room-list"
                  value={draft.room}
                  onChange={(e) => update('room', e.target.value)}
                  placeholder="房间名称"
                />
                <datalist id="room-list">
                  {rooms.map((r) => <option key={r} value={r} />)}
                </datalist>
                {errors.room && <span className="form-error">{errors.room}</span>}
              </div>
            </div>

            <div className="form-row full">
              <div className="form-field">
                <label>内容摘要 <span className="req">*</span></label>
                <textarea
                  value={draft.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  placeholder="简要描述盒内物品"
                />
                {errors.summary && <span className="form-error">{errors.summary}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>重量等级</label>
                <select value={draft.weight} onChange={(e) => update('weight', e.target.value as WeightLevel)}>
                  {Object.entries(WEIGHT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>查找优先级</label>
                <select value={draft.priority} onChange={(e) => update('priority', e.target.value as Priority)}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>摆放顺序</label>
                <input
                  type="number"
                  min={0}
                  value={draft.order}
                  onChange={(e) => update('order', parseInt(e.target.value) || 0)}
                />
                {errors.order && <span className="form-error">{errors.order}</span>}
              </div>
              <div className="form-field">
                <label>确认状态</label>
                <select value={draft.status} onChange={(e) => update('status', e.target.value as ConfirmStatus)}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field checkbox-field">
                <input
                  type="checkbox"
                  id="fragile-check"
                  checked={draft.fragile}
                  onChange={(e) => update('fragile', e.target.checked)}
                />
                <label htmlFor="fragile-check">易碎物品</label>
              </div>
            </div>

            {draft.fragile && (
              <div className="form-row full">
                <div className="form-field">
                  <label>易碎提醒 <span className="req">*</span></label>
                  <input
                    type="text"
                    value={draft.fragileNote}
                    onChange={(e) => update('fragileNote', e.target.value)}
                    placeholder="如：轻拿轻放，朝上放置"
                  />
                  {errors.fragileNote && <span className="form-error">{errors.fragileNote}</span>}
                </div>
              </div>
            )}

            <div className="form-row full">
              <div className="form-field">
                <label>备注</label>
                <textarea
                  value={draft.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="其他需要注意的信息"
                />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
