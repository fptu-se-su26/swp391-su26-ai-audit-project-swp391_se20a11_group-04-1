export const UI_ACTIONS = [
  'goto',
  'fill',
  'click',
  'select',
  'wait_for',
  'expect_url',
  'expect_text',
  'expect_visible',
  'expect_hidden',
]

export const SELECTOR_ACTIONS = new Set([
  'fill',
  'click',
  'select',
  'wait_for',
  'expect_text',
  'expect_visible',
  'expect_hidden',
])

const ACTION_ALIASES = {
  navigate: 'goto',
  navigation: 'goto',
  open: 'goto',
  visit: 'goto',
  type: 'fill',
  input: 'fill',
  enter: 'fill',
  choose: 'select',
  wait: 'wait_for',
  waitfor: 'wait_for',
  assert_url: 'expect_url',
  assert_text: 'expect_text',
  verify_text: 'expect_text',
  visible: 'expect_visible',
  hidden: 'expect_hidden',
}

const asObject = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
)

const firstText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

const isPlaceholderText = (value) => {
  if (value === null || value === undefined) return true
  const text = String(value).trim().toLowerCase()
  if (!text) return true
  return text.includes('e.g.')
    || text.includes('placeholder')
    || text.includes('selector not found')
    || text.includes('not available')
    || text === 'selector'
    || text.startsWith('selector ')
    || text.startsWith('path ')
    || text.includes('value to input')
    || text === 'value'
    || text === 'sample value'
}

const firstExecutableText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text && !isPlaceholderText(text)) return text
  }
  return ''
}

export const parseMaybeJsonArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const inferActionFromDescription = (description) => {
  const text = String(description || '').toLowerCase()
  if (/(url|route|path|redirect|dashboard|home)/.test(text) && /(verify|expect|assert|check|validate|confirm|should)/.test(text)) return 'expect_url'
  if (/(verify|expect|assert|check|validate|confirm|shown|visible|display)/.test(text)) return 'expect_text'
  if (/(navigate|go to|open|visit)/.test(text)) return 'goto'
  if (/(enter|input|type|fill|provide)/.test(text)) return 'fill'
  if (/(click|tap|press)/.test(text)) return 'click'
  if (/(select|choose|pick)/.test(text)) return 'select'
  if (/(wait|loaded|appear)/.test(text)) return 'wait_for'
  return 'goto'
}

export const normalizeUiAction = (action, description = '') => {
  const raw = firstText(action)
  if (!raw) return inferActionFromDescription(description)
  const key = raw.replace(/[\s-]+/g, '_').toLowerCase()
  return UI_ACTIONS.includes(key) ? key : (ACTION_ALIASES[key] || inferActionFromDescription(description))
}

export const normalizeUiStep = (step, index = 0, fallbackStep = null) => {
  const source = asObject(step)
  const fallback = asObject(fallbackStep)
  const sourceDescription = typeof step === 'string' ? step : source.description
  const fallbackDescription = typeof fallbackStep === 'string' ? fallbackStep : fallback.description
  const description = firstText(sourceDescription, source.title, fallbackDescription)
  const action = normalizeUiAction(
    firstText(source.action, source.type, source.command, fallback.action, fallback.type, fallback.command),
    description,
  )

  const normalized = {
    order: Number(source.order || source.stepNumber || fallback.order || fallback.stepNumber || index + 1),
    action,
    description,
  }

  if (action === 'goto') {
    normalized.path = firstExecutableText(source.path, source.url, source.href, source.target, fallback.path, fallback.url, fallback.href, fallback.target)
  }

  if (SELECTOR_ACTIONS.has(action)) {
    normalized.selector = firstExecutableText(source.selector, source.locator, source.target, source.field, fallback.selector, fallback.locator, fallback.target, fallback.field)
  }

  if (action === 'fill' || action === 'select') {
    normalized.value = firstExecutableText(source.value, source.input, source.text, source.option, fallback.value, fallback.input, fallback.text, fallback.option)
  }

  if (action === 'expect_url') {
    normalized.expected = firstExecutableText(source.expected, source.expectedUrl, source.url, source.path, fallback.expected, fallback.expectedUrl, fallback.url, fallback.path)
  }

  if (action === 'expect_text') {
    normalized.expected = firstExecutableText(source.expected, source.expectedText, source.text, source.value, fallback.expected, fallback.expectedText, fallback.text, fallback.value)
  }

  if (action === 'expect_visible' || action === 'expect_hidden') {
    const expected = firstExecutableText(source.expected, source.expectedText, fallback.expected, fallback.expectedText)
    if (expected) normalized.expected = expected
  }

  return normalized
}

export const normalizeUiSteps = (steps, fallbackSteps = []) => {
  const primary = parseMaybeJsonArray(steps)
  const fallback = parseMaybeJsonArray(fallbackSteps)
  const source = primary.length > 0 ? primary : fallback
  return source.map((step, index) => normalizeUiStep(step, index, fallback[index]))
}

export const uiStepToDescription = (step, index = 0) => {
  const normalized = normalizeUiStep(step, index)
  if (normalized.description) return normalized.description

  switch (normalized.action) {
    case 'goto':
      return `Navigate to ${normalized.path || 'the target page'}`
    case 'fill':
      return `Fill ${normalized.selector || 'field'}`
    case 'click':
      return `Click ${normalized.selector || 'element'}`
    case 'select':
      return `Select option in ${normalized.selector || 'field'}`
    case 'wait_for':
      return `Wait for ${normalized.selector || 'element'}`
    case 'expect_url':
      return `Verify URL is ${normalized.expected || 'expected'}`
    case 'expect_text':
      return `Verify text on ${normalized.selector || 'element'}`
    case 'expect_visible':
      return `Verify ${normalized.selector || 'element'} is visible`
    case 'expect_hidden':
      return `Verify ${normalized.selector || 'element'} is hidden`
    default:
      return `Step ${index + 1}`
  }
}

export const getUiStepValidationError = (step, index = 0) => {
  const normalized = normalizeUiStep(step, index)
  const prefix = `Step ${index + 1}`

  if (normalized.action === 'goto' && !normalized.path) {
    return `${prefix}: path is required for Navigate.`
  }
  if (SELECTOR_ACTIONS.has(normalized.action) && !normalized.selector) {
    return `${prefix}: selector is required for ${normalized.action}.`
  }
  if ((normalized.action === 'fill' || normalized.action === 'select') && !normalized.value) {
    return `${prefix}: value is required for ${normalized.action}.`
  }
  if ((normalized.action === 'expect_url' || normalized.action === 'expect_text') && !normalized.expected) {
    return `${prefix}: expected value is required for ${normalized.action}.`
  }

  return null
}
