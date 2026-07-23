import React from 'react';

export default function ValidationWarnings({ warnings }) {
  if (warnings.length === 0) return null;

  return (
    <div className="validation-warnings">
      <div className="warnings-header">
        <span>⚠ 检测到 {warnings.length} 项异常提醒</span>
      </div>
      <ul className="warnings-list">
        {warnings.map((w, i) => (
          <li key={i} className={`warning-item warning-${w.type}`}>
            {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
