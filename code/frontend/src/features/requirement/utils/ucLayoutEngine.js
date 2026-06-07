// ucLayoutEngine.js
// Custom layout algorithm for Use Case Diagram with exact X/Y positioning and Edge routing

const CANVAS_WIDTH = 1300;
const ACTOR_LEFT_X = 50; // Increased distance from UC_LEFT_X (220)
const ACTOR_RIGHT_X = 1150; // Increased distance from right UC (780 + 180 = 960)
const UC_LEFT_X = 220;
const UC_RIGHT_X = 780;
const GAP_CENTER = 560; // Just for reference
const UC_Y_START = 60;
let UC_Y_GAP = 75; // Mutable for large diagrams
const ACTOR_NODE_WIDTH = 60;
const ACTOR_NODE_HEIGHT = 90;
const UC_NODE_WIDTH = 180;
const UC_NODE_HEIGHT = 44;
const ACTOR_Y_SPACING = 120; // Minimum Y spacing between actors

export const ucLayoutEngine = (initialNodes, initialEdges, systemName = "System") => {
  const actors = initialNodes.filter(n => n.type === 'actor');
  const usecases = initialNodes.filter(n => n.type === 'useCase');
  
  // Viêc 2: Bỏ hoàn toàn include và extend
  const relations = initialEdges.filter(rel => rel.type !== 'include' && rel.type !== 'extend' && rel.label !== '<<include>>' && rel.label !== '<<extend>>');

  // PRE-STEP: Map Explicit UC Groups
  const ucExplicitGroup = {};
  usecases.forEach(uc => {
    ucExplicitGroup[uc.id] = uc.data?.group || 'shared';
  });

  // BƯỚC 1: XÁC ĐỊNH ACTOR NÀO THUỘC BÊN NÀO
  const actorSides = {}; // actorId -> 'left' | 'right' | 'bottom'
  
  actors.forEach(actor => {
    if (actor.data?.side && (actor.data.side === 'left' || actor.data.side === 'right' || actor.data.side === 'bottom')) {
      actorSides[actor.id] = actor.data.side;
      return;
    }
    
    let leftCount = 0;
    let rightCount = 0;
    
    const connectedUcIds = relations
      .filter(rel => rel.source === actor.id || rel.target === actor.id)
      .map(rel => rel.source === actor.id ? rel.target : rel.source);
      
    connectedUcIds.forEach(ucId => {
       if (ucExplicitGroup[ucId] === 'left') leftCount++;
       else if (ucExplicitGroup[ucId] === 'right') rightCount++;
    });
    
    if (leftCount > rightCount) actorSides[actor.id] = 'left';
    else if (rightCount > leftCount) actorSides[actor.id] = 'right';
    else {
      // Default alternating left/right if equal
      const currentLeft = Object.values(actorSides).filter(s => s === 'left').length;
      const currentRight = Object.values(actorSides).filter(s => s === 'right').length;
      actorSides[actor.id] = currentLeft <= currentRight ? 'left' : 'right';
    }
  });

  // BƯỚC 2: PHÂN BỔ UC GROUP SHARED
  const finalUcSide = {}; // ucId -> 'left' | 'right'
  
  usecases.forEach(uc => {
    if (ucExplicitGroup[uc.id] === 'left') finalUcSide[uc.id] = 'left';
    else if (ucExplicitGroup[uc.id] === 'right') finalUcSide[uc.id] = 'right';
  });
  
  usecases.forEach(uc => {
    if (finalUcSide[uc.id]) return; // Already processed
    
    const connectedActors = relations
      .filter(rel => rel.source === uc.id || rel.target === uc.id)
      .map(rel => rel.source.startsWith('actor_') ? rel.source : rel.target)
      .filter(id => id.startsWith('actor_'));
      
    let leftActorCount = 0;
    let rightActorCount = 0;
    
    connectedActors.forEach(aId => {
       if (actorSides[aId] === 'left') leftActorCount++;
       else if (actorSides[aId] === 'right') rightActorCount++;
    });
    
    if (leftActorCount > 0 && rightActorCount === 0) {
        finalUcSide[uc.id] = 'left';
    } else if (rightActorCount > 0 && leftActorCount === 0) {
        finalUcSide[uc.id] = 'right';
    } else {
       // Shared by both, or connected to nothing -> place in column with fewer UCs
       const leftTotal = Object.values(finalUcSide).filter(s => s === 'left').length;
       const rightTotal = Object.values(finalUcSide).filter(s => s === 'right').length;
       finalUcSide[uc.id] = leftTotal <= rightTotal ? 'left' : 'right';
    }
  });

  // BƯỚC 3: KIỂM TRA LẠI & CHUYỂN CỘT CHO UC THEO ƯU TIÊN RELATION ACTOR
  usecases.forEach(uc => {
     const connectedActors = relations
      .filter(rel => rel.source === uc.id || rel.target === uc.id)
      .map(rel => rel.source.startsWith('actor_') ? rel.source : rel.target)
      .filter(id => id.startsWith('actor_'));
      
     let leftActorCount = 0;
     let rightActorCount = 0;
     
     connectedActors.forEach(aId => {
       if (actorSides[aId] === 'left') leftActorCount++;
       else if (actorSides[aId] === 'right') rightActorCount++;
     });
     
     if (leftActorCount > rightActorCount) {
        finalUcSide[uc.id] = 'left';
     } else if (rightActorCount > leftActorCount) {
        finalUcSide[uc.id] = 'right';
     }
  });

  // BƯỚC 4: TẠO MẢNG UC VÀ TÍNH Y
  const leftUCs = usecases.filter(uc => finalUcSide[uc.id] === 'left');
  const rightUCs = usecases.filter(uc => finalUcSide[uc.id] === 'right');

  // Handle >25 UCs
  const maxUCs = Math.max(leftUCs.length, rightUCs.length);
  let totalHeight = maxUCs * UC_Y_GAP;
  if (totalHeight > 2500) {
    UC_Y_GAP = 45;
  } else if (totalHeight > 1500) {
    UC_Y_GAP = 55;
  }
  totalHeight = Math.max(maxUCs * UC_Y_GAP, 500); // Minimum height

  const ucNodes = [];
  
  leftUCs.forEach((uc, index) => {
    const y = UC_Y_START + index * UC_Y_GAP;
    ucNodes.push({
      ...uc,
      position: { x: UC_LEFT_X, y },
      data: { ...uc.data, side: 'left' }
    });
  });

  rightUCs.forEach((uc, index) => {
    const y = UC_Y_START + index * UC_Y_GAP;
    ucNodes.push({
      ...uc,
      position: { x: UC_RIGHT_X, y },
      data: { ...uc.data, side: 'right' }
    });
  });

  // Helper to get UC's calculated Y
  const getUcPos = (ucId) => {
    const node = ucNodes.find(n => n.id === ucId);
    return node ? node.position.y : 0;
  };

  // BƯỚC 5: TẠO MẢNG ACTOR VÀ TÍNH Y
  const leftActors = [];
  const rightActors = [];
  const bottomActors = [];

  actors.forEach(actor => {
    const connectedUcIds = relations
      .filter(rel => rel.source === actor.id || rel.target === actor.id)
      .map(rel => rel.source === actor.id ? rel.target : rel.source);

    const side = actorSides[actor.id];
    if (side === 'left') leftActors.push({ actor, connectedUcIds });
    else if (side === 'right') rightActors.push({ actor, connectedUcIds });
    else bottomActors.push({ actor, connectedUcIds });
  });

  const calculateActorY = (connectedUcIds) => {
    if (connectedUcIds.length === 0) return totalHeight / 2 || 300;
    const sumY = connectedUcIds.reduce((sum, id) => sum + getUcPos(id), 0);
    return sumY / connectedUcIds.length;
  };

  // Assign initial Y and sort
  leftActors.forEach(item => item.initialY = calculateActorY(item.connectedUcIds));
  rightActors.forEach(item => item.initialY = calculateActorY(item.connectedUcIds));
  
  leftActors.sort((a, b) => a.initialY - b.initialY);
  rightActors.sort((a, b) => a.initialY - b.initialY);

  // Viêc 3: Đảm bảo Y cách nhau tối thiểu 120px
  const enforceSpacing = (actorList) => {
    for (let i = 1; i < actorList.length; i++) {
      const prevY = actorList[i - 1].finalY || actorList[i - 1].initialY;
      const currentY = actorList[i].initialY;
      if (currentY - prevY < ACTOR_Y_SPACING) {
        actorList[i].finalY = prevY + ACTOR_Y_SPACING;
      } else {
        actorList[i].finalY = currentY;
      }
    }
    if (actorList.length > 0) {
        actorList[0].finalY = actorList[0].initialY;
    }
  };

  enforceSpacing(leftActors);
  enforceSpacing(rightActors);

  const actorNodes = [];

  leftActors.forEach(item => {
    actorNodes.push({
      ...item.actor,
      position: { x: ACTOR_LEFT_X, y: item.finalY },
      data: { ...item.actor.data, side: 'left' }
    });
  });

  rightActors.forEach(item => {
    actorNodes.push({
      ...item.actor,
      position: { x: ACTOR_RIGHT_X, y: item.finalY },
      data: { ...item.actor.data, side: 'right' }
    });
  });

  bottomActors.forEach((item, index) => {
    const y = totalHeight + 100;
    actorNodes.push({
      ...item.actor,
      position: { x: CANVAS_WIDTH / 2 - 40 + (index * 150), y },
      data: { ...item.actor.data, side: 'bottom' }
    });
  });

  // BƯỚC 6: SYSTEM BOUNDARY
  const systemBoundaryNode = {
    id: 'system_boundary',
    type: 'systemBoundary',
    position: { x: UC_LEFT_X - 30, y: UC_Y_START - 30 },
    data: { label: systemName },
    draggable: false,
    selectable: false,
    style: {
      width: UC_RIGHT_X + UC_NODE_WIDTH + 30 - (UC_LEFT_X - 30),
      height: totalHeight + 60,
      backgroundColor: 'rgba(240, 244, 250, 0.5)',
      border: '1.5px dashed #C5D8F0',
      borderRadius: '12px',
      zIndex: -1,
      pointerEvents: 'none'
    }
  };

  // BƯỚC 7: XÂY DỰNG EDGES
  const resultEdges = relations.map(rel => {
    const isSourceActor = rel.source.startsWith('actor_');
    const isTargetActor = rel.target.startsWith('actor_');

    const edge = {
      ...rel,
      id: rel.id,
      source: rel.source,
      target: rel.target,
      markerEnd: {
        type: 'arrowclosed',
        width: 14,
        height: 14,
      }
    };

    if (isSourceActor || isTargetActor) {
      // Viêc 1: Đổi sang dây Bezier cong tự nhiên
      edge.type = 'default';
      
      const actorId = isSourceActor ? rel.source : rel.target;
      const actorSide = actorSides[actorId] || 'left';
      
      if (isSourceActor) {
        edge.sourceHandle = actorSide === 'left' ? 'right' : 'left';
        edge.targetHandle = actorSide === 'left' ? 'left' : 'right';
      } else {
        edge.sourceHandle = actorSide === 'left' ? 'left' : 'right';
        edge.targetHandle = actorSide === 'left' ? 'right' : 'left';
      }
    }

    return edge;
  });

  return {
    nodes: [systemBoundaryNode, ...actorNodes, ...ucNodes],
    edges: resultEdges
  };
};
