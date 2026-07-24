import type { Box } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'
import { commonItems, isNoteIncomplete, summarizeByRoom } from '../logic'

interface Props {
  boxes: Box[]
  onEdit: (box: Box) => void
}

/** 常用物品清单视图：仅展示需优先查找 / 需加固 / 备注不完整的盒子，并按房间汇总 */
export default function CommonItemsView({ boxes, onEdit }: Props) {
  const items = commonItems(boxes)
  const summary = summarizeByRoom(items)

  if (items.length === 0) {
    return (
      <div className="common-view empty">
        暂无需要重点关注的盒子。<br />
        （满足以下任一条件才会出现在这里：查找优先级为「高」、状态为「需加固」、或备注不完整。）
      </div>
    )
  }

  function reasons(b: Box): string[] {
    const r: string[] = []
    if (b.priority === 'high') r.push('优先查找')
    if (b.status === 'reinforce') r.push('需加固')
    if (isNoteIncomplete(b)) r.push('备注不完整')
    return r
  }

  return (
    <div className="common-view">
      <div className="room-summary">
        {summary.map((s) => (
          <div key={s.room} className="room-summary-card">
            <div className="room-name">{s.room}</div>
            <div className="room-count">{s.count}</div>
            <div className="room-detail">
              优先 {s.highPriority} · 加固 {s.reinforce} · 易碎 {s.fragile}
            </div>
          </div>
        ))}
      </div>

      <table className="common-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>房间</th>
            <th>内容</th>
            <th>优先级</th>
            <th>状态</th>
            <th>关注原因</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td>{b.code || '未编号'}</td>
              <td>{b.room || '未填'}</td>
              <td className="col-summary">{b.summary || '（无摘要）'}</td>
              <td>{PRIORITY_LABELS[b.priority]}</td>
              <td>{STATUS_LABELS[b.status]}</td>
              <td>
                {reasons(b).map((r) => (
                  <span key={r} className="reason-tag">
                    {r}
                  </span>
                ))}
              </td>
              <td>
                <button className="btn tiny" onClick={() => onEdit(b)}>
                  编辑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
