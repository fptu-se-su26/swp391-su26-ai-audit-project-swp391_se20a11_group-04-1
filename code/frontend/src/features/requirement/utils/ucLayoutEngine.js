const UC_Y_START = 60;
const ACTOR_Y_SPACING = 120;
const UC_GAP = 70;
const CLUSTER_GAP = 40;
const X_SPACING = 260;
const UC_GRID_COLS = 3;
const UC_COL_WIDTH = 220;

export const ucLayoutEngine = (initialNodes, initialEdges, systemName = "System") => {
  const actors = initialNodes.filter(n => n.type === 'actor');
  const usecases = initialNodes.filter(n => n.type === 'useCase');

  const uniqueEdges = [];
  const edgeSet = new Set();
  const baseActorIds = new Set();
  const actorInheritanceMap = {};

  initialEdges.forEach(edge => {
    const isActorEdge = edge.source.startsWith('actor_') || edge.target.startsWith('actor_');
    const key = isActorEdge
      ? [edge.source, edge.target].sort().join('-')
      : `${edge.source}->${edge.target}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      uniqueEdges.push(edge);
      if (edge.type === 'actor-generalization' || (edge.source.startsWith('actor_') && edge.target.startsWith('actor_'))) {
        baseActorIds.add(edge.target);
        actorInheritanceMap[edge.source] = edge.target;
      }
    }
  });
  const relations = uniqueEdges;

  const actorToUcs = {};
  actors.forEach(a => (actorToUcs[a.id] = []));
  relations.forEach(r => {
    if (r.type === 'actor-generalization' || (r.source.startsWith('actor_') && r.target.startsWith('actor_'))) return;
    const isSourceActor = r.source.startsWith('actor_');
    const isTargetActor = r.target.startsWith('actor_');
    if (isSourceActor && !isTargetActor) {
      if (actorToUcs[r.source]) actorToUcs[r.source].push(r.target);
    } else if (isTargetActor && !isSourceActor) {
      if (actorToUcs[r.target]) actorToUcs[r.target].push(r.source);
    }
  });

  const getAncestorUcs = (actorId) => {
    const inherited = new Set();
    let current = actorInheritanceMap[actorId];
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      (actorToUcs[current] || []).forEach(uc => inherited.add(uc));
      current = actorInheritanceMap[current];
    }
    return inherited;
  };

  const nonBaseActors = actors.filter(a => !baseActorIds.has(a.id));
  const baseActors = actors.filter(a => baseActorIds.has(a.id));

  const actorWeights = nonBaseActors.map(a => ({ id: a.id, weight: actorToUcs[a.id].length }));
  actorWeights.sort((a, b) => b.weight - a.weight);

  const actorSides = {};
  let leftCount = 0, rightCount = 0;
  actorWeights.forEach(aw => {
    if (leftCount <= rightCount) { actorSides[aw.id] = 'left'; leftCount++; }
    else { actorSides[aw.id] = 'right'; rightCount++; }
  });

  const visited = new Set();

  const placeUcsGrid = (ucIds, startX, startY, direction) => {
    const nodes = [];
    if (!ucIds || ucIds.length === 0) return { nodes, totalHeight: 0, totalWidth: 0 };
    const numCols = Math.min(UC_GRID_COLS, ucIds.length);
    const perCol = Math.ceil(ucIds.length / numCols);

    ucIds.forEach((ucId, idx) => {
      visited.add(ucId);
      const col = Math.floor(idx / perCol);
      const row = idx % perCol;
      const xOffset = col * UC_COL_WIDTH * direction;
      const x = startX + xOffset;
      const y = startY + row * UC_GAP;
      const uc = usecases.find(u => u.id === ucId);
      if (uc) {
        nodes.push({
          ...uc,
          position: { x, y },
          data: { ...uc.data }
        });
      }
    });

    const totalHeight = perCol * UC_GAP;
    const totalWidth = numCols * UC_COL_WIDTH;
    return { nodes, totalHeight, totalWidth };
  };

  const ACTOR_LEFT_BASE_X = 50;
  const BOUNDARY_PADDING = 40;
  const ACTOR_RIGHT_BUFFER = 150;

  const leftClusters = [];
  const rightClusters = [];

  nonBaseActors.forEach(actor => {
    const side = actorSides[actor.id];
    const ucIds = actorToUcs[actor.id];
    const numCols = Math.min(UC_GRID_COLS, Math.max(1, ucIds.length));
    const width = numCols * UC_COL_WIDTH;
    if (side === 'left') leftClusters.push({ actorId: actor.id, ucIds, width });
    else rightClusters.push({ actorId: actor.id, ucIds, width });
  });

  const maxLeftWidth = leftClusters.reduce((m, c) => Math.max(m, c.width), UC_COL_WIDTH);
  const maxRightWidth = rightClusters.reduce((m, c) => Math.max(m, c.width), UC_COL_WIDTH);

  const LEFT_UC_START_X = ACTOR_LEFT_BASE_X + X_SPACING;
  const BOUNDARY_LEFT_X = LEFT_UC_START_X - BOUNDARY_PADDING;
  const ISO_START_X = LEFT_UC_START_X + maxLeftWidth + X_SPACING;
  const RIGHT_UC_END_X = ISO_START_X + X_SPACING * 2;
  const ACTOR_RIGHT_X = RIGHT_UC_END_X + maxRightWidth + X_SPACING;
  const BOUNDARY_WIDTH = ACTOR_RIGHT_X - BOUNDARY_LEFT_X + ACTOR_RIGHT_BUFFER;

  const ucNodes = [];
  const actorNodes = [];

  let leftY = UC_Y_START;
  leftClusters.forEach(cluster => {
    const startY = leftY;
    const { nodes, totalHeight } = placeUcsGrid(cluster.ucIds, LEFT_UC_START_X, startY, 1);
    ucNodes.push(...nodes);
    const actor = actors.find(a => a.id === cluster.actorId);
    const actorY = totalHeight > 0 ? startY + totalHeight / 2 - 20 : startY;
    actorNodes.push({
      ...actor,
      position: { x: ACTOR_LEFT_BASE_X, y: actorY },
      data: { ...actor.data, side: 'left' }
    });
    leftY += (totalHeight || ACTOR_Y_SPACING) + CLUSTER_GAP;
  });

  let rightY = UC_Y_START;
  rightClusters.forEach(cluster => {
    const startY = rightY;
    const { nodes, totalHeight } = placeUcsGrid(cluster.ucIds, RIGHT_UC_END_X, startY, -1);
    ucNodes.push(...nodes);
    const actor = actors.find(a => a.id === cluster.actorId);
    const actorY = totalHeight > 0 ? startY + totalHeight / 2 - 20 : startY;
    actorNodes.push({
      ...actor,
      position: { x: ACTOR_RIGHT_X, y: actorY },
      data: { ...actor.data, side: 'right' }
    });
    rightY += (totalHeight || ACTOR_Y_SPACING) + CLUSTER_GAP;
  });

  const isolatedUcIds = usecases.filter(u => !visited.has(u.id)).map(u => u.id);
  if (isolatedUcIds.length > 0) {
    const { nodes } = placeUcsGrid(isolatedUcIds, ISO_START_X, UC_Y_START, 1);
    ucNodes.push(...nodes);
  }

  const mainHeight = Math.max(
    leftY,
    rightY,
    UC_Y_START + (isolatedUcIds.length > 0 ? Math.ceil(isolatedUcIds.length / UC_GRID_COLS) * UC_GAP : 0)
  );

  const BOTTOM_UC_Y = mainHeight + 60;
  const maxBaseUcCount = baseActors.reduce((m, a) => Math.max(m, actorToUcs[a.id].length), 0);
  const BASE_ACTOR_Y = BOTTOM_UC_Y + (maxBaseUcCount > 0 ? Math.ceil(maxBaseUcCount / UC_GRID_COLS) * UC_GAP : 0) + 60;
  const SYSTEM_HEIGHT = BASE_ACTOR_Y + 80;

  const baseActorSpacing = 400;
  const baseActorsStartX = BOUNDARY_LEFT_X + BOUNDARY_WIDTH / 2 - ((baseActors.length - 1) * baseActorSpacing) / 2;

  baseActors.forEach((actor, idx) => {
    const actorX = baseActorsStartX + idx * baseActorSpacing;
    const ucIds = actorToUcs[actor.id].filter(id => !visited.has(id));
    if (ucIds.length > 0) {
      const { nodes } = placeUcsGrid(ucIds, actorX - UC_COL_WIDTH, BOTTOM_UC_Y, 1);
      ucNodes.push(...nodes);
    }
    actorNodes.push({
      ...actor,
      position: { x: actorX, y: BASE_ACTOR_Y },
      data: { ...actor.data, side: 'bottom' }
    });
  });

  const systemBoundaryNode = {
    id: 'system_boundary',
    type: 'systemBoundary',
    position: { x: BOUNDARY_LEFT_X, y: UC_Y_START - BOUNDARY_PADDING },
    data: { label: systemName },
    draggable: false,
    selectable: true,
    className: '!pointer-events-none',
    style: { width: BOUNDARY_WIDTH, height: SYSTEM_HEIGHT }
  };

  const getUcPos = (ucId) => {
    const node = ucNodes.find(n => n.id === ucId);
    return node ? node.position : { x: 0, y: 0 };
  };
  const getActorPos = (actorId) => {
    const node = actorNodes.find(n => n.id === actorId);
    return node ? node.position : { x: 0, y: 0 };
  };

  const resultEdges = uniqueEdges.filter(rel => {
    const isActorEdge = rel.source.startsWith('actor_') || rel.target.startsWith('actor_');
    if (!isActorEdge) return true;
    if (rel.type === 'actor-generalization' || (rel.source.startsWith('actor_') && rel.target.startsWith('actor_'))) return true;
    const actorId = rel.source.startsWith('actor_') ? rel.source : rel.target;
    const ucId = rel.source.startsWith('actor_') ? rel.target : rel.source;
    const ancestorUcs = getAncestorUcs(actorId);
    if (ancestorUcs.has(ucId)) return false;
    return true;
  }).map(rel => {
    const isSourceActor = rel.source.startsWith('actor_');
    const isTargetActor = rel.target.startsWith('actor_');
    const edge = { ...rel, type: 'custom' };

    if (!isSourceActor && !isTargetActor) {
      edge.markerEnd = { type: 'arrowclosed', width: 14, height: 14 };
      edge.style = { strokeDasharray: '5,5', ...edge.style };
    } else if (rel.type === 'actor-generalization') {
      edge.markerEnd = 'actor-generalization-marker';
      edge.style = { ...edge.style, strokeWidth: 1.5 };
    }

    const sourceNode = actorNodes.find(n => n.id === rel.source) || ucNodes.find(n => n.id === rel.source);
    const targetNode = actorNodes.find(n => n.id === rel.target) || ucNodes.find(n => n.id === rel.target);
    const sourceSide = sourceNode?.data?.side;
    const targetSide = targetNode?.data?.side;

    const sx = isSourceActor ? getActorPos(rel.source).x : getUcPos(rel.source).x;
    const sy = isSourceActor ? getActorPos(rel.source).y : getUcPos(rel.source).y;
    const tx = isTargetActor ? getActorPos(rel.target).x : getUcPos(rel.target).x;
    const ty = isTargetActor ? getActorPos(rel.target).y : getUcPos(rel.target).y;

    if (isSourceActor && isTargetActor) {
      if (targetSide === 'bottom') { edge.sourceHandle = 'bottom'; edge.targetHandle = sourceSide === 'left' ? 'left' : 'right'; }
      else if (sy < ty) { edge.sourceHandle = 'bottom'; edge.targetHandle = 'top'; }
      else { edge.sourceHandle = 'top'; edge.targetHandle = 'bottom'; }
    } else if (isSourceActor) {
      if (sourceSide === 'bottom') { edge.sourceHandle = 'top'; edge.targetHandle = 'bottom'; }
      else if (sourceSide === 'left') { edge.sourceHandle = 'right'; edge.targetHandle = 'left'; }
      else { edge.sourceHandle = 'left'; edge.targetHandle = 'right'; }
    } else if (isTargetActor) {
      if (targetSide === 'bottom') { edge.targetHandle = 'top'; edge.sourceHandle = 'bottom'; }
      else if (targetSide === 'left') { edge.targetHandle = 'right'; edge.sourceHandle = 'left'; }
      else { edge.targetHandle = 'left'; edge.sourceHandle = 'right'; }
    } else {
      if (sx + 50 < tx) { edge.sourceHandle = 'right'; edge.targetHandle = 'left'; }
      else if (sx > tx + 50) { edge.sourceHandle = 'left'; edge.targetHandle = 'right'; }
      else if (sy < ty) { edge.sourceHandle = 'bottom'; edge.targetHandle = 'top'; }
      else { edge.sourceHandle = 'top'; edge.targetHandle = 'bottom'; }
    }
    return edge;
  });

  return { nodes: [systemBoundaryNode, ...actorNodes, ...ucNodes], edges: resultEdges };
};
