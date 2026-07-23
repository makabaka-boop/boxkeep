export function validateBoxes(boxes) {
  const warnings = [];
  const codeMap = {};
  const roomHeavyMap = {};
  const roomOrderMap = {};
  let highPriorityCount = 0;

  for (const box of boxes) {
    if (box.priority === 'high') highPriorityCount++;

    if (box.code) {
      if (!codeMap[box.code]) codeMap[box.code] = [];
      codeMap[box.code].push(box.id);
    }

    if (box.weight === 'heavy') {
      if (!roomHeavyMap[box.room]) roomHeavyMap[box.room] = 0;
      roomHeavyMap[box.room]++;
    }

    const orderKey = `${box.room}-${box.order}`;
    if (!roomOrderMap[orderKey]) roomOrderMap[orderKey] = [];
    roomOrderMap[orderKey].push(box.id);
  }

  for (const [code, ids] of Object.entries(codeMap)) {
    if (ids.length > 1) {
      warnings.push({ type: 'duplicate_code', message: `编号 "${code}" 重复 (${ids.length}个盒子)`, ids });
    }
  }

  for (const [room, count] of Object.entries(roomHeavyMap)) {
    if (count >= 3) {
      warnings.push({ type: 'too_many_heavy', message: `房间 "${room}" 有 ${count} 个重盒，建议分散放置` });
    }
  }

  for (const box of boxes) {
    if (box.fragile && !box.fragileNote && (!box.notes || !box.notes.includes('易碎'))) {
      warnings.push({ type: 'fragile_no_note', message: `盒子 "${box.code || '未编号'}" 标记易碎但缺少提醒说明`, ids: [box.id] });
    }
  }

  for (const [key, ids] of Object.entries(roomOrderMap)) {
    if (ids.length > 1) {
      const [room, order] = key.split('-');
      warnings.push({ type: 'duplicate_order', message: `房间 "${room}" 摆放顺序 ${order} 重复 (${ids.length}个盒子)`, ids });
    }
  }

  if (highPriorityCount > Math.ceil(boxes.length * 0.4) && boxes.length > 5) {
    warnings.push({ type: 'too_many_high_priority', message: `高优先级盒子过多 (${highPriorityCount}/${boxes.length})，建议重新评估优先级` });
  }

  return warnings;
}

export function getAttentionBoxes(boxes) {
  return boxes.filter(box => {
    if (box.priority === 'high') return true;
    if (box.status === 'reinforce') return true;
    if (box.status === 'pending' && !box.summary) return true;
    if (box.fragile && !box.fragileNote && !box.notes) return true;
    return false;
  });
}

export function getRoomSummary(boxes) {
  const summary = {};
  for (const box of boxes) {
    if (!summary[box.room]) {
      summary[box.room] = { total: 0, pending: 0, confirmed: 0, reinforce: 0, postponed: 0, heavy: 0, fragile: 0, highPriority: 0 };
    }
    summary[box.room].total++;
    if (box.status === 'pending') summary[box.room].pending++;
    if (box.status === 'confirmed') summary[box.room].confirmed++;
    if (box.status === 'reinforce') summary[box.room].reinforce++;
    if (box.status === 'postponed') summary[box.room].postponed++;
    if (box.weight === 'heavy') summary[box.room].heavy++;
    if (box.fragile) summary[box.room].fragile++;
    if (box.priority === 'high') summary[box.room].highPriority++;
  }
  return summary;
}
