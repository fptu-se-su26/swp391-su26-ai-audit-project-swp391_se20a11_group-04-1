import { useCallback } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';

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

export const useGraphLayout = () => {
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
      };

      if (isGroup) {
        elkNode.layoutOptions = {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'elk.padding': '[top=48,left=28,bottom=28,right=28]',
          'elk.spacing.nodeNode': '32',
          'elk.layered.spacing.nodeNodeBetweenLayers': '44',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.layered.unnecessaryBendpoints': 'true',
        };
        if (isCollapsed) {
          elkNode.width  = 220;
          elkNode.height = 72;
        }
      } else {
        // Match compact ServiceNode: 160×52
        elkNode.width  = 160;
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

    // 4. Build ELK edges with collapse-redirection (de-duplicated)
    const elkEdges   = [];
    const edgeKeySet = new Set();
    edges.forEach((edge, idx) => {
      const src = getRedirectTarget(edge.source, nodes, collapsedZones);
      const tgt = getRedirectTarget(edge.target, nodes, collapsedZones);
      if (src === tgt) return;
      const key = `${src}->${tgt}`;
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        elkEdges.push({ id: edge.id || `elk-e-${idx}`, sources: [src], targets: [tgt] });
      }
    });

    // 5. Build root ELK graph
    const rootGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '48',
        'elk.layered.spacing.nodeNodeBetweenLayers': '72',
        'elk.padding': '[top=36,left=36,bottom=36,right=36]',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.layered.unnecessaryBendpoints': 'true',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      },
      children: rootChildren,
      edges: elkEdges,
    };

    // 6. Run ELK layout
    try {
      const layoutedGraph = await elk.layout(rootGraph);

      // 6a. Collect node absolute positions (recursive)
      const layoutedNodesMap = {};
      const collectPositions = (elkNode, parentId = null) => {
        layoutedNodesMap[elkNode.id] = {
          x: elkNode.x ?? 0,
          y: elkNode.y ?? 0,
          width:  elkNode.width,
          height: elkNode.height,
          parentId,
        };
        (elkNode.children || []).forEach(child => collectPositions(child, elkNode.id));
      };
      layoutedGraph.children.forEach(child => collectPositions(child));

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

        const updatedNode = {
          ...node,
          position: { x: layout.x, y: layout.y },
          parentId: layout.parentId ?? undefined,
        };

        if (isGroup) {
          updatedNode.style = { width: layout.width, height: layout.height };
          updatedNode.data  = { ...node.data, isCollapsed, childCount, onToggle: toggleZoneCollapse };
          // Nested groups (e.g. Docker Compose inside EC2) must also be contained
          if (layout.parentId) updatedNode.extent = 'parent';
          groupNodes.push(updatedNode);
        } else {
          updatedNode.extent = 'parent';
          serviceNodes.push(updatedNode);
        }
      });

      // Parents before children (React Flow compound node requirement)
      const finalNodes = [...groupNodes, ...serviceNodes];

      // 8. Rebuild React Flow Edges — ELK already positioned nodes to minimize
      //    crossings; we let React Flow draw the actual paths (smoothstep)
      //    because it always uses correct global sourceX/Y targetX/Y coords.
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

        finalEdges.push({
          ...edge,
          source: src,
          target: tgt,
          type: 'smoothstep',
          data: { protocol },
          label: protocol,
          animated: false,
          style: { strokeWidth: 1.5, stroke: color },
          labelStyle: { fontSize: 9, fontFamily: 'monospace', fill: color, fontWeight: 600 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
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
