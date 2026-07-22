import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import RequirementItem from './RequirementItem';
import RequirementPagination from './RequirementPagination';

const RequirementList = ({
  requirements,
  onDelete,
  onEdit,
  onRefresh,
  pagination,
  onPageChange,
  onReorder,
  isLeader
}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(requirements);
  }, [requirements]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    if (!isLeader) return;
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        if (onReorder) {
          onReorder(newItems);
        }
        
        return newItems;
      });
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-visible">
      <div className="grid grid-cols-12 gap-3 bg-surface-container-low px-stack_md py-2.5 border-b border-outline-variant font-label-md text-label-md text-secondary uppercase tracking-wider rounded-t-xl pl-10">
        <div className="col-span-8 sm:col-span-5 md:col-span-4 lg:col-span-4">ID & Title</div>
        <div className="col-span-3 sm:col-span-2 hidden sm:block">Status & Priority</div>
        <div className="col-span-2 hidden lg:block">Tags</div>
        <div className="col-span-3 lg:col-span-2 hidden md:block">Metrics</div>
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex items-center pr-2">
          <div className="flex-1 flex justify-center">Owner</div>
          <div className="w-8 shrink-0" />
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-3 p-3 bg-gray-50/30">
          <SortableContext 
            items={items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((req) => (
              <RequirementItem 
                key={req.id} 
                req={req}
                onDelete={() => onDelete(req.id)}
                onEdit={() => onEdit(req)}
                onRefresh={onRefresh}
                isLeader={isLeader}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {pagination && (
        <RequirementPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default RequirementList;
