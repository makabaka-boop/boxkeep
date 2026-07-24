// JSON 导入 / 导出工具
import type { Box, ConfirmStatus, Priority, WeightLevel } from './types'
import { makeId } from './types'

export interface ExportPayload {
  app: 'boxkeep'
  version: 1
  exportedAt: string
  boxes: Box[]
}

/** 生成导出用的 JSON 字符串 */
export function toExportJSON(boxes: Box[]): string {
  const payload: ExportPayload = {
    app: 'boxkeep',
    version: 1,
    exportedAt: new Date().toISOString(),
    boxes,
  }
  return JSON.stringify(payload, null, 2)
}

/** 触发浏览器下载 JSON 文件 */
export function downloadJSON(boxes: Box[]): void {
  const blob = new Blob([toExportJSON(boxes)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.href = url
  a.download = `boxkeep-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const WEIGHTS: WeightLevel[] = ['light', 'medium', 'heavy']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const STATUSES: ConfirmStatus[] = ['pending', 'confirmed', 'reinforce', 'hold']

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

/** 校验并归一化导入数据；不合规字段回退到默认值 */
export function parseImportJSON(text: string): Box[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('不是有效的 JSON 文件')
  }

  // 只接受两种结构：盒子数组，或包含 boxes 数组的导出对象。
  // 其它结构一律拒绝，避免格式不对却清空现有数据。
  let rawBoxes: unknown[]
  if (Array.isArray(data)) {
    rawBoxes = data
  } else if (data && typeof data === 'object' && Array.isArray((data as { boxes?: unknown }).boxes)) {
    rawBoxes = (data as { boxes: unknown[] }).boxes
  } else {
    throw new Error('文件格式不正确：应为收纳盒数组或包含 boxes 数组的导出文件')
  }

  // 抽样校验：导入项应至少含有可识别的收纳盒字段，否则视为格式不对。
  const looksLikeBox = (v: unknown): boolean => {
    if (!v || typeof v !== 'object') return false
    const r = v as Record<string, unknown>
    return ['code', 'room', 'summary', 'weight', 'priority', 'status', 'order'].some(
      (k) => k in r,
    )
  }
  if (rawBoxes.length > 0 && !rawBoxes.some(looksLikeBox)) {
    throw new Error('文件格式不正确：未找到有效的收纳盒字段')
  }

  const now = Date.now()
  return rawBoxes.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>
    const weight = WEIGHTS.includes(r.weight as WeightLevel) ? (r.weight as WeightLevel) : 'medium'
    const priority = PRIORITIES.includes(r.priority as Priority)
      ? (r.priority as Priority)
      : 'medium'
    const status = STATUSES.includes(r.status as ConfirmStatus)
      ? (r.status as ConfirmStatus)
      : 'pending'
    return {
      id: str(r.id) || makeId(),
      code: str(r.code),
      room: str(r.room),
      summary: str(r.summary),
      weight,
      fragile: Boolean(r.fragile),
      fragileNote: str(r.fragileNote),
      priority,
      order: typeof r.order === 'number' ? r.order : i,
      status,
      note: str(r.note),
      createdAt: typeof r.createdAt === 'number' ? r.createdAt : now,
      updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : now,
    }
  })
}
