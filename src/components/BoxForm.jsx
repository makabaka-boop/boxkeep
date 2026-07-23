import React, { useState, useEffect } from 'react';
import { ROOMS, WEIGHT_LEVELS, PRIORITY_LEVELS, CONFIRM_STATUS, createEmptyBox } from '../data/model.js';

export default function BoxForm({ box, onSave, onCancel }) {
  const [form, setForm] = useState(() => box ? { ...box } : createEmptyBox());

  useEffect(() => {
    setForm(box ? { ...box } : createEmptyBox());
  }, [box]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="box-form" onSubmit={handleSubmit}>
      <h3>{box && box.id ? '编辑收纳盒' : '新增收纳盒'}</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>编号</label>
          <input
            type="text"
            value={form.code}
            onChange={e => handleChange('code', e.target.value)}
            placeholder="如 A-01"
          />
        </div>
        <div className="form-group">
          <label>所在房间</label>
          <select value={form.room} onChange={e => handleChange('room', e.target.value)}>
            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group full-width">
          <label>内容摘要</label>
          <input
            type="text"
            value={form.summary}
            onChange={e => handleChange('summary', e.target.value)}
            placeholder="如：冬季毛衣、围巾、帽子"
          />
        </div>
        <div className="form-group">
          <label>重量等级</label>
          <select value={form.weight} onChange={e => handleChange('weight', e.target.value)}>
            {WEIGHT_LEVELS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>查找优先级</label>
          <select value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
            {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>摆放顺序</label>
          <input
            type="number"
            value={form.order}
            onChange={e => handleChange('order', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="form-group">
          <label>确认状态</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
            {CONFIRM_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={form.fragile}
              onChange={e => handleChange('fragile', e.target.checked)}
            />
            易碎物品
          </label>
        </div>
        {form.fragile && (
          <div className="form-group full-width">
            <label>易碎提醒说明</label>
            <input
              type="text"
              value={form.fragileNote}
              onChange={e => handleChange('fragileNote', e.target.value)}
              placeholder="如：内含玻璃器皿，轻拿轻放"
            />
          </div>
        )}
        <div className="form-group full-width">
          <label>备注</label>
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="其他需要注意的事项..."
            rows="2"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>取消</button>
        <button type="submit" className="btn-primary">保存</button>
      </div>
    </form>
  );
}
