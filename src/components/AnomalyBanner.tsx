import type { Anomaly } from '../types';

interface Props {
  anomalies: Anomaly[];
  onJumpToBox?: (boxId: string) => void;
}

export default function AnomalyBanner({ anomalies, onJumpToBox }: Props) {
  if (anomalies.length === 0) return null;

  const errors = anomalies.filter((a) => a.severity === 'error');
  const warnings = anomalies.filter((a) => a.severity === 'warning');
  const hasError = errors.length > 0;

  return (
    <div className={`anomaly-banner ${hasError ? 'has-error' : ''}`}>
      <div className="anomaly-banner-head">
        {hasError ? '●' : '▲'} 异常提醒（{anomalies.length}）
      </div>
      <div className="anomaly-list">
        {errors.map((a) => (
          <div key={a.id} className="anomaly-line error">
            ● {a.message}
            {a.boxIds[0] && (
              <button onClick={() => onJumpToBox?.(a.boxIds[0])}>查看</button>
            )}
          </div>
        ))}
        {warnings.map((a) => (
          <div key={a.id} className="anomaly-line warning">
            ▲ {a.message}
            {a.boxIds[0] && (
              <button onClick={() => onJumpToBox?.(a.boxIds[0])}>查看</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
