export const exportToDrawio = (nodes, edges, diagramName = "Use Case Diagram") => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="AI-Audit" version="24.2.5" type="device">
  <diagram id="diagram_1" name="Page-1">
    <mxGraphModel dx="1434" dy="844" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`;

    // Process nodes
    nodes.forEach(node => {
        const drawioId = `dx_${node.id}`;
        if (node.type === 'actor') {
            xmlStr += `
        <mxCell id="${drawioId}" value="${escapeXml(node.data?.label || 'Actor')}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="${node.position.x}" y="${node.position.y}" width="30" height="60" as="geometry" />
        </mxCell>`;
        } else if (node.type === 'useCase') {
            xmlStr += `
        <mxCell id="${drawioId}" value="${escapeXml(node.data?.label || 'Use Case')}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="${node.position.x}" y="${node.position.y}" width="140" height="70" as="geometry" />
        </mxCell>`;
        } else if (node.type === 'systemBoundary') {
            const width = node.style?.width || node.width || 400;
            const height = node.style?.height || node.height || 600;
            xmlStr += `
        <mxCell id="${drawioId}" value="${escapeXml(node.data?.label || 'System')}" style="shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;" vertex="1" parent="1">
          <mxGeometry x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" as="geometry" />
        </mxCell>`;
        }
    });

    // Process edges
    edges.forEach(edge => {
        let edgeStyle = "html=1;endArrow=none;endFill=0;";
        let label = "";
        const edgeLabel = edge.label || edge.data?.label || "";
        
        if (edgeLabel.includes('include')) {
             edgeStyle = "html=1;dashed=1;endArrow=open;endFill=0;";
             label = "&lt;&lt;include&gt;&gt;";
        } else if (edgeLabel.includes('extend')) {
             edgeStyle = "html=1;dashed=1;endArrow=open;endFill=0;";
             label = "&lt;&lt;extend&gt;&gt;";
        }

        xmlStr += `
        <mxCell id="edge_${edge.id}" value="${label}" style="${edgeStyle}" edge="1" parent="1" source="dx_${edge.source}" target="dx_${edge.target}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
    });

    xmlStr += `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    // Trigger download
    const blob = new Blob([xmlStr], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `${diagramName.replace(/\s+/g, '_')}.drawio`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
};

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}
