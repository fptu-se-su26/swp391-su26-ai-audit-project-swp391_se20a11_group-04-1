import { useCallback } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useArchitectureStore } from '../store/architectureStore';

const elk = new ELK();

// Helper: is this node hidden because an ancestor group is collapsed?
const isNodeHidden = (node, allNodes, collapsedZones) => {
  let parentId = node.data?.parentId || node.parentId;
  while (parentId) {
    if (collapsedZones.has(parentId)) return true;
    const parent = allNodes.find(n => n.id === parentId);
    parentId = parent?.data?.parentId || parent?.parentId;
  }
  return false;
};

// Helper: redirect a node to its nearest collapsed ancestor (if any)
const getRedirectTarget = (nodeId, allNodes, collapsedZones) => {
  const node = allNodes.find(n => n.id === nodeId);
  if (!node) return nodeId;
  let parentId = node.data?.parentId || node.parentId;
  let lastCollapsed = null;
  while (parentId) {
    if (collapsedZones.has(parentId)) lastCollapsed = parentId;
    const parent = allNodes.find(n => n.id === parentId);
    parentId = parent?.data?.parentId || parent?.parentId;
  }
  return lastCollapsed || nodeId;
};

/**
 * Comprehensive protocol-to-color mapping.
 * Uses fuzzy lowercase matching so it works across any project.
 */
export const resolveEdgeColor = (protocol) => {
  if (!protocol) return '#94a3b8';

  const raw  = protocol.toLowerCase();
  const norm = raw.replace(/[^a-z0-9]/g, '');

  // ── HTTP / REST / web ─────────────────────────────────────────────────────
  if (/^https?$/.test(norm) || /\bhttp\b|\brest\b|\brestapi\b|\bopenapi\b/.test(raw)) return '#3b82f6';
  if (/graphql/.test(norm))              return '#e535ab';
  if (/grpc|rpc|http2|h2c|h2/.test(norm)) return '#6366f1';
  if (/websocket|wss?$/.test(norm))      return '#06b6d4';
  if (/sse|eventsource/.test(norm))      return '#22d3ee';
  if (/soap|wsdl|xmlrpc/.test(norm))     return '#64748b';
  if (/webhook/.test(norm))              return '#f97316';

  // ── Relational DB / SQL ───────────────────────────────────────────────────
  if (/jdbc|postgresql|postgres|mysql|mariadb|mssql|sqlserver|oracle|sqlite|h2db|crdb|cockroach|tidb/.test(norm)) return '#8b5cf6';
  if (/\bsql\b/.test(raw))              return '#8b5cf6';

  // ── NoSQL / Document / Key-Value ─────────────────────────────────────────
  if (/mongo|couchdb|firestore|dynamodb|cosmosdb|cassandra|hbase|bigtable/.test(norm)) return '#7c3aed';
  if (/redis|memcache|memcached|valkey|dragonfly/.test(norm)) return '#a855f7';
  if (/elasticsearch|opensearch|solr|meilisearch|typesense/.test(norm)) return '#f59e0b';

  // ── Message queues / event streaming ─────────────────────────────────────
  if (/kafka|confluent|redpanda/.test(norm))   return '#f59e0b';
  if (/rabbitmq|amqp|amqps/.test(norm))        return '#d97706';
  if (/mqtt|mosquitto|emqx/.test(norm))         return '#b45309';
  if (/nats|jetstream/.test(norm))              return '#92400e';
  if (/pulsar|activemq|artemis/.test(norm))     return '#fbbf24';
  if (/sqs|sns|eventbridge|servicebus|pubsub/.test(norm)) return '#fcd34d';

  // ── Monitoring / metrics / tracing ────────────────────────────────────────
  if (/prometheus|scrape/.test(norm))        return '#10b981';
  if (/remote.?write|pushgateway/.test(raw)) return '#059669';
  if (/statsd|influxdb|telegraf|victoriametrics/.test(norm)) return '#34d399';
  if (/opentelemetry|otel|jaeger|zipkin|tempo|loki/.test(norm)) return '#6ee7b7';
  if (/grafana|datadog|newrelic|dynatrace/.test(norm)) return '#86efac';

  // ── Object / File storage ─────────────────────────────────────────────────
  if (/\bs3\b|minio|ceph|gcs|azureblob|r2/.test(norm)) return '#06b6d4';
  if (/nfs|hdfs|cifs|smb/.test(norm))        return '#0891b2';
  if (/ftp|sftp|ftps/.test(norm))            return '#0e7490';

  // ── Auth / security ───────────────────────────────────────────────────────
  if (/oauth2?|oidc|openidconnect/.test(norm)) return '#f43f5e';
  if (/saml|ldap|activedirectory/.test(norm))  return '#fb7185';
  if (/jwt|apikey|basicauth/.test(norm))        return '#fda4af';
  if (/tls|ssl|mtls/.test(norm))               return '#e11d48';

  // ── CI/CD / DevOps ────────────────────────────────────────────────────────
  if (/github|gitlab|bitbucket|jenkins|circleci|teamcity/.test(norm)) return '#f97316';
  if (/docker|kubernetes|helm|k8s/.test(norm)) return '#fb923c';
  if (/sonar|sonarqube|sonarcloud/.test(norm)) return '#fb923c';

  // ── Low-level / network ───────────────────────────────────────────────────
  if (/\btcp\b/.test(raw))    return '#64748b';
  if (/\budp\b/.test(raw))    return '#475569';
  if (/\bdns\b/.test(raw))    return '#94a3b8';
  if (/icmp|ping/.test(norm)) return '#cbd5e1';

  return '#94a3b8';
};

