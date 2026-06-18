import React, { useCallback } from 'react';
import { useStore, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';

function FloatingEdge({ id, source, target, markerEnd, style, label }) {
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#4B5563',
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default FloatingEdge;
