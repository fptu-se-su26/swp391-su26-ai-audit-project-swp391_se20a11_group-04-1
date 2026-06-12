const UC_Y_START = 60;
const ACTOR_Y_SPACING = 120;
const UC_NODE_WIDTH = 180;
const UC_GAP = 80;
const CLUSTER_GAP = 40;
const X_SPACING = 280;

export const ucLayoutEngine = (initialNodes, initialEdges, systemName = "System") => {
  const actors = initialNodes.filter(n => n.type === 'actor');
  const usecases = initialNodes.filter(n => n.type === 'useCase');
  
  const uniqueEdges = [];
  const edgeSet = new Set();
  initialEdges.forEach(edge => {
      const isActorEdge = edge.source.startsWith('actor_') || edge.target.startsWith('actor_');
      const key = isActorEdge 
          ? [edge.source, edge.target].sort().join('-') 
          : `${edge.source}->${edge.target}`;
      if (!edgeSet.has(key)) {
          edgeSet.add(key);
          uniqueEdges.push(edge);
      }
  });
  const relations = uniqueEdges;

  const actorToUcs = {};
  actors.forEach(a => actorToUcs[a.id] = []);
  relations.forEach(r => {
      const isSourceActor = r.source.startsWith('actor_');
      const isTargetActor = r.target.startsWith('actor_');
      if (isSourceActor || isTargetActor) {
          const actorId = isSourceActor ? r.source : r.target;
          const ucId = isSourceActor ? r.target : r.source;
          if (actorToUcs[actorId]) {
              actorToUcs[actorId].push(ucId);
          }
      }
  });

  const visited = new Set();
  const buildTree = (rootId, level = 0) => {
      visited.add(rootId);
      const node = { id: rootId, level, children: [] };
      const connected = relations.filter(r => 
          (!r.source.startsWith('actor_') && !r.target.startsWith('actor_')) &&
          (r.source === rootId || r.target === rootId)
      );
      connected.forEach(r => {
          const other = r.source === rootId ? r.target : r.source;
          if (other.startsWith('uc_') && !visited.has(other)) {
              node.children.push(buildTree(other, level + 1));
          }
      });
      return node;
  };

  const calculateSubtreeHeight = (tree) => {
      if (tree.children.length === 0) {
          tree.height = UC_GAP;
          return tree.height;
      }
      let totalHeight = 0;
      tree.children.forEach(child => {
          totalHeight += calculateSubtreeHeight(child);
      });
      tree.height = Math.max(UC_GAP, totalHeight);
      return tree.height;
  };

  const getTreeDepth = (tree) => {
      if (tree.children.length === 0) return 0;
      return 1 + Math.max(...tree.children.map(getTreeDepth));
  };

  const actorWeights = actors.map(a => ({
      id: a.id,
      weight: actorToUcs[a.id].length
  }));
  actorWeights.sort((a, b) => b.weight - a.weight);
  
  const actorSides = {};
  let leftTotal = 0;
  let rightTotal = 0;
  actorWeights.forEach(aw => {
      if (leftTotal <= rightTotal) {
          actorSides[aw.id] = 'left';
          leftTotal += Math.max(1, aw.weight);
      } else {
          actorSides[aw.id] = 'right';
          rightTotal += Math.max(1, aw.weight);
      }
  });

  const leftForest = [];
  const rightForest = [];
  let maxLeftDepth = 0;
  let maxRightDepth = 0;

  actors.forEach(actor => {
      const primaryUcs = actorToUcs[actor.id];
      const side = actorSides[actor.id];
      const targetForest = side === 'left' ? leftForest : rightForest;
      
      const actorTrees = [];
      primaryUcs.forEach(ucId => {
          if (!visited.has(ucId)) {
              const tree = buildTree(ucId, 0);
              calculateSubtreeHeight(tree);
              const depth = getTreeDepth(tree);
              if (side === 'left') {
                  maxLeftDepth = Math.max(maxLeftDepth, depth);
              } else {
                  maxRightDepth = Math.max(maxRightDepth, depth);
              }
              actorTrees.push(tree);
          }
      });
      targetForest.push({ actorId: actor.id, trees: actorTrees });
  });

  const isolatedTrees = [];
  usecases.forEach(uc => {
      if (!visited.has(uc.id)) {
          const tree = buildTree(uc.id, 0);
          calculateSubtreeHeight(tree);
          isolatedTrees.push(tree);
      }
  });

  // --- DYNAMIC HORIZONTAL CALCULATION ---
  const ACTOR_LEFT_X = 50;
  const UC_LEFT_X = ACTOR_LEFT_X + X_SPACING;
  const leftForestEndX = UC_LEFT_X + maxLeftDepth * X_SPACING;

  // For isolated UCs, calculate number of columns based on how many there are (approx 5 per column)
  let numIsolatedCols = Math.ceil(isolatedTrees.length / 5);
  if (numIsolatedCols < 1) numIsolatedCols = 1;
  const isolatedStartX = leftForestEndX + X_SPACING;
  const isolatedEndX = isolatedStartX + (numIsolatedCols - 1) * X_SPACING;

  const rightForestStartX = isolatedEndX + X_SPACING;
  const UC_RIGHT_X = rightForestStartX + maxRightDepth * X_SPACING;
  const ACTOR_RIGHT_X = UC_RIGHT_X + X_SPACING;

  const CANVAS_WIDTH = ACTOR_RIGHT_X + 150;

  const ucNodes = [];
  const actorNodes = [];
  
  const positionTree = (tree, startY, baseX, direction, sideStr, isIsolated = false) => {
      const myY = startY + (tree.height / 2) - (UC_GAP / 2);
      const myX = baseX + (tree.level * X_SPACING * direction); 

      const uc = usecases.find(u => u.id === tree.id);
      if (uc) {
          ucNodes.push({
              ...uc,
              position: { x: myX, y: myY },
              data: { ...uc.data, side: sideStr, isIsolated }
          });
      }
      
      let currentY = startY;
      tree.children.forEach(child => {
          positionTree(child, currentY, baseX, direction, sideStr, isIsolated);
          currentY += child.height;
      });
  };

  let leftY = UC_Y_START;
  leftForest.forEach(cluster => {
      const startY = leftY;
      cluster.trees.forEach(tree => {
          positionTree(tree, leftY, UC_LEFT_X, 1, 'left');
          leftY += tree.height;
      });
      const endY = leftY - UC_GAP;
      
      let y = UC_Y_START;
      if (startY <= endY) {
          y = (startY + endY) / 2;
      }
      const actor = actors.find(a => a.id === cluster.actorId);
      actorNodes.push({ ...actor, position: { x: ACTOR_LEFT_X, y }, data: { ...actor.data, side: 'left' }});
      
      leftY += CLUSTER_GAP;
  });

  let rightY = UC_Y_START;
  rightForest.forEach(cluster => {
      const startY = rightY;
      cluster.trees.forEach(tree => {
          positionTree(tree, rightY, UC_RIGHT_X, -1, 'right');
          rightY += tree.height;
      });
      const endY = rightY - UC_GAP;
      
      let y = UC_Y_START;
      if (startY <= endY) {
          y = (startY + endY) / 2;
      }
      const actor = actors.find(a => a.id === cluster.actorId);
      actorNodes.push({ ...actor, position: { x: ACTOR_RIGHT_X, y }, data: { ...actor.data, side: 'right' }});
      
      rightY += CLUSTER_GAP;
  });

  const bottomLimit = Math.max(leftY, rightY);
  
  // Split isolated trees dynamically
  const isolatedCols = Array.from({ length: numIsolatedCols }, () => ({ trees: [], height: 0 }));
  isolatedTrees.forEach((tree, index) => {
      const colIdx = index % numIsolatedCols;
      isolatedCols[colIdx].trees.push(tree);
      isolatedCols[colIdx].height += tree.height;
  });

  const maxIsolatedHeight = Math.max(0, ...isolatedCols.map(c => c.height));

  let currentBottomY = bottomLimit - maxIsolatedHeight;
  if (currentBottomY < UC_Y_START) {
      currentBottomY = UC_Y_START;
  }

  isolatedCols.forEach((col, idx) => {
      let y = currentBottomY;
      const baseX = isolatedStartX + idx * X_SPACING;
      col.trees.forEach(tree => {
          positionTree(tree, y, baseX, 0, 'bottom', true);
          y += tree.height;
      });
  });

  const totalHeight = Math.max(leftY, rightY, currentBottomY + maxIsolatedHeight);

  // Viêc 3: Đảm bảo Y cách nhau tối thiểu 120px cho Actor
  const enforceActorSpacing = (actNodes, side) => {
      const sorted = actNodes.filter(n => n.data.side === side).sort((a, b) => a.position.y - b.position.y);
      for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].position.y < sorted[i - 1].position.y + ACTOR_Y_SPACING) {
              sorted[i].position.y = sorted[i - 1].position.y + ACTOR_Y_SPACING;
          }
      }
  };
  enforceActorSpacing(actorNodes, 'left');
  enforceActorSpacing(actorNodes, 'right');

  const systemBoundaryNode = {
      id: 'system_boundary',
      type: 'systemBoundary',
      position: { x: UC_LEFT_X - 30, y: UC_Y_START - 30 },
      data: { label: systemName },
      draggable: false,
      selectable: false,
      style: {
          width: Math.max(UC_RIGHT_X + UC_NODE_WIDTH + 30 - (UC_LEFT_X - 30), CANVAS_WIDTH / 2 + UC_NODE_WIDTH / 2 + 50 - (UC_LEFT_X - 30)),
          height: totalHeight + 60,
          zIndex: -1
      }
  };

  const getUcX = (ucId) => {
      const node = ucNodes.find(n => n.id === ucId);
      return node ? node.position.x : 0;
  };
  const getUcY = (ucId) => {
      const node = ucNodes.find(n => n.id === ucId);
      return node ? node.position.y : 0;
  };
  const getActorPos = (actorId) => {
      const node = actorNodes.find(n => n.id === actorId);
      return node ? { x: node.position.x, y: node.position.y } : { x: 0, y: 0 };
  };

  let resultEdges = uniqueEdges.filter(rel => {
      if (!rel.source.startsWith('actor_') && !rel.target.startsWith('actor_')) {
          const sourceIsolated = !visited.has(rel.source);
          const targetIsolated = !visited.has(rel.target);
          if (sourceIsolated && targetIsolated) return false;
      }
      return true;
  }).map(rel => {
      const isSourceActor = rel.source.startsWith('actor_');
      const isTargetActor = rel.target.startsWith('actor_');

      const edge = {
          ...rel,
          id: rel.id,
          source: rel.source,
          target: rel.target,
          markerEnd: { type: 'arrowclosed', width: 14, height: 14 },
          type: 'custom'
      };

      const sx = isSourceActor ? getActorPos(rel.source).x : getUcX(rel.source);
      const sy = isSourceActor ? getActorPos(rel.source).y : getUcY(rel.source);
      const tx = isTargetActor ? getActorPos(rel.target).x : getUcX(rel.target);
      const ty = isTargetActor ? getActorPos(rel.target).y : getUcY(rel.target);

      if (isSourceActor || isTargetActor) {
          if (isSourceActor) {
              if (sx < tx) {
                  edge.sourceHandle = 'right';
                  edge.targetHandle = 'left-target';
              } else {
                  edge.sourceHandle = 'left';
                  edge.targetHandle = 'right-target';
              }
          } else {
              if (sx < tx) {
                  edge.sourceHandle = 'right-source';
                  edge.targetHandle = 'left';
              } else {
                  edge.sourceHandle = 'left-source';
                  edge.targetHandle = 'right';
              }
          }
      } else {
          // UCs to UCs
          if (sx + 50 < tx) {
              edge.sourceHandle = 'right-source';
              edge.targetHandle = 'left-target';
          } else if (sx > tx + 50) {
              edge.sourceHandle = 'left-source';
              edge.targetHandle = 'right-target';
          } else {
              if (sy < ty) {
                  edge.sourceHandle = 'bottom-source';
                  edge.targetHandle = 'top-target';
              } else {
                  edge.sourceHandle = 'top-source';
                  edge.targetHandle = 'bottom-target';
              }
          }
      }
      return edge;
  });

  return { nodes: [systemBoundaryNode, ...actorNodes, ...ucNodes], edges: resultEdges };
};
