export function getNodeIntersection(intersectionNode, targetNode) {
  // https://math.stackexchange.com/questions/108764/how-to-guess-where-a-line-intersects-a-rectangle
  const intersectionNodeWidth = intersectionNode.measured?.width || intersectionNode.width || 0;
  const intersectionNodeHeight = intersectionNode.measured?.height || intersectionNode.height || 0;
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute || intersectionNode.positionAbsolute || intersectionNode.position || { x: 0, y: 0 };
  
  const targetNodeWidth = targetNode.measured?.width || targetNode.width || 0;
  const targetNodeHeight = targetNode.measured?.height || targetNode.height || 0;
  const targetPosition = targetNode.internals?.positionAbsolute || targetNode.positionAbsolute || targetNode.position || { x: 0, y: 0 };

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNodeWidth / 2;
  const y1 = targetPosition.y + targetNodeHeight / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

export function getEdgePosition(node, intersectionPoint) {
  const nodePosition = node.internals?.positionAbsolute || node.positionAbsolute || node.position || { x: 0, y: 0 };
  const nodeWidth = node.measured?.width || node.width || 0;
  const nodeHeight = node.measured?.height || node.height || 0;
  
  const nx = Math.round(nodePosition.x);
  const ny = Math.round(nodePosition.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return 'left';
  }
  if (px >= nx + nodeWidth - 1) {
    return 'right';
  }
  if (py <= ny + 1) {
    return 'top';
  }
  if (py >= ny + nodeHeight - 1) {
    return 'bottom';
  }

  return 'top';
}

export function getEdgeParams(source, target) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
