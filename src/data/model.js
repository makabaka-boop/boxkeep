export const ROOMS = ['客厅', '卧室', '厨房', '卫生间', '阳台', '储物间', '书房', '儿童房', '玄关', '其他'];

export const WEIGHT_LEVELS = [
  { value: 'light', label: '轻', color: '#52c41a' },
  { value: 'medium', label: '中', color: '#faad14' },
  { value: 'heavy', label: '重', color: '#ff4d4f' },
];

export const PRIORITY_LEVELS = [
  { value: 'high', label: '高', color: '#ff4d4f' },
  { value: 'medium', label: '中', color: '#faad14' },
  { value: 'low', label: '低', color: '#52c41a' },
];

export const CONFIRM_STATUS = [
  { value: 'pending', label: '待整理', color: '#8c8c8c' },
  { value: 'confirmed', label: '已确认', color: '#52c41a' },
  { value: 'reinforce', label: '需加固', color: '#ff4d4f' },
  { value: 'postponed', label: '暂缓处理', color: '#faad14' },
];

export const createEmptyBox = () => ({
  id: '',
  code: '',
  room: ROOMS[0],
  summary: '',
  weight: 'medium',
  fragile: false,
  fragileNote: '',
  priority: 'medium',
  order: 0,
  status: 'pending',
  notes: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
