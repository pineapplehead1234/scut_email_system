import { describe, expect, it } from 'vitest'

import { resolveNetworkConfig } from '../src/config/network'

describe('network config', () => {
  it('uses mock api by default', () => {
    expect(resolveNetworkConfig({})).toEqual({
      useMock: true,
      mockBaseURL: '/mock-api',
      serverBaseURL: 'https://api.scut-mail.example.com/api',
      apiBaseURL: '/mock-api',
    })
  })

  it('uses server api when VITE_USE_MOCK is false', () => {
    expect(
      resolveNetworkConfig({
        VITE_USE_MOCK: 'false',
        VITE_SERVER_API_BASE_URL: 'https://server.example.test/api',
      }).apiBaseURL,
    ).toBe('https://server.example.test/api')
  })

  it('allows overriding the mock api base url', () => {
    expect(
      resolveNetworkConfig({
        VITE_USE_MOCK: 'true',
        VITE_MOCK_API_BASE_URL: 'http://127.0.0.1:3001/api',
      }).apiBaseURL,
    ).toBe('http://127.0.0.1:3001/api')
  })
})
