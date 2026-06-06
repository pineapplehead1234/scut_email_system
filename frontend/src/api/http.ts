import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { ElMessage } from 'element-plus'

import { networkConfig } from '../config/network'
import type { ApiResponse } from './type'

export type HttpRequestConfig = AxiosRequestConfig & {
  silent?: boolean
}

export type HttpClient = {
  get<T>(url: string, config?: HttpRequestConfig): Promise<T>
  post<T, B = unknown>(
    url: string,
    data?: B,
    config?: HttpRequestConfig,
  ): Promise<T>
  put<T, B = unknown>(
    url: string,
    data?: B,
    config?: HttpRequestConfig,
  ): Promise<T>
  patch<T, B = unknown>(
    url: string,
    data?: B,
    config?: HttpRequestConfig,
  ): Promise<T>
  delete<T>(url: string, config?: HttpRequestConfig): Promise<T>
  upload<T>(
    url: string,
    data: FormData,
    config?: HttpRequestConfig,
  ): Promise<T>
  blob(url: string, config?: HttpRequestConfig): Promise<Blob>
}

export class ApiError extends Error {
  code: number
  status?: number
  data: unknown

  constructor(message: string, code: number, status?: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.data = data
  }
}

const LOGIN_EXPIRED_CODE = 40002
const TOKEN_STORAGE_KEY = 'mail_token'
const USER_STORAGE_KEY = 'mail_user'

let unauthorizedHandler: (() => void) | undefined

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler
}

function readToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

function clearLocalSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.code === 'number' && typeof record.message === 'string'
}

function resolveApiErrorMessage(error: ApiError) {
  if (error.message) {
    return error.message
  }

  if (error.status && error.status >= 500) {
    return '服务异常，请稍后重试'
  }

  return '请求失败，请稍后重试'
}

function notifyError(error: ApiError, config?: HttpRequestConfig) {
  if (config?.silent) {
    return
  }

  ElMessage.error(resolveApiErrorMessage(error))
}

function handleUnauthorized(error: ApiError) {
  if (error.code !== LOGIN_EXPIRED_CODE && error.status !== 401) {
    return
  }

  clearLocalSession()
  unauthorizedHandler?.()
}

function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>) {
  const body = response.data

  if (!isApiResponse(body)) {
    throw new ApiError('响应格式错误', 50000, response.status, body)
  }

  if (body.code !== 0) {
    throw new ApiError(body.message, body.code, response.status, body.data)
  }

  return body.data
}

async function readBlobAsApiResponse(blob: Blob) {
  if (!blob.type.includes('application/json')) {
    return null
  }

  try {
    const text = await blob.text()

    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status
    let data = error.response?.data

    if (data instanceof Blob) {
      data = await readBlobAsApiResponse(data)
    }

    if (isApiResponse(data)) {
      return new ApiError(data.message, data.code, status, data.data)
    }

    if (status === 401) {
      return new ApiError('请先登录', LOGIN_EXPIRED_CODE, status, data)
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('请求超时，请稍后重试', 50000, status, data)
    }

    if (!error.response) {
      return new ApiError('网络连接异常', 50000, status, data)
    }

    return new ApiError(
      status && status >= 500 ? '服务异常，请稍后重试' : '请求失败，请稍后重试',
      status || 50000,
      status,
      data,
    )
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 50000)
  }

  return new ApiError('请求失败，请稍后重试', 50000)
}

function installRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = readToken()

    if (token) {
      config.headers = AxiosHeaders.from(config.headers)
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    return config
  })
}

async function runRequest<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>,
  config?: HttpRequestConfig,
) {
  try {
    const response = await request()

    return unwrapResponse<T>(response)
  } catch (error) {
    const apiError = await toApiError(error)

    handleUnauthorized(apiError)
    notifyError(apiError, config)

    throw apiError
  }
}

async function runBlobRequest(
  request: () => Promise<AxiosResponse<Blob>>,
  config?: HttpRequestConfig,
) {
  try {
    const response = await request()
    const errorBody = await readBlobAsApiResponse(response.data)

    if (isApiResponse(errorBody) && errorBody.code !== 0) {
      throw new ApiError(
        errorBody.message,
        errorBody.code,
        response.status,
        errorBody.data,
      )
    }

    return response.data
  } catch (error) {
    const apiError = await toApiError(error)

    handleUnauthorized(apiError)
    notifyError(apiError, config)

    throw apiError
  }
}

export function createHttpClient(instance: AxiosInstance): HttpClient {
  installRequestInterceptor(instance)

  return {
    get<T>(url: string, config?: HttpRequestConfig) {
      return runRequest<T>(() => instance.get(url, config), config)
    },

    post<T, B = unknown>(url: string, data?: B, config?: HttpRequestConfig) {
      return runRequest<T>(() => instance.post(url, data, config), config)
    },

    put<T, B = unknown>(url: string, data?: B, config?: HttpRequestConfig) {
      return runRequest<T>(() => instance.put(url, data, config), config)
    },

    patch<T, B = unknown>(url: string, data?: B, config?: HttpRequestConfig) {
      return runRequest<T>(() => instance.patch(url, data, config), config)
    },

    delete<T>(url: string, config?: HttpRequestConfig) {
      return runRequest<T>(() => instance.delete(url, config), config)
    },

    upload<T>(url: string, data: FormData, config?: HttpRequestConfig) {
      return runRequest<T>(
        () =>
          instance.post(url, data, {
            ...config,
            headers: {
              ...config?.headers,
              'Content-Type': 'multipart/form-data',
            },
          }),
        config,
      )
    },

    blob(url: string, config?: HttpRequestConfig) {
      return runBlobRequest(
        () =>
          instance.get(url, {
            ...config,
            responseType: 'blob',
          }),
        config,
      )
    },
  }
}

export const rawHttp = axios.create({
  baseURL: networkConfig.apiBaseURL,
  timeout: 10000,
})

const http = createHttpClient(rawHttp)

export { http }
export default http
