import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  onReorder,
  onApprove,
  onReject
}) => {
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [edgeZone, setEdgeZone] = useState(null); // 'top' | 'bottom' | null
  const edgeTimerRef = useRef(null);
  const listRef = useRef(null);
  const EDGE_ZONE_PX = 80;
  const PAGE_CHANGE_DELAY_MS = 500;

  useEffect(() => {
    setItems(useCases);
  }, [useCases]);

  const clearEdgeTimer = useCallback(() => {
    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragMove = useCallback((event) => {
    if (!listRef.current || !pagination) return;
    const listRect = listRef.current.getBoundingClientRect();
    const pointerY = event.activatorEvent?.clientY ?? (event.delta?.y ?? 0);
    const distFromTop = pointerY - listRect.top;
    const distFromBottom = listRect.bottom - pointerY;

    if (distFromTop < EDGE_ZONE_PX && pagination.currentPage > 1) {
      if (edgeZone !== 'top') {
        setEdgeZone('top');
        clearEdgeTimer();
        edgeTimerRef.current = setTimeout(() => {
          onPageChange(pagination.currentPage - 1);
          setEdgeZone(null);
        }, PAGE_CHANGE_DELAY_MS);
      }
    } else if (distFromBottom < EDGE_ZONE_PX && pagination.currentPage < pagination.totalPages) {
      if (edgeZone !== 'bottom') {
        setEdgeZone('bottom');
        clearEdgeTimer();
        edgeTimerRef.current = setTimeout(() => {
          onPageChange(pagination.currentPage + 1);
          setEdgeZone(null);
        }, PAGE_CHANGE_DELAY_MS);
      }
    } else {
      if (edgeZone !== null) {
        setEdgeZone(null);
        clearEdgeTimer();
      }
    }
  }, [edgeZone, pagination, onPageChange, clearEdgeTimer]);

  const handleDragEnd = (event) => {
    setIsDragging(false);
    setEdgeZone(null);
    clearEdgeTimer();
    if (!enableReorder) return;
    const { active, over } = event;

    if (active.id !== over?.id) {
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
    <div ref={listRef} className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-visible pb-16 relative">
      <ListHeader />

      {/* Edge zone indicators */}
      {isDragging && pagination && pagination.currentPage > 1 && (
        <div className={`absolute top-0 left-0 right-0 h-20 z-30 flex items-center justify-center gap-2 rounded-t-xl transition-all duration-200 pointer-events-none ${
          edgeZone === 'top'
            ? 'bg-indigo-500/20 border-2 border-indigo-400 border-dashed'
            : 'bg-indigo-100/10 border border-indigo-200 border-dashed'
        }`}>
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            edgeZone === 'top' ? 'text-indigo-600 scale-110' : 'text-indigo-400'
          }`}>
            <span className={edgeZone === 'top' ? 'animate-bounce' : ''}>↑</span>
            {edgeZone === 'top' ? 'Switching to Previous Page...' : `Drag here for Page ${pagination.currentPage - 1}`}
          </span>
        </div>
      )}
      {isDragging && pagination && pagination.currentPage < pagination.totalPages && (
        <div className={`absolute bottom-16 left-0 right-0 h-20 z-30 flex items-center justify-center gap-2 transition-all duration-200 pointer-events-none ${
          edgeZone === 'bottom'
            ? 'bg-indigo-500/20 border-2 border-indigo-400 border-dashed'
            : 'bg-indigo-100/10 border border-indigo-200 border-dashed'
        }`}>
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            edgeZone === 'bottom' ? 'text-indigo-600 scale-110' : 'text-indigo-400'
          }`}>
            <span className={edgeZone === 'bottom' ? 'animate-bounce' : ''}>↓</span>
            {edgeZone === 'bottom' ? 'Switching to Next Page...' : `Drag here for Page ${pagination.currentPage + 1}`}
          </span>
        </div>
      )}

      {enableReorder ? (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
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
                  onApprove={onApprove}
                  onReject={onReject}
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
              onApprove={onApprove}
              onReject={onReject}
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
