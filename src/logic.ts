// 纯逻辑：筛选、排序、异常检测、房间汇总、常用物品清单
import type { Box, ConfirmStatus, Priority, WeightLevel } from './types'

// ---------------- 筛选 ----------------

export interface Filters {
  keyword: string
  room: string // '' 表示全部
  weight: WeightLevel | ''
  priority: Priority | ''
  status: ConfirmStatus | ''
  fragile: 'all' | 'yes' | 'no'
}

export const emptyFilters: Filters = {
  keyword: '',
  room: '',
  weight: '',
  priority: '',
  status: '',
  fragile: 'all',
}

export function filterBoxes(boxes: Box[], f: Filters): Box[] {
  const kw = f.keyword.trim().toLowerCase()
  return boxes.filter((b) => {
    if (f.room && b.room !== f.room) return false
    if (f.weight && b.weight !== f.weight) return false
    if (f.priority && b.priority !== f.priority) return false
    if (f.status && b.status !== f.status) return false
    if (f.fragile === 'yes' && !b.fragile) return false
    if (f.fragile === 'no' && b.fragile) return false
    if (kw) {
      const hay = `${b.code} ${b.room} ${b.summary} ${b.note} ${b.fragileNote}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
}

// ---------------- 排序 ----------------

export type SortKey = 'order' | 'priority' | 'weight' | 'room' | 'code' | 'status'

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const WEIGHT_RANK: Record<WeightLevel, number> = { heavy: 0, medium: 1, light: 2 }
const STATUS_RANK: Record<ConfirmStatus, number> = {
  reinforce: 0,
  pending: 1,
  hold: 2,
  confirmed: 3,
}

export function sortBoxes(boxes: Box[], key: SortKey): Box[] {
  const arr = [...boxes]
  switch (key) {
    case 'order':
      arr.sort((a, b) => a.order - b.order)
      break
    case 'priority':
      arr.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order)
      break
    case 'weight':
      arr.sort((a, b) => WEIGHT_RANK[a.weight] - WEIGHT_RANK[b.weight] || a.order - b.order)
      break
    case 'room':
      arr.sort((a, b) => a.room.localeCompare(b.room, 'zh') || a.order - b.order)
      break
    case 'code':
      arr.sort((a, b) => a.code.localeCompare(b.code, 'zh', { numeric: true }) || a.order - b.order)
      break
    case 'status':
      arr.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.order - b.order)
      break
  }
  return arr
}

// ---------------- 异常检测 ----------------

export type IssueLevel = 'error' | 'warning'

export interface Issue {
  level: IssueLevel
  code:
    | 'duplicate-code'
    | 'too-many-in-room'
    | 'fragile-no-note'
    | 'duplicate-order'
    | 'too-many-high-priority'
  message: string
  /** 涉及的盒子 ID */
  boxIds: string[]
}

/** 单房间重盒过多的阈值 */
export const ROOM_CROWD_THRESHOLD = 4
/** 高优先级过多的阈值 */
export const HIGH_PRIORITY_THRESHOLD = 6

export function detectIssues(boxes: Box[]): Issue[] {
  const issues: Issue[] = []

  // 1. 编号重复（忽略空编号）
  const byCode = new Map<string, Box[]>()
  boxes.forEach((b) => {
    const code = b.code.trim()
    if (!code) return
    const list = byCode.get(code) ?? []
    list.push(b)
    byCode.set(code, list)
  })
  byCode.forEach((list, code) => {
    if (list.length > 1) {
      issues.push({
        level: 'error',
        code: 'duplicate-code',
        message: `编号「${code}」重复出现 ${list.length} 次`,
        boxIds: list.map((b) => b.id),
      })
    }
  })

  // 2. 同房间重盒过多（仅统计重量为 heavy 的盒子，堆叠过多有安全隐患）
  const heavyByRoom = new Map<string, Box[]>()
  boxes.forEach((b) => {
    if (b.weight !== 'heavy') return
    const room = b.room.trim() || '（未填房间）'
    const list = heavyByRoom.get(room) ?? []
    list.push(b)
    heavyByRoom.set(room, list)
  })
  heavyByRoom.forEach((list, room) => {
    if (list.length > ROOM_CROWD_THRESHOLD) {
      issues.push({
        level: 'warning',
        code: 'too-many-in-room',
        message: `房间「${room}」有 ${list.length} 个重盒，超过建议上限 ${ROOM_CROWD_THRESHOLD}`,
        boxIds: list.map((b) => b.id),
      })
    }
  })

  // 3. 易碎但缺少提醒
  boxes.forEach((b) => {
    if (b.fragile && !b.fragileNote.trim()) {
      issues.push({
        level: 'warning',
        code: 'fragile-no-note',
        message: `盒子「${b.code || '未编号'}」标记易碎但缺少易碎提醒`,
        boxIds: [b.id],
      })
    }
  })

  // 4. 摆放顺序重复
  const byOrder = new Map<number, Box[]>()
  boxes.forEach((b) => {
    const list = byOrder.get(b.order) ?? []
    list.push(b)
    byOrder.set(b.order, list)
  })
  byOrder.forEach((list, order) => {
    if (list.length > 1) {
      issues.push({
        level: 'warning',
        code: 'duplicate-order',
        message: `摆放顺序「${order}」被 ${list.length} 个盒子重复占用`,
        boxIds: list.map((b) => b.id),
      })
    }
  })

  // 5. 高优先级项过多
  const highs = boxes.filter((b) => b.priority === 'high')
  if (highs.length > HIGH_PRIORITY_THRESHOLD) {
    issues.push({
      level: 'warning',
      code: 'too-many-high-priority',
      message: `高优先级盒子有 ${highs.length} 个，超过建议上限 ${HIGH_PRIORITY_THRESHOLD}，会削弱优先查找意义`,
      boxIds: highs.map((b) => b.id),
    })
  }

  return issues
}

/** 汇总每个盒子涉及的异常 code，便于在卡片上高亮 */
export function issuesByBox(issues: Issue[]): Map<string, Issue[]> {
  const map = new Map<string, Issue[]>()
  issues.forEach((issue) => {
    issue.boxIds.forEach((id) => {
      const list = map.get(id) ?? []
      list.push(issue)
      map.set(id, list)
    })
  })
  return map
}

// ---------------- 常用物品清单 ----------------

/** 备注是否不完整：确认状态却没有备注，或内容摘要过短 */
export function isNoteIncomplete(b: Box): boolean {
  if (!b.summary.trim()) return true
  if (b.note.trim().length === 0 && (b.priority === 'high' || b.status === 'reinforce')) return true
  return false
}

/** 常用物品清单：只保留 高优先查找 / 需加固 / 备注不完整 的盒子 */
export function commonItems(boxes: Box[]): Box[] {
  return boxes.filter(
    (b) => b.priority === 'high' || b.status === 'reinforce' || isNoteIncomplete(b),
  )
}

export interface RoomSummary {
  room: string
  count: number
  highPriority: number
  reinforce: number
  fragile: number
}

/** 按房间汇总数量（用于常用物品清单视图） */
export function summarizeByRoom(boxes: Box[]): RoomSummary[] {
  const map = new Map<string, RoomSummary>()
  boxes.forEach((b) => {
    const room = b.room.trim() || '（未填房间）'
    const s = map.get(room) ?? { room, count: 0, highPriority: 0, reinforce: 0, fragile: 0 }
    s.count += 1
    if (b.priority === 'high') s.highPriority += 1
    if (b.status === 'reinforce') s.reinforce += 1
    if (b.fragile) s.fragile += 1
    map.set(room, s)
  })
  return [...map.values()].sort((a, b) => b.count - a.count || a.room.localeCompare(b.room, 'zh'))
}

/** 收集所有出现过的房间名（用于筛选下拉） */
export function collectRooms(boxes: Box[]): string[] {
  const set = new Set<string>()
  boxes.forEach((b) => {
    const r = b.room.trim()
    if (r) set.add(r)
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh'))
}
