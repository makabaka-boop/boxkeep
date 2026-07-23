export type WeightLevel = 'light' | 'medium' | 'heavy';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type ConfirmStatus = 'pending' | 'confirmed' | 'reinforce' | 'deferred';

export interface StorageBox {
  id: string;
  code: string;
  room: string;
  summary: string;
  weight: WeightLevel;
  fragile: boolean;
  fragileNote: string;
  priority: Priority;
  order: number;
  status: ConfirmStatus;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoxDraft {
  code: string;
  room: string;
  summary: string;
  weight: WeightLevel;
  fragile: boolean;
  fragileNote: string;
  priority: Priority;
  order: number;
  status: ConfirmStatus;
  notes: string;
}

export interface Filters {
  room: string;
  weight: WeightLevel | '';
  priority: Priority | '';
  status: ConfirmStatus | '';
  fragile: '' | 'yes' | 'no';
  keyword: string;
}

export type SortKey = 'order' | 'code' | 'priority' | 'weight' | 'updatedAt';

export interface Anomaly {
  id: string;
  type: 'duplicate_code' | 'heavy_room' | 'fragile_missing_note' | 'duplicate_order' | 'too_many_high_priority';
  severity: 'error' | 'warning';
  message: string;
  boxIds: string[];
}

export const WEIGHT_LABELS: Record<WeightLevel, string> = {
  light: '轻',
  medium: '中',
  heavy: '重',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
};

export const STATUS_LABELS: Record<ConfirmStatus, string> = {
  pending: '待整理',
  confirmed: '已确认',
  reinforce: '需加固',
  deferred: '暂缓处理',
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const WEIGHT_ORDER: Record<WeightLevel, number> = {
  heavy: 0,
  medium: 1,
  light: 2,
};

export const DEFAULT_ROOMS = ['客厅', '卧室', '厨房', '卫生间', '阳台', '储物间', '书房', '玄关'];
