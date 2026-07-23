import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BoxCard from './BoxCard.jsx';

export default function BoxList({ boxes, onReorder, selectedIds, onSelect, onEdit, onCopy, onDelete }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = boxes.findIndex(b => b.id === active.id);
      const newIndex = boxes.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const originalOrders = boxes.map(b => b.order);
        const reordered = arrayMove(boxes, oldIndex, newIndex);
        const updatedBoxes = reordered.map((box, idx) => ({
          ...box,
          order: originalOrders[idx],
        }));
        onReorder(updatedBoxes);
      }
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="empty-list">
        <p>📦 暂无收纳盒记录，点击「新增收纳盒」开始整理吧！</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={boxes.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="box-list">
          {boxes.map(box => (
            <BoxCard
              key={box.id}
              box={box}
              selected={selectedIds.has(box.id)}
              onSelect={onSelect}
              onEdit={onEdit}
              onCopy={onCopy}
              onDelete={onDelete}
              isDragging={activeId === box.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
