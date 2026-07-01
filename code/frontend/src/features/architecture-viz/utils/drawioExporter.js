const esc = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const exportToDrawioXML = (nodes, edges) => {
  const cells = [];
  cells.push('<mxCell id="0" />');
  cells.push('<mxCell id="1" parent="0" />');

  // Helper mapping: group types to Draw.io styles
  const groupStyles = {
    CI_CD: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF5E6;strokeColor=#FF9900;strokeWidth=2;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;',
    CLOUD_INSTANCE: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F2F8FC;strokeColor=#0073BB;strokeWidth=2;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;',
    CONTAINER_CLUSTER: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#EAF7F7;strokeColor=#00A4A4;strokeWidth=2;dashed=1;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;',
    MONITORING: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F6F0FA;strokeColor=#8C46B3;strokeWidth=2;dashed=1;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;',
    EXTERNAL: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#7F7F7F;strokeWidth=2;dashed=1;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;',
    default: 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#CCCCCC;strokeWidth=1;dashed=1;align=left;verticalAlign=top;spacingLeft=36;fontStyle=1;fontSize=12;fontColor=#232F3E;'
  };

  // 1. Process group nodes first
  nodes.forEach(node => {
    if (node.type === 'INFRA_GROUP') {
      const groupType = node.data?.metadata?.groupType || node.data?.groupType || 'default';
      const style = groupStyles[groupType] || groupStyles.default;
      const label = node.data?.name || node.label || 'Group';
      const parent = node.parentId || '1';
      const w = node.width || node.style?.width || 200;
      const h = node.height || node.style?.height || 200;
      const x = node.position?.x ?? 0;
      const y = node.position?.y ?? 0;

      cells.push(`
        <mxCell id="${esc(node.id)}" value="${esc(label)}" style="${style}" vertex="1" parent="${esc(parent)}">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>
      `);
    }
  });

  // 2. Process service/class nodes
  nodes.forEach(node => {
    if (node.type === 'CLASS') {
      const label = node.data?.name || node.label || 'Service';
      const parent = node.parentId || '1';
      const w = node.width || 180;
      const h = node.height || 52;
      const x = node.position?.x ?? 0;
      const y = node.position?.y ?? 0;
      const type = node.data?.metadata?.type || node.data?.type || 'service';

      // Shape variation for databases
      const shape = type === 'database' ? 'shape=cylinder;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;' : 'rounded=1;whiteSpace=wrap;html=1;';
      const style = `${shape}fillColor=#FFFFFF;strokeColor=#5A6B7B;strokeWidth=1.5;align=center;verticalAlign=middle;fontSize=11;fontColor=#1A1A1A;`;

      cells.push(`
        <mxCell id="${esc(node.id)}" value="${esc(label)}" style="${style}" vertex="1" parent="${esc(parent)}">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>
      `);
    }
  });

  // 3. Process edges
  edges.forEach(edge => {
    const label = edge.data?.protocol || edge.label || '';
    const color = edge.style?.stroke || '#94a3b8';
    
    // Check if event streaming for dashed link
    const isAsync = /kafka|rabbitmq|mqtt|sns|sqs|event|stream|pubsub/i.test(label);
    const dash = isAsync ? 'dashed=1;' : '';
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=${color};strokeWidth=1.5;endArrow=block;${dash}`;

    cells.push(`
      <mxCell id="${esc(edge.id)}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${esc(edge.source)}" target="${esc(edge.target)}">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>
    `);
  });

  // Construct complete draw.io XML envelope
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" version="20.0.0">
  <diagram id="diagram_1" name="Page-1">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="2000">
      <root>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
};
