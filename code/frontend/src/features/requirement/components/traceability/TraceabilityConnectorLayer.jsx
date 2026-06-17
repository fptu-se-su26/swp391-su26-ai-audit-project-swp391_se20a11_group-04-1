import { useMemo } from 'react';
import { useTraceability } from './TraceabilityContext';

const generateOrthogonalBranch = (startX, startY, endX, endY) => {
  if (Math.abs(startX - endX) < 2) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
  const midY = startY + (endY - startY) / 2;
  return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
};

const TraceabilityConnectorLayer = () => {
  const { nodeRects, hubRects, data, requirement, activePath, canvasRect } = useTraceability();

  const elements = useMemo(() => {
    const newElements = [];
    if (!requirement || !nodeRects[requirement.id] || !canvasRect) return newElements;

    const reqRect = nodeRects[requirement.id];
    
    // Helper to determine active paths
    let activeTaskId = null;
    let isUcHubActive = true;
    let isTaskHubActive = true;
    let isTestHubActive = true;

    if (activePath) {
      if (activePath.level === 'Use Cases') {
        isTaskHubActive = false;
        isTestHubActive = false;
      } else if (activePath.level === 'Tests') {
        isUcHubActive = false;
        isTaskHubActive = false;
      } else if (activePath.level === 'Tasks') {
        isUcHubActive = false;
        isTestHubActive = false;
        activeTaskId = activePath.id;
      } else if (activePath.level === 'Evidence') {
        isUcHubActive = false;
        isTestHubActive = false;
        // Find the parent task
        const items = data['Evidence'] || [];
        const activeItem = items.find(i => String(i.id) === String(activePath.id));
        const tasks = data['Tasks'] || [];
        if (activeItem) {
          const foundTask = tasks.find(t => 
            activeItem.evidenceLinks?.some?.(l => l.entityType === 'TASK' && String(l.entityId) === String(t.id))
          );
          if (foundTask) activeTaskId = foundTask.id;
        }
      }
    }

    const pushPath = (id, d, isActive) => {
      newElements.push({ id, type: 'path', d, isActive: !activePath || isActive, isFaded: activePath && !isActive });
    };

    const pushDot = (id, cx, cy, isActive) => {
      newElements.push({ id: `dot-${id}`, type: 'dot', cx, cy, isActive: !activePath || isActive, isFaded: activePath && !isActive });
    };

    const reqBottomX = reqRect.cx;
    const reqBottomY = reqRect.y + reqRect.height;

    // --- LEVEL 1: REQ to UC, Tasks, Tests ---
    const ucHub = hubRects['Use Cases'];
    const taskHub = hubRects['Tasks'];
    const testHub = hubRects['Tests'];

    if (ucHub) {
      pushPath('req-to-uc', generateOrthogonalBranch(reqBottomX, reqBottomY, ucHub.cx, ucHub.y), isUcHubActive);
      
      const ucs = data['Use Cases'] || [];
      const ucIds = ucs.length > 0 ? ucs.map(u => u.id) : ['empty-Use Cases'];
      
      let lastCy = ucHub.y + ucHub.height;
      ucIds.forEach(id => {
        const rect = nodeRects[id];
        if (rect && rect.cy > lastCy) lastCy = rect.cy;
      });

      if (lastCy > ucHub.y + ucHub.height) {
        pushPath('spine-uc', `M ${ucHub.cx} ${ucHub.y + ucHub.height} L ${ucHub.cx} ${lastCy}`, isUcHubActive);
      }

      ucIds.forEach(id => {
        const rect = nodeRects[id];
        if (rect) {
          const isUcActive = isUcHubActive && (!activePath || activePath.id === id || activePath.level !== 'Use Cases');
          pushPath(`uc-branch-${id}`, `M ${ucHub.cx} ${rect.cy} L ${rect.x} ${rect.cy}`, isUcActive);
          pushDot(`uc-${id}`, ucHub.cx, rect.cy, isUcActive);
        }
      });
    }

    if (testHub) {
      pushPath('req-to-test', generateOrthogonalBranch(reqBottomX, reqBottomY, testHub.cx, testHub.y), isTestHubActive);
      
      const tests = data['Tests'] || [];
      const testIds = tests.length > 0 ? tests.map(t => t.id) : ['empty-Tests'];
      
      let lastCy = testHub.y + testHub.height;
      testIds.forEach(id => {
        const rect = nodeRects[id];
        if (rect && rect.cy > lastCy) lastCy = rect.cy;
      });

      if (lastCy > testHub.y + testHub.height) {
        pushPath('spine-test', `M ${testHub.cx} ${testHub.y + testHub.height} L ${testHub.cx} ${lastCy}`, isTestHubActive);
      }

      testIds.forEach(id => {
        const rect = nodeRects[id];
        if (rect) {
          const isTestActive = isTestHubActive && (!activePath || activePath.id === id || activePath.level !== 'Tests');
          pushPath(`test-branch-${id}`, `M ${testHub.cx} ${rect.cy} L ${rect.x} ${rect.cy}`, isTestActive);
          pushDot(`test-${id}`, testHub.cx, rect.cy, isTestActive);
        }
      });
    }

    if (taskHub) {
      pushPath('req-to-task', generateOrthogonalBranch(reqBottomX, reqBottomY, taskHub.cx, taskHub.y), isTaskHubActive);
      
      const tasks = data['Tasks'] || [];
      const taskIds = tasks.length > 0 ? tasks.map(t => t.id) : ['empty-Tasks'];
      
      let lastCy = taskHub.y + taskHub.height;
      taskIds.forEach(id => {
        const rect = nodeRects[id];
        if (rect && rect.cy > lastCy) lastCy = rect.cy;
      });

      if (lastCy > taskHub.y + taskHub.height) {
        pushPath('spine-task', `M ${taskHub.cx} ${taskHub.y + taskHub.height} L ${taskHub.cx} ${lastCy}`, isTaskHubActive);
      }
      
      taskIds.forEach(taskId => {
        const taskRect = nodeRects[taskId];
        if (!taskRect) return;

        const isThisTaskActive = isTaskHubActive && (!activeTaskId || String(activeTaskId) === String(taskId));
        pushPath(`task-branch-${taskId}`, `M ${taskHub.cx} ${taskRect.cy} L ${taskRect.x} ${taskRect.cy}`, isThisTaskActive);
        pushDot(`task-${taskId}`, taskHub.cx, taskRect.cy, isThisTaskActive);

      });
    }

    return newElements;
  }, [nodeRects, hubRects, data, requirement, activePath, canvasRect]);

  if (!canvasRect) return null;

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ minHeight: '100%', overflow: 'visible' }}
    >
      {elements.map(el => {
        if (el.type === 'path') {
          return (
            <path
              key={el.id}
              d={el.d}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="transition-all duration-300"
              style={{ opacity: el.isFaded ? 0.3 : 1 }}
            />
          );
        } else if (el.type === 'dot') {
          return (
            <circle
              key={el.id}
              cx={el.cx}
              cy={el.cy}
              r={2.5}
              fill="#cbd5e1"
              className="transition-all duration-300"
              style={{ opacity: el.isFaded ? 0.3 : 1 }}
            />
          );
        }
        return null;
      })}
    </svg>
  );
};

export default TraceabilityConnectorLayer;
