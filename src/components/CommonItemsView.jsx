import React from 'react';
import { getAttentionBoxes, getRoomSummary } from '../data/validation.js';
import { WEIGHT_LEVELS, PRIORITY_LEVELS, CONFIRM_STATUS } from '../data/model.js';

const getLabel = (arr, val) => arr.find(x => x.value === val) || { label: val, color: '#999' };

export default function CommonItemsView({ boxes, onBack }) {
  const attentionBoxes = getAttentionBoxes(boxes);
  const roomSummary = getRoomSummary(attentionBoxes);

  const groupedByRoom = {};
  for (const box of attentionBoxes) {
    if (!groupedByRoom[box.room]) groupedByRoom[box.room] = [];
    groupedByRoom[box.room].push(box);
  }

  const rooms = Object.keys(groupedByRoom).sort();

  const getReason = (box) => {
    const reasons = [];
    if (box.priority === 'high') reasons.push('高优先级');
    if (box.status === 'reinforce') reasons.push('需加固');
    if (box.status === 'pending' && !box.summary) reasons.push('缺少摘要');
    if (box.fragile && !box.fragileNote && !box.notes) reasons.push('易碎缺提醒');
    return reasons;
  };

  return (
    <div className="common-items-view">
      <div className="view-header">
        <button className="btn-back" onClick={onBack}>← 返回全部盒子</button>
        <h2>📋 常用物品清单</h2>
        <span className="view-subtitle">需优先查找、需加固或备注不完整的盒子</span>
      </div>

      <div className="room-summary-grid">
        {Object.entries(roomSummary).sort(([a], [b]) => a.localeCompare(b)).map(([room, stats]) => (
          <div key={room} className="summary-card">
            <div className="summary-room">{room}</div>
            <div className="summary-numbers">
              <span className="summary-total">{stats.total}</span>
              <span className="summary-label">需关注</span>
            </div>
            <div className="summary-detail">
              {stats.highPriority > 0 && <span className="detail-item high">🔴 高优 {stats.highPriority}</span>}
              {stats.reinforce > 0 && <span className="detail-item warn">🟡 加固 {stats.reinforce}</span>}
              {stats.fragile > 0 && <span className="detail-item fragile">⚠ 易碎 {stats.fragile}</span>}
              {stats.heavy > 0 && <span className="detail-item heavy">⚖ 重 {stats.heavy}</span>}
              {stats.pending > 0 && <span className="detail-item">⏳ 待整理 {stats.pending}</span>}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <p>✨ 没有需要特别关注的盒子，收纳状态良好！</p>
        </div>
      ) : (
        rooms.map(room => (
          <div key={room} className="attention-group">
            <h3>
              📍 {room}
              <span className="group-count">{groupedByRoom[room].length} 项需关注</span>
            </h3>
            <div className="attention-list">
              {groupedByRoom[room].map(box => {
                const reasons = getReason(box);
                const priorityInfo = getLabel(PRIORITY_LEVELS, box.priority);
                const statusInfo = getLabel(CONFIRM_STATUS, box.status);
                return (
                  <div key={box.id} className="attention-item">
                    <div className="attention-code">{box.code || '(无编号)'}</div>
                    <div className="attention-summary">{box.summary || '(无摘要)'}</div>
                    <div className="attention-reasons">
                      {reasons.map((r, i) => (
                        <span key={i} className="reason-tag">{r}</span>
                      ))}
                    </div>
                    <div className="attention-meta">
                      <span className="meta-item" style={{ color: priorityInfo.color }}>
                        优先: {priorityInfo.label}
                      </span>
                      <span className="meta-item" style={{ color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                      <span className="meta-item">顺序 #{box.order}</span>
                    </div>
                    {box.fragile && box.fragileNote && (
                      <div className="attention-note">⚠ {box.fragileNote}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
