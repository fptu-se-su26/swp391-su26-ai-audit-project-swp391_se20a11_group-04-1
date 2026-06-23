import React from 'react';
import { EdgeLabelRenderer } from '@xyflow/react';

function getPolylineCenter(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  let totalLength = 0;
  const lengths = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    lengths.push(len);
    totalLength += len;
  }

  const targetLength = totalLength / 2;
  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    if (accumulated + lengths[i] >= targetLength) {
      const remaining = targetLength - accumulated;
      const ratio = remaining / lengths[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio,
      };
    }
    accumulated += lengths[i];
  }
  return points[points.length - 1];
}

function getRoundedPath(points, r = 8) {
  if (!points || points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i - 1];
    const p2 = points[i]; // Corner point
    const p3 = points[i + 1];

    const dx1 = p1.x - p2.x;
    const dy1 = p1.y - p2.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = p3.x - p2.x;
    const dy2 = p3.y - p2.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const actualR = Math.min(r, len1 / 2, len2 / 2);

    if (actualR > 0) {
      const startX = p2.x + (dx1 / len1) * actualR;
      const startY = p2.y + (dy1 / len1) * actualR;

      const endX = p2.x + (dx2 / len2) * actualR;
      const endY = p2.y + (dy2 / len2) * actualR;

      path += ` L ${startX} ${startY}`;
      path += ` Q ${p2.x} ${p2.y}, ${endX} ${endY}`;
    } else {
      path += ` L ${p2.x} ${p2.y}`;
    }
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

export function ElkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data = {},
}) {
  const points = data.pathPoints;

  let path = '';
  if (points && points.length >= 2) {
    path = getRoundedPath(points, 8);
  } else {
    // Fallback if layout path points are not loaded yet
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }

  const label = data.protocol || '';
  const labelColor = style.stroke || '#94a3b8';
  const center = points && points.length >= 2 ? getPolylineCenter(points) : { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={path}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${center.x}px,${center.y}px)`,
              fontSize: 9,
              fontFamily: 'monospace',
              fontWeight: 600,
              color: labelColor,
              background: 'white',
              padding: '2px 5px',
              borderRadius: 4,
              border: `1px solid ${labelColor}30`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan select-none shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default ElkEdge;
