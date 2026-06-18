import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const TraceabilityContext = createContext(null);

export const useTraceability = () => {
  const context = useContext(TraceabilityContext);
  if (!context) {
    throw new Error('useTraceability must be used within a TraceabilityProvider');
  }
  return context;
};

export const TraceabilityProvider = ({ children, data, requirement }) => {
  // Store DOM rects for SVG routing
  const [nodeRects, setNodeRects] = useState({});
  const [hubRects, setHubRects] = useState({});
  const [canvasRect, setCanvasRect] = useState(null);

  // Store active selections for highlighting
  const [activePath, setActivePath] = useState(null); // { level: 'Tasks', id: '123' }

  // Refs for tracking DOM elements
  const nodesRef = useRef(new Map()); // id -> { level, element }
  const hubsRef = useRef(new Map()); // level -> element
  const canvasRef = useRef(null);

  const [measureTrigger, setMeasureTrigger] = useState(0);

  const triggerUpdate = useCallback(() => {
    setMeasureTrigger(prev => prev + 1);
  }, []);

  const registerNode = useCallback((id, level, element) => {
    if (element) {
      nodesRef.current.set(id, { level, element });
    } else {
      nodesRef.current.delete(id);
    }
    triggerUpdate();
  }, [triggerUpdate]);

  const registerHub = useCallback((id, element) => {
    if (element) {
      hubsRef.current.set(id, element);
    } else {
      hubsRef.current.delete(id);
    }
    triggerUpdate();
  }, [triggerUpdate]);

  const measureLayout = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    setCanvasRect(canvasBounds);

    const inner = canvasRef.current.querySelector('#canvas-inner');
    if (!inner) return;

    const innerRect = inner.getBoundingClientRect();
    const style = window.getComputedStyle(inner);
    let zoom = 1;
    if (style.transform && style.transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(style.transform);
      zoom = matrix.a; // scaleX
    }

    const newNodeRects = {};
    nodesRef.current.forEach((data, id) => {
      const rect = data.element.getBoundingClientRect();
      const localX = (rect.left - innerRect.left) / zoom;
      const localY = (rect.top - innerRect.top) / zoom;
      const localWidth = rect.width / zoom;
      const localHeight = rect.height / zoom;

      newNodeRects[id] = {
        level: data.level,
        x: localX,
        y: localY,
        width: localWidth,
        height: localHeight,
        cx: localX + localWidth / 2,
        cy: localY + localHeight / 2,
      };
    });
    setNodeRects(newNodeRects);

    const newHubRects = {};
    hubsRef.current.forEach((element, level) => {
      const rect = element.getBoundingClientRect();
      const localX = (rect.left - innerRect.left) / zoom;
      const localY = (rect.top - innerRect.top) / zoom;
      const localWidth = rect.width / zoom;
      const localHeight = rect.height / zoom;

      newHubRects[level] = {
        x: localX,
        y: localY,
        width: localWidth,
        height: localHeight,
        cx: localX + localWidth / 2,
        cy: localY + localHeight / 2,
      };
    });
    setHubRects(newHubRects);
  }, []);

  // Use ResizeObserver to automatically remeasure when canvas resizes
  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measureLayout);
    });
    observer.observe(canvasRef.current);
    
    // Also observe the inner container if we have wrapping
    const innerContainer = canvasRef.current.firstElementChild;
    if (innerContainer) observer.observe(innerContainer);

    return () => observer.disconnect();
  }, [measureLayout]);

  // Initial measure after mount (with slight delay to ensure flex layout settles)
  // Also triggers whenever a new node/hub is registered (measureTrigger increments)
  useEffect(() => {
    const timer = setTimeout(() => {
      measureLayout();
    }, 50);
    return () => clearTimeout(timer);
  }, [measureLayout, data, measureTrigger]);

  const value = {
    canvasRef,
    registerNode,
    registerHub,
    nodeRects,
    hubRects,
    canvasRect,
    measureLayout,
    activePath,
    setActivePath,
    data,
    requirement
  };

  return (
    <TraceabilityContext.Provider value={value}>
      {children}
    </TraceabilityContext.Provider>
  );
};
