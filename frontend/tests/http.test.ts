import axios, { type AxiosAdapter, type AxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  createHttpClient,
  setUnauthorizedHandler,
} from '../src/api/http'

const mocks = vi.hoisted(() => ({
  elMessageError: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mocks.elMessageError,
  },
}))

function createAdapter(
  handler: (config: AxiosRequestConfig) => {
    status?: number
    data: unknown
    headers?: Record<string, string>
  },
): AxiosAdapter {
  return async (config) => {
    const result = handler(config)

    return {
      config,
      data: result.data,
      headers: result.headers || { 'content-type': 'application/json' },
      status: result.status || 200,
      statusText: 'OK',
    }
  }
}

describe('http client', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.elMessageError.mockClear()
    setUnauthorizedHandler(undefined)
  })

  afterEach(() => {
    setUnauthorizedHandler(undefined)
  })

  it('unwraps successful api responses and attaches bearer token', async () => {
    localStorage.setItem('mail_token', 'token-123')
    let authorizationHeader: string | undefined

    const instance = axios.create({
      adapter: createAdapter((config) => {
        authorizationHeader = String(config.headers?.Authorization)

        return {
          data: {
            code: 0,
            message: 'success',
            data: { username: 'admin' },
          },
        }
      }),
    })

    const http = createHttpClient(instance)

    await expect(http.get<{ username: string }>('/api/users/me')).resolves.toEqual({
      username: 'admin',
    })
    expect(authorizationHeader).toBe('Bearer token-123')
  })

  it('throws ApiError and shows toast when business code is not zero', async () => {
    const instance = axios.create({
      adapter: createAdapter(() => ({
        data: {
          code: 40000,
          message: '用户名不能为空',
          data: null,
        },
      })),
    })

    const http = createHttpClient(instance)

    await expect(http.post('/api/auth/login', {})).rejects.toMatchObject({
      code: 40000,
      message: '用户名不能为空',
    })
    expect(mocks.elMessageError).toHaveBeenCalledWith('用户名不能为空')
  })

  it('clears session and calls unauthorized handler on login-expired code', async () => {
    localStorage.setItem('mail_token', 'token-123')
    localStorage.setItem('mail_user', '{"username":"admin"}')
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    const instance = axios.create({
      adapter: createAdapter(() => ({
        data: {
          code: 40002,
          message: '请先登录',
          data: null,
        },
      })),
    })

    const http = createHttpClient(instance)

    await expect(http.get('/api/users/me')).rejects.toBeInstanceOf(ApiError)
    expect(localStorage.getItem('mail_token')).toBeNull()
    expect(localStorage.getItem('mail_user')).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('returns blobs without json unwrapping', async () => {
    const blob = new Blob(['file-content'], { type: 'text/plain' })
    const instance = axios.create({
      adapter: createAdapter(() => ({
        data: blob,
        headers: { 'content-type': 'text/plain' },
      })),
    })

    const http = createHttpClient(instance)

    await expect(http.blob('/api/files/file_1/download')).resolves.toBe(blob)
  })
})
