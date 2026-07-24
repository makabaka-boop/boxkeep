import type { Issue } from '../logic'

interface Props {
  issues: Issue[]
  onHighlight: (boxIds: string[]) => void
}

/** 异常提醒面板 */
export default function IssuePanel({ issues, onHighlight }: Props) {
  if (issues.length === 0) {
    return <div className="issue-panel empty">✅ 未检测到异常，收纳信息状态良好。</div>
  }
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')

  return (
    <div className="issue-panel">
      <div className="issue-summary">
        共 <b>{issues.length}</b> 项异常
        {errors.length > 0 && <span className="pill error">{errors.length} 错误</span>}
        {warnings.length > 0 && <span className="pill warning">{warnings.length} 提醒</span>}
      </div>
      <ul>
        {issues.map((i, idx) => (
          <li key={idx} className={i.level}>
            <span className="issue-msg">{i.message}</span>
            <button className="btn tiny" onClick={() => onHighlight(i.boxIds)}>
              定位 {i.boxIds.length} 个
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
