type NetworkEnv = Partial<
  Record<'VITE_USE_MOCK' | 'VITE_MOCK_API_BASE_URL' | 'VITE_SERVER_API_BASE_URL', string>
>

export type NetworkConfig = {
  useMock: boolean
  mockBaseURL: string
  serverBaseURL: string
  apiBaseURL: string
}

const DEFAULT_MOCK_BASE_URL = '/mock-api'
const DEFAULT_SERVER_BASE_URL = 'https://api.scut-mail.example.com'

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeServerBaseURL(value: string) {
  return trimTrailingSlashes(value).replace(/\/api$/, '')
}

function parseUseMock(value: string | undefined) {
  if (value === undefined || value.trim() === '') {
    return true
  }

  return !['false', '0', 'off', 'no'].includes(value.trim().toLowerCase())
}

export function resolveNetworkConfig(env: NetworkEnv): NetworkConfig {
  const useMock = parseUseMock(env.VITE_USE_MOCK)
  const mockBaseURL = trimTrailingSlashes(
    env.VITE_MOCK_API_BASE_URL || DEFAULT_MOCK_BASE_URL,
  )
  const serverBaseURL = normalizeServerBaseURL(
    env.VITE_SERVER_API_BASE_URL || DEFAULT_SERVER_BASE_URL,
  )

  return {
    useMock,
    mockBaseURL,
    serverBaseURL,
    apiBaseURL: useMock ? mockBaseURL : serverBaseURL,
  }
}

export const networkConfig = resolveNetworkConfig(import.meta.env)
