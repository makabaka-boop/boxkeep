// 家庭收纳盒数据模型与枚举定义

/** 重量等级 */
export type WeightLevel = 'light' | 'medium' | 'heavy'

/** 查找优先级 */
export type Priority = 'high' | 'medium' | 'low'

/** 确认状态 */
export type ConfirmStatus = 'pending' | 'confirmed' | 'reinforce' | 'hold'

/** 收纳盒 */
export interface Box {
  /** 内部唯一 ID（非用户编号） */
  id: string
  /** 用户填写的盒子编号，例如 A-01 */
  code: string
  /** 所在房间 */
  room: string
  /** 内容摘要 */
  summary: string
  /** 重量等级 */
  weight: WeightLevel
  /** 是否易碎 */
  fragile: boolean
  /** 易碎提醒内容（易碎时应填写） */
  fragileNote: string
  /** 查找优先级 */
  priority: Priority
  /** 摆放顺序（数值，越小越靠前） */
  order: number
  /** 确认状态 */
  status: ConfirmStatus
  /** 备注 */
  note: string
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}

/** 重量等级中文标签 */
export const WEIGHT_LABELS: Record<WeightLevel, string> = {
  light: '轻',
  medium: '中',
  heavy: '重',
}

/** 优先级中文标签 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

/** 确认状态中文标签 */
export const STATUS_LABELS: Record<ConfirmStatus, string> = {
  pending: '待整理',
  confirmed: '已确认',
  reinforce: '需加固',
  hold: '暂缓处理',
}

export const WEIGHT_OPTIONS = Object.keys(WEIGHT_LABELS) as WeightLevel[]
export const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABELS) as Priority[]
export const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as ConfirmStatus[]

/** 常见房间，供快速选择（用户也可自由输入） */
export const COMMON_ROOMS = ['客厅', '主卧', '次卧', '厨房', '书房', '储物间', '阳台', '车库']

let seq = 0
/** 生成唯一 ID */
export function makeId(): string {
  seq += 1
  return `box_${Date.now().toString(36)}_${seq}_${Math.random().toString(36).slice(2, 7)}`
}

/** 创建一个空白收纳盒 */
export function createEmptyBox(order: number): Box {
  const now = Date.now()
  return {
    id: makeId(),
    code: '',
    room: '',
    summary: '',
    weight: 'medium',
    fragile: false,
    fragileNote: '',
    priority: 'medium',
    order,
    status: 'pending',
    note: '',
    createdAt: now,
    updatedAt: now,
  }
}