const getNodeParentId = (nodeId, nodes) => {
  const node = nodes.find(n => n.id === nodeId);
  return node?.data?.parentId || node?.parentId || null;
};

const findLCA = (node1Id, node2Id, nodes) => {
  const getAncestors = (id) => {
    const list = [];
    let curr = id;
    while (curr) {
      const parent = getNodeParentId(curr, nodes);
      if (parent) {
        list.push(parent);
      }
      curr = parent;
    }
    return list;
  };

  const ancestors1 = getAncestors(node1Id);
  const ancestors2 = getAncestors(node2Id);

  for (const ancestor of ancestors1) {
    if (ancestors2.includes(ancestor)) {
      return ancestor;
    }
  }
  return null;
};

export const useGraphLayout = () => {
  const graphData = useArchitectureStore(state => state.graphData);
  const manualPositions = graphData?.manualPositions || {};

  const getLayoutedElements = useCallback(async (nodes, edges, collapsedZones = new Set(), toggleZoneCollapse) => {

    // 1. Filter hidden nodes
    const visibleNodes = nodes.filter(n => !isNodeHidden(n, nodes, collapsedZones));

    // 2. Build ELK node map
    const elkNodesMap = {};
    visibleNodes.forEach(node => {
      const isGroup     = node.type === 'INFRA_GROUP';
      const isCollapsed = isGroup && collapsedZones.has(node.id);

      const elkNode = {
        id: node.id,
        layoutOptions: {},
        children: [],
        edges: [],
      };

      if (isGroup) {
        const groupType = node.data?.metadata?.groupType || node.data?.groupType || 'default';
        const direction = (groupType === 'CI_CD' || groupType === 'MONITORING' || groupType === 'EXTERNAL') ? 'RIGHT' : 'DOWN';
        const nodeSpacing = (groupType === 'CI_CD' || groupType === 'EXTERNAL') ? '60' : '48';
        const layerSpacing = (groupType === 'CI_CD' || groupType === 'EXTERNAL') ? '60' : '64';

        elkNode.layoutOptions = {
          'elk.algorithm': 'layered',
          'elk.direction': direction,
          'elk.padding': '[top=48,left=32,bottom=32,right=32]',
          'elk.spacing.nodeNode': nodeSpacing,
          'elk.layered.spacing.nodeNodeBetweenLayers': layerSpacing,
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.layered.unnecessaryBendpoints': 'true',
        };
        if (isCollapsed) {
          elkNode.width  = 220;
          elkNode.height = 72;
        }
      } else {
        // Expand ServiceNode size slightly: 180×52 (to hold longer labels cleanly)
        elkNode.width  = 180;
        elkNode.height = 52;
      }

      elkNodesMap[node.id] = elkNode;
    });

    // 3. Assemble parent-child hierarchy
    const rootChildren = [];
    visibleNodes.forEach(node => {
      const elkNode  = elkNodesMap[node.id];
      const parentId = node.data?.parentId || node.parentId;
      if (parentId && elkNodesMap[parentId]) {
        elkNodesMap[parentId].children.push(elkNode);
      } else {
        rootChildren.push(elkNode);
      }
    });

    // 4. Build ELK edges with collapse-redirection (de-duplicated) and route via their LCA container
    const rootEdges  = [];
    const edgeKeySet = new Set();
    edges.forEach((edge, idx) => {
      const src = getRedirectTarget(edge.source, nodes, collapsedZones);
      const tgt = getRedirectTarget(edge.target, nodes, collapsedZones);
      if (src === tgt) return;
      const key = `${src}->${tgt}`;
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        
        const lcaId = findLCA(src, tgt, visibleNodes);
        const elkEdge = { id: edge.id || `elk-e-${idx}`, sources: [src], targets: [tgt] };
        
        if (lcaId && elkNodesMap[lcaId]) {
          elkNodesMap[lcaId].edges.push(elkEdge);
        } else {
          rootEdges.push(elkEdge);
        }
      }
    });

    // 5. Build root ELK graph with layout hints support
    const extra_padding = graphData?.stats?.layoutHints?.extra_padding || 0;
    const extra_edge_spacing = graphData?.stats?.layoutHints?.extra_edge_spacing || 0;
    const extra_node_spacing = graphData?.stats?.layoutHints?.extra_node_spacing || 0;

    const rootGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN', // Top-to-Bottom primary layout flow
        'elk.spacing.nodeNode': String(80 + extra_node_spacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': '110',
        'elk.padding': `[top=${48 + extra_padding},left=48,bottom=48,right=48]`,
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.layered.unnecessaryBendpoints': 'true',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.mergeEdges': 'true', // Trunk routing (comb)
        'elk.layered.mergeHierarchyEdges': 'true',
        'elk.layered.spacing.edgeNodeBetweenLayers': '30',
        'elk.layered.spacing.edgeEdgeBetweenLayers': String(20 + extra_edge_spacing),
        'elk.spacing.edgeNode': '25',
        'elk.spacing.edgeEdge': String(15 + extra_edge_spacing),
      },
      children: rootChildren,
      edges: rootEdges,
    };

    // 6. Run ELK layout
    try {
      const layoutedGraph = await elk.layout(rootGraph);

      // 6a. Collect absolute offsets recursively to convert local coordinates to global
      const absoluteOffsets = { root: { x: 0, y: 0 } };
      const layoutedNodesMap = {};

      const collectPositions = (elkNode, parentX = 0, parentY = 0, parentId = null) => {
        const absX = (elkNode.x ?? 0) + parentX;
        const absY = (elkNode.y ?? 0) + parentY;
        
        absoluteOffsets[elkNode.id] = { x: absX, y: absY };
        
        if (elkNode.id !== 'root') {
          layoutedNodesMap[elkNode.id] = {
            x: elkNode.x ?? 0,
            y: elkNode.y ?? 0,
            width:  elkNode.width,
            height: elkNode.height,
            parentId,
          };
        }
        
        (elkNode.children || []).forEach(child => 
          collectPositions(child, absX, absY, elkNode.id === 'root' ? null : elkNode.id)
        );
      };
      
      collectPositions(layoutedGraph, 0, 0, null);

      // 6b. Collect all edges recursively (including nested ones inside containers)
      const allLayoutedEdges = [];
      const collectEdges = (elkNode) => {
        if (elkNode.edges) {
          elkNode.edges.forEach(edge => {
            allLayoutedEdges.push({
              edge,
              containerId: elkNode.id === 'root' ? null : elkNode.id
            });
          });
        }
        (elkNode.children || []).forEach(child => collectEdges(child));
      };
      collectEdges(layoutedGraph);
      // 6c. Extract path points for each edge.
      //
      // ELK edge section coordinates (startPoint, bendPoints, endPoint) are ALWAYS
      // relative to the edge's OWNER / CONTAINER node — even with hierarchyHandling:
      // INCLUDE_CHILDREN. The fix is to uniformly add the container's absolute offset
      // to ALL points (start, bends, end).
      //
      // • Root-owned edges  → edgeOffset = {0,0}   (already in global space)
      // • Group-owned edges → edgeOffset = group's absolute position in flow space
      const edgePathMap = {};
      allLayoutedEdges.forEach(({ edge, containerId }) => {
        const srcId = edge.sources[0];
        const tgtId = edge.targets[0];

        // All section points share the SAME reference frame: the container node.
        const edgeOffset = containerId
          ? (absoluteOffsets[containerId] || { x: 0, y: 0 })
          : { x: 0, y: 0 };

        if (edge.sections && edge.sections.length > 0) {
          const section = edge.sections[0];
          const pathPoints = [];

          pathPoints.push({
            x: section.startPoint.x + edgeOffset.x,
            y: section.startPoint.y + edgeOffset.y,
          });

          if (section.bendPoints) {
            section.bendPoints.forEach(bp => {
              pathPoints.push({
                x: bp.x + edgeOffset.x,
                y: bp.y + edgeOffset.y,
              });
            });
          }

          pathPoints.push({
            x: section.endPoint.x + edgeOffset.x,
            y: section.endPoint.y + edgeOffset.y,
          });

          const key = `${srcId}->${tgtId}`;
          edgePathMap[key] = pathPoints;
        }
      });

      // 7. Rebuild React Flow Nodes — parents MUST come before children
      const groupNodes   = [];
      const serviceNodes = [];

      visibleNodes.forEach(node => {
        const layout = layoutedNodesMap[node.id];
        if (!layout) return;

        const isGroup     = node.type === 'INFRA_GROUP';
        const isCollapsed = isGroup && collapsedZones.has(node.id);
        const childCount  = nodes.filter(n =>
          n.data?.parentId === node.id || n.parentId === node.id
        ).length;

        let posX = layout.x;
        let posY = layout.y;
        if (manualPositions && manualPositions[node.id]) {
          posX = manualPositions[node.id].x;
          posY = manualPositions[node.id].y;
        }

        const updatedNode = {
          ...node,
          position: { x: posX, y: posY },
          parentId: layout.parentId ?? undefined,
        };

        if (isGroup) {
          updatedNode.style = { width: layout.width, height: layout.height };
          updatedNode.width = layout.width;
          updatedNode.height = layout.height;
          updatedNode.data  = { ...node.data, isCollapsed, childCount, onToggle: toggleZoneCollapse };
          if (layout.parentId) updatedNode.extent = 'parent';
          groupNodes.push(updatedNode);
        } else {
          updatedNode.extent = 'parent';
          updatedNode.width = 180; // Match the expanded size in layout options
          updatedNode.height = 52;
          serviceNodes.push(updatedNode);
        }
      });

      const finalNodes = [...groupNodes, ...serviceNodes];

      // 8. Rebuild React Flow Edges — using custom 'elk' edges with computed coordinates
      const finalEdges    = [];
      const addedEdgeKeys = new Set();

      edges.forEach(edge => {
        const src = getRedirectTarget(edge.source, nodes, collapsedZones);
        const tgt = getRedirectTarget(edge.target, nodes, collapsedZones);
        if (src === tgt) return;

        const key = `${src}->${tgt}`;
        if (addedEdgeKeys.has(key)) return;
        addedEdgeKeys.add(key);

        const protocol = edge.metadata?.label || edge.label || '';
        const color    = resolveEdgeColor(protocol);
        const pathPoints = edgePathMap[key] || [];

        finalEdges.push({
          ...edge,
          source: src,
          target: tgt,
          type: 'elk',
          data: { 
            protocol,
            pathPoints,
          },
          label: protocol,
          animated: false,
          style: { strokeWidth: 1.5, stroke: color },
          markerEnd: { type: 'arrowclosed', color, width: 12, height: 12 },
          zIndex: 10,
        });
      });

      return { nodes: finalNodes, edges: finalEdges };
    } catch (e) {
      console.error('ELK Layout failed:', e);
      return { nodes, edges };
    }
  }, []);

  return { getLayoutedElements };
};

export default useGraphLayout;
