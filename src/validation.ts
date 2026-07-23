import type { StorageBox, Anomaly, Priority } from './types';

const HEAVY_BOX_LIMIT_PER_ROOM = 3;
const HIGH_PRIORITY_LIMIT = 5;

export function detectAnomalies(boxes: StorageBox[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const byCode = new Map<string, StorageBox[]>();
  for (const b of boxes) {
    const key = b.code.trim();
    if (!key) continue;
    const arr = byCode.get(key) ?? [];
    arr.push(b);
    byCode.set(key, arr);
  }
  for (const [code, group] of byCode) {
    if (group.length > 1) {
      anomalies.push({
        id: `dup_code_${code}`,
        type: 'duplicate_code',
        severity: 'error',
        message: `编号「${code}」重复出现 ${group.length} 次`,
        boxIds: group.map((b) => b.id),
      });
    }
  }

  const byRoomOrder = new Map<string, StorageBox[]>();
  for (const b of boxes) {
    const key = `${b.room}::${b.order}`;
    const arr = byRoomOrder.get(key) ?? [];
    arr.push(b);
    byRoomOrder.set(key, arr);
  }
  for (const [key, group] of byRoomOrder) {
    if (group.length > 1) {
      const [room, order] = key.split('::');
      anomalies.push({
        id: `dup_order_${room}_${order}`,
        type: 'duplicate_order',
        severity: 'warning',
        message: `房间「${room}」摆放顺序 #${order} 有 ${group.length} 个盒子`,
        boxIds: group.map((b) => b.id),
      });
    }
  }

  const heavyByRoom = new Map<string, StorageBox[]>();
  for (const b of boxes) {
    if (b.weight === 'heavy') {
      const arr = heavyByRoom.get(b.room) ?? [];
      arr.push(b);
      heavyByRoom.set(b.room, arr);
    }
  }
  for (const [room, group] of heavyByRoom) {
    if (group.length > HEAVY_BOX_LIMIT_PER_ROOM) {
      anomalies.push({
        id: `heavy_room_${room}`,
        type: 'heavy_room',
        severity: 'warning',
        message: `房间「${room}」有 ${group.length} 个重盒（建议不超过 ${HEAVY_BOX_LIMIT_PER_ROOM} 个）`,
        boxIds: group.map((b) => b.id),
      });
    }
  }

  const fragileMissing = boxes.filter((b) => b.fragile && !b.fragileNote.trim());
  if (fragileMissing.length > 0) {
    anomalies.push({
      id: 'fragile_missing_note',
      type: 'fragile_missing_note',
      severity: 'warning',
      message: `${fragileMissing.length} 个易碎盒未填写易碎提醒`,
      boxIds: fragileMissing.map((b) => b.id),
    });
  }

  const highPriority = boxes.filter(
    (b) => b.priority === 'high' || b.priority === 'urgent'
  );
  if (highPriority.length > HIGH_PRIORITY_LIMIT) {
    anomalies.push({
      id: 'too_many_high_priority',
      type: 'too_many_high_priority',
      severity: 'warning',
      message: `高优先级盒子 ${highPriority.length} 个过多（建议不超过 ${HIGH_PRIORITY_LIMIT} 个）`,
      boxIds: highPriority.map((b) => b.id),
    });
  }

  return anomalies;
}

export function anomaliesForBox(boxId: string, anomalies: Anomaly[]): Anomaly[] {
  return anomalies.filter((a) => a.boxIds.includes(boxId));
}

export function isHighPriority(p: Priority): boolean {
  return p === 'high' || p === 'urgent';
}
