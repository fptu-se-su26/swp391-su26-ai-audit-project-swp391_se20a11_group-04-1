const trimTrailingSlash = (value) => value?.replace(/\/+$/, '')

const toWsProtocol = (protocol) => (protocol === 'https:' ? 'wss:' : 'ws:')

const toWsUrl = (url) => url.replace(/^http/i, 'ws')

export const getApiBaseUrl = () => trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api')

export const getApiV1BaseUrl = () => `${getApiBaseUrl()}/v1`

export const getStompWebSocketUrl = () => {
  const configuredWs = trimTrailingSlash(import.meta.env.VITE_STOMP_WS_URL)
  if (configuredWs) return configuredWs.endsWith('/ws') ? configuredWs : `${configuredWs}/ws`

  const configuredApi = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)
  if (configuredApi && /^https?:\/\//i.test(configuredApi)) {
    const apiRoot = configuredApi.replace(/\/api(?:\/v1)?$/i, '')
    return `${toWsUrl(apiRoot)}/ws`
  }

  return `${toWsProtocol(window.location.protocol)}//${window.location.host}/ws`
}

export const getNotificationWebSocketUrl = (userId) => {
  const configuredWs = trimTrailingSlash(import.meta.env.VITE_NOTIFICATION_WS_URL)
  if (configuredWs) {
    return `${configuredWs}/notifications?userId=${encodeURIComponent(userId)}`
  }

  const configuredApi = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL)
  if (configuredApi && /^https?:\/\//i.test(configuredApi)) {
    const baseWs = toWsUrl(configuredApi)
    const wsBase = baseWs.endsWith('/api') ? baseWs : `${baseWs}/api`
    return `${wsBase}/ws/notifications?userId=${encodeURIComponent(userId)}`
  }

  return `${toWsProtocol(window.location.protocol)}//${window.location.host}/api/ws/notifications?userId=${encodeURIComponent(userId)}`
}
