import type { AxiosAdapter, AxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { rawHttp } from '../src/api/http'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
  },
}))

const requests: AxiosRequestConfig[] = []

function installAdapter(data: unknown): AxiosAdapter {
  requests.length = 0
  rawHttp.defaults.adapter = async (config) => {
    requests.push(config)

    return {
      config,
      data: {
        code: 0,
        message: 'success',
        data,
      },
      headers: { 'content-type': 'application/json' },
      status: 200,
      statusText: 'OK',
    }
  }

  return rawHttp.defaults.adapter
}

function lastRequest() {
  expect(requests).toHaveLength(1)

  return requests[0]
}

function readBody(data: unknown) {
  return typeof data === 'string' ? JSON.parse(data) : data
}

describe('mailApi', () => {
  beforeEach(() => {
    localStorage.clear()
    requests.length = 0
  })

  it('is exported from the API barrel', async () => {
    const api = await import('../src/api')

    expect(api.mailApi).toBeDefined()
  })

  it('loads folder lists through final /api/mails endpoints', async () => {
    const pageData = {
      page: 1,
      size: 10,
      total: 0,
      totalPages: 0,
      records: [],
    }
    installAdapter(pageData)
    const { default: mailApi } = await import('../src/api/mail')

    await expect(
      mailApi.list('SENT', {
        page: 2,
        size: 20,
        keyword: 'lab',
        recipientUsername: 'teacher',
      }),
    ).resolves.toEqual(pageData)

    expect(lastRequest()).toMatchObject({
      method: 'get',
      url: '/api/mails/sent',
      params: {
        page: 2,
        size: 20,
        keyword: 'lab',
        recipientUsername: 'teacher',
      },
    })
  })

  it('uses mailId for final mail state operations', async () => {
    const { default: mailApi } = await import('../src/api/mail')

    installAdapter({ mailId: 1001, read: true })
    await expect(mailApi.markRead(1001, { read: true })).resolves.toEqual({
      mailId: 1001,
      read: true,
    })
    expect(lastRequest()).toMatchObject({
      method: 'patch',
      url: '/api/mails/1001/read',
    })
    expect(readBody(lastRequest().data)).toEqual({ read: true })

    installAdapter({
      mailId: 1001,
      deleted: true,
      deletedAt: '2026-05-26T10:30:00',
    })
    await expect(mailApi.delete(1001)).resolves.toEqual({
      mailId: 1001,
      deleted: true,
      deletedAt: '2026-05-26T10:30:00',
    })
    expect(lastRequest()).toMatchObject({
      method: 'delete',
      url: '/api/mails/1001',
    })

    installAdapter({ mailId: 1001, deleted: false })
    await expect(mailApi.restore(1001)).resolves.toEqual({
      mailId: 1001,
      deleted: false,
    })
    expect(lastRequest()).toMatchObject({
      method: 'patch',
      url: '/api/mails/1001/restore',
    })

    installAdapter({ mailId: 1001, analysisStatus: 'PENDING' })
    await expect(mailApi.retryAnalysis(1001)).resolves.toEqual({
      mailId: 1001,
      analysisStatus: 'PENDING',
    })
    expect(lastRequest()).toMatchObject({
      method: 'post',
      url: '/api/mails/1001/analysis/retry',
    })
  })

  it('loads final mail statistics', async () => {
    const statisticsData = {
      inboxTotal: 4,
      inboxUnread: 2,
      sentTotal: 3,
      trashTotal: 1,
      spamTotal: 2,
    }
    installAdapter(statisticsData)
    const { default: mailApi } = await import('../src/api/mail')

    await expect(mailApi.statistics()).resolves.toEqual(statisticsData)

    expect(lastRequest()).toMatchObject({
      method: 'get',
      url: '/api/mails/statistics',
    })
  })
})
