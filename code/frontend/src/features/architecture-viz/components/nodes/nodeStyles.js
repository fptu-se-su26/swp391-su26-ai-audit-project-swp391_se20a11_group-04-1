export const getTypeColor = (type) => {
  switch (type) {
    case 'PACKAGE': return '#009688'
    case 'FILE': return '#607D8B'
    case 'CLASS': return '#2196F3'
    case 'INTERFACE': return '#9C27B0'
    case 'METHOD':
    case 'FUNCTION': return '#FF9800'
    case 'COMPONENT': return '#E91E63'
    case 'HOOK': return '#9E9E9E'
    default: return '#3F51B5'
  }
}

export const getRiskBorderColor = (level) => {
  switch (level) {
    case 'CRITICAL': return '#B71C1C'
    case 'HIGH': return '#E65100'
    case 'MEDIUM': return '#F57F17'
    default: return '#1B5E20'
  }
}

export const getTypeIconName = (type) => {
  switch (type) {
    case 'PACKAGE': return 'folder'
    case 'FILE': return 'description'
    case 'CLASS': return 'class'
    case 'INTERFACE': return 'settings_ethernet'
    case 'METHOD':
    case 'FUNCTION': return 'bolt'
    case 'COMPONENT': return 'widgets'
    case 'HOOK': return 'extension'
    default: return 'help_outline'
  }
}
