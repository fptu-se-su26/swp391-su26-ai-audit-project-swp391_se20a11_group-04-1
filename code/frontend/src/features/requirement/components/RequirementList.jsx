import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
  const [isDragging, setIsDragging] = useState(false);
  const [edgeZone, setEdgeZone] = useState(null); // 'top' | 'bottom' | null
  const [activeItem, setActiveItem] = useState(null);
  const edgeTimerRef = useRef(null);
  const listRef = useRef(null);
  const EDGE_ZONE_PX = 80;
  const PAGE_CHANGE_DELAY_MS = 500;

  useEffect(() => {
    setItems(requirements);
  }, [requirements]);

  const clearEdgeTimer = useCallback(() => {
    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
  }, []);

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

  const handleDragStart = (event) => {
    setIsDragging(true);
    setActiveItem(items.find(i => i.id === event.active.id) || null);
  };

  const handleDragMove = useCallback((event) => {
    if (!listRef.current || !pagination) return;
    const listRect = listRef.current.getBoundingClientRect();
    const pointerY = event.activatorEvent?.clientY ?? (event.delta?.y ?? 0);

    const distFromTop = pointerY - listRect.top;
    const distFromBottom = listRect.bottom - pointerY;

    if (distFromTop < EDGE_ZONE_PX && pagination.currentPage > 1) {
      // Near top edge — go to previous page
      if (edgeZone !== 'top') {
        setEdgeZone('top');
        clearEdgeTimer();
        edgeTimerRef.current = setTimeout(() => {
          onPageChange(pagination.currentPage - 1);
          setEdgeZone(null);
        }, PAGE_CHANGE_DELAY_MS);
      }
    } else if (distFromBottom < EDGE_ZONE_PX && pagination.currentPage < pagination.totalPages) {
      // Near bottom edge — go to next page
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
    setActiveItem(null);
    setEdgeZone(null);
    clearEdgeTimer();
    if (!isLeader) return;
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

  return (
    <div ref={listRef} className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-visible relative">
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

      {/* Edge zone indicators */}
      {isDragging && pagination && pagination.currentPage > 1 && (
        <div className={`absolute top-0 left-0 right-0 h-20 z-30 flex items-center justify-center gap-2 rounded-t-xl transition-all duration-200 pointer-events-none ${
          edgeZone === 'top'
            ? 'bg-indigo-500/20 border-2 border-indigo-400 border-dashed'
            : 'bg-indigo-100/10 border border-indigo-200 border-dashed'
        }`}>
          <span className={`text-xs font-semibold flex items-center gap-1 transition-all ${
            edgeZone === 'top' ? 'text-indigo-600 scale-110' : 'text-indigo-400'
          }`}>
            <span className={edgeZone === 'top' ? 'animate-bounce' : ''}>↑</span>
            {edgeZone === 'top' ? 'Releasing to Previous Page...' : `Go to Page ${pagination.currentPage - 1}`}
          </span>
        </div>
      )}
      {isDragging && pagination && pagination.currentPage < pagination.totalPages && (
        <div className={`absolute bottom-12 left-0 right-0 h-20 z-30 flex items-center justify-center gap-2 transition-all duration-200 pointer-events-none ${
          edgeZone === 'bottom'
            ? 'bg-indigo-500/20 border-2 border-indigo-400 border-dashed'
            : 'bg-indigo-100/10 border border-indigo-200 border-dashed'
        }`}>
          <span className={`text-xs font-semibold flex items-center gap-1 transition-all ${
            edgeZone === 'bottom' ? 'text-indigo-600 scale-110' : 'text-indigo-400'
          }`}>
            <span className={edgeZone === 'bottom' ? 'animate-bounce' : ''}>↓</span>
            {edgeZone === 'bottom' ? 'Releasing to Next Page...' : `Go to Page ${pagination.currentPage + 1}`}
          </span>
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
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
