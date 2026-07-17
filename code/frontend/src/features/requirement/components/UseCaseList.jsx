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
import UseCaseItem from './UseCaseItem';
import UseCasePagination from './UseCasePagination';

const UseCaseList = ({
  useCases,
  allUseCases = [],
  diagramData,
  onEdit,
  onDelete,
  onRefresh,
  pagination,
  onPageChange,
  enableReorder = false,
  onReorder
}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(useCases);
  }, [useCases]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    if (!enableReorder) return;
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

  const ListHeader = () => (
    <div className={`grid grid-cols-12 gap-3 bg-surface-container-low px-stack_md py-2.5 border-b border-outline-variant font-label-md text-label-md text-secondary uppercase tracking-wider rounded-t-xl ${enableReorder ? 'pl-10' : ''}`}>
      <div className="col-span-8 sm:col-span-4 md:col-span-4 lg:col-span-4">ID & Title</div>
      <div className="col-span-4 sm:col-span-3 hidden sm:block">Linked Req</div>
      <div className="col-span-2 hidden md:block">Primary Actor</div>
      <div className="col-span-3 lg:col-span-2 hidden lg:flex justify-center">Status</div>
      <div className="col-span-4 sm:col-span-2 lg:col-span-1 flex justify-end pr-2"></div>
    </div>
  );

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-visible pb-16">
      <ListHeader />

      {enableReorder ? (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-3 p-3 bg-gray-50/30">
            <SortableContext 
              items={items.map(uc => uc.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((uc) => (
                <UseCaseItem
                  key={uc.id}
                  uc={uc}
                  allUseCases={allUseCases}
                  diagramData={diagramData}
                  onDelete={() => onDelete && onDelete(uc.id)}
                  onEdit={() => onEdit && onEdit(uc)}
                  onRefresh={onRefresh}
                  enableReorder={true}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      ) : (
        <div className="flex flex-col gap-3 p-3 bg-gray-50/30">
          {items.map((uc) => (
            <UseCaseItem
              key={uc.id}
              uc={uc}
              allUseCases={allUseCases}
              diagramData={diagramData}
              onDelete={() => onDelete && onDelete(uc.id)}
              onEdit={() => onEdit && onEdit(uc)}
              onRefresh={onRefresh}
              enableReorder={false}
            />
          ))}
        </div>
      )}

      {pagination && (
        <UseCasePagination
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

export default UseCaseList;
