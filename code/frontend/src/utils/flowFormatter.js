const stripMarkdown = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\*\*/g, '').replace(/^\s*\*\s*/gm, '').trim();
};

/**
 * Format a StructuredMainFlow step object into readable text.
 * Step format: { step, actorRef, actorAction, systemResponse }
 */
const formatMainFlowStep = (step, refToName = {}) => {
  if (typeof step === 'string') return stripMarkdown(step);
  if (!step || typeof step !== 'object') return '';
  
  const stepNum = step.step ? `${step.step}. ` : '';
  const actorName = step.actorRef ? (refToName[step.actorRef] || step.actorRef) : '';
  const actorAction = step.actorAction ? stripMarkdown(step.actorAction) : '';
  const sysResponse = step.systemResponse ? stripMarkdown(step.systemResponse) : '';
  
  if (actorAction && sysResponse) {
    return `${stepNum}[${actorName}] ${actorAction}\n   → System: ${sysResponse}`;
  } else if (actorAction) {
    return `${stepNum}[${actorName}] ${actorAction}`;
  } else if (sysResponse) {
    return `${stepNum}System: ${sysResponse}`;
  }
  // Fallback: just values
  const parts = Object.values(step).filter(v => typeof v === 'string' && v.trim());
  return stepNum + parts.join(' | ');
};

/**
 * Format a StructuredAlternativeFlow AltFlow object into readable text.
 * AltFlow format: { id, triggerStep, condition, steps: [{ step, actorRef, action }] }
 */
const formatAltFlow = (flow, refToName = {}) => {
  if (typeof flow === 'string') return stripMarkdown(flow);
  if (!flow || typeof flow !== 'object') return '';
  
  const id = flow.id || '';
  const condition = flow.condition ? stripMarkdown(flow.condition) : '';
  const trigger = flow.triggerStep ? ` (at step ${flow.triggerStep})` : '';
  
  let header = id ? `${id}${trigger}: ${condition}` : condition;
  
  if (flow.steps && Array.isArray(flow.steps)) {
    const stepsText = flow.steps.map(s => {
      if (typeof s === 'string') return `  - ${stripMarkdown(s)}`;
      const actorName = s.actorRef ? (refToName[s.actorRef] || s.actorRef) : '';
      const action = s.action || s.actorAction || '';
      const num = s.step ? `  ${s.step}. ` : '  - ';
      return `${num}[${actorName}] ${stripMarkdown(action)}`;
    }).join('\n');
    return header ? `${header}\n${stepsText}` : stepsText;
  }
  
  return header;
};

export const normalizeFlowToText = (flowData, refToName = {}) => {
  if (!flowData) return '';
  
  if (typeof flowData === 'string') {
    try {
      const parsed = JSON.parse(flowData);
      if (typeof parsed !== 'object') return String(parsed);
      return normalizeFlowToText(parsed, refToName);
    } catch (e) {
      return stripMarkdown(flowData);
    }
  }
  
  if (Array.isArray(flowData)) {
    if (flowData.length === 0) return '';
    
    // Array of step objects (StructuredMainFlow.steps or StructuredAlternativeFlow.AltStep[])
    if (flowData[0] && typeof flowData[0] === 'object') {
      // Check if these are main flow steps: have actorAction or systemResponse
      if ('actorAction' in flowData[0] || 'systemResponse' in flowData[0]) {
        return flowData.map(s => formatMainFlowStep(s, refToName)).filter(Boolean).join('\n');
      }
      // Check if these are alt flow items: have condition or flows array structure
      if ('condition' in flowData[0] || 'id' in flowData[0]) {
        return flowData.map(f => formatAltFlow(f, refToName)).filter(Boolean).join('\n\n');
      }
      // Alt flow steps: have actorRef + action
      if ('action' in flowData[0] || 'actorRef' in flowData[0]) {
        return flowData.map(s => {
          const num = s.step ? `${s.step}. ` : '- ';
          const actor = s.actorRef ? (refToName[s.actorRef] || s.actorRef) : '';
          const action = s.action || s.actorAction || '';
          return `${num}[${actor}] ${stripMarkdown(action)}`;
        }).filter(Boolean).join('\n');
      }
    }
    
    // Plain string array
    if (flowData.every(item => typeof item === 'string')) {
      return stripMarkdown(flowData.join('\n'));
    }
    
    // Mixed/unknown — format each item
    return flowData.map(item => {
      if (typeof item === 'string') return stripMarkdown(item);
      let title = item.name || item.title || item.flowName || '';
      let stepsStr = '';
      if (item.steps && Array.isArray(item.steps)) {
        stepsStr = normalizeFlowToText(item.steps, refToName);
      } else if (item.description) {
        stepsStr = stripMarkdown(item.description);
      } else {
        const otherVals = Object.values(item).filter(v => typeof v === 'string');
        stepsStr = otherVals.join('\n');
      }
      return (title ? `${title}:\n` : '') + stepsStr;
    }).join('\n\n').trim();
  }
  
  if (typeof flowData === 'object') {
    // StructuredMainFlow: { steps: [...] }
    if (flowData.steps && Array.isArray(flowData.steps)) {
      return normalizeFlowToText(flowData.steps, refToName);
    }
    // StructuredAlternativeFlow: { flows: [...] }
    if (flowData.flows && Array.isArray(flowData.flows)) {
      return normalizeFlowToText(flowData.flows, refToName);
    }
    if (flowData.mainFlow) return normalizeFlowToText(flowData.mainFlow, refToName);
    if (flowData.alternativeFlows) return normalizeFlowToText(flowData.alternativeFlows, refToName);
    
    // Fallback: key-value dump
    return Object.entries(flowData).map(([key, value]) => {
      let valueStr = typeof value === 'string' ? value :
                     Array.isArray(value) ? normalizeFlowToText(value, refToName) :
                     JSON.stringify(value);
      return stripMarkdown(`${key}:\n${valueStr}`);
    }).join('\n\n').trim();
  }
  
  return String(flowData);
};
