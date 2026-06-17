const stripMarkdown = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\*\*/g, '').replace(/^\s*\*\s*/gm, '').trim();
};

export const normalizeFlowToText = (flowData) => {
  if (!flowData) return '';
  
  if (typeof flowData === 'string') {
    try {
      const parsed = JSON.parse(flowData);
      // If parsing gives a string or number, return it as string
      if (typeof parsed !== 'object') return String(parsed);
      return normalizeFlowToText(parsed);
    } catch (e) {
      return stripMarkdown(flowData);
    }
  }
  
  if (Array.isArray(flowData)) {
    if (flowData.every(item => typeof item === 'string')) {
      return stripMarkdown(flowData.join('\n'));
    }
    return flowData.map(item => {
      let title = item.name || item.title || item.flowName || '';
      let stepsStr = '';
      if (item.steps) {
        stepsStr = Array.isArray(item.steps) ? item.steps.join('\n') : item.steps;
      } else if (item.description) {
        stepsStr = item.description;
      } else {
        // Maybe it's just an object without known keys
        const otherVals = Object.values(item).filter(v => typeof v === 'string');
        if (otherVals.length > 0) stepsStr = otherVals.join('\n');
      }
      return stripMarkdown((title ? `${title}:\n` : '') + stepsStr);
    }).join('\n\n').trim();
  }
  
  if (typeof flowData === 'object') {
    if (flowData.steps) return normalizeFlowToText(flowData.steps);
    if (flowData.flows) return normalizeFlowToText(flowData.flows);
    if (flowData.mainFlow) return normalizeFlowToText(flowData.mainFlow);
    if (flowData.alternativeFlows) return normalizeFlowToText(flowData.alternativeFlows);
    
    // Key-value mapping
    return Object.entries(flowData).map(([key, value]) => {
      let valueStr = typeof value === 'string' ? value : 
                     Array.isArray(value) ? value.join('\n') : 
                     JSON.stringify(value);
      return stripMarkdown(`${key}:\n${valueStr}`);
    }).join('\n\n').trim();
  }
  
  return String(flowData);
};
