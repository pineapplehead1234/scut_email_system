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

describe('threadApi', () => {
  beforeEach(() => {
    localStorage.clear()
    requests.length = 0
  })

  it('is exported from the API barrel', async () => {
    const api = await import('../src/api')

    expect(api.threadApi).toBeDefined()
    expect(api.mailApi).toBeDefined()
  })

  it('lists inbox threads through the final thread endpoint', async () => {
    const pageData = {
      page: 2,
      size: 20,
      total: 0,
      totalPages: 0,
      records: [],
    }
    installAdapter(pageData)
    const { default: threadApi } = await import('../src/api/thread')

    await expect(
      threadApi.list({
        page: 2,
        size: 20,
        keyword: 'lab',
        readStatus: 'UNREAD',
      }),
    ).resolves.toEqual(pageData)

    expect(lastRequest()).toMatchObject({
      method: 'get',
      url: '/api/threads',
      params: {
        page: 2,
        size: 20,
        keyword: 'lab',
        readStatus: 'UNREAD',
      },
    })
  })

  it('loads a thread detail with cursor pagination', async () => {
    const detailData = {
      threadId: 2001,
      subject: 'Subject',
      total: 0,
      limit: 20,
      nextCursor: null,
      hasMore: false,
      analysis: {
        analysisStatus: 'SUCCESS',
        summary: 'Thread summary',
        spamLevel: 'NONE',
        spamLevelLabel: '正常',
        spamReason: 'No spam signal',
        riskLevel: 'SAFE',
        riskLabel: '安全',
        riskReason: 'No risk signal',
        priority: 'MEDIUM',
        priorityLabel: '普通',
        priorityReason: 'Routine thread',
        replySuggestions: ['收到，我会尽快处理。'],
      },
      mails: [],
    }
    installAdapter(detailData)
    const { default: threadApi } = await import('../src/api/thread')

    await expect(
      threadApi.detail(2001, {
        cursor: '2026-05-25T16:20:00',
        limit: 20,
      }),
    ).resolves.toEqual(detailData)

    expect(lastRequest()).toMatchObject({
      method: 'get',
      url: '/api/threads/2001',
      params: {
        cursor: '2026-05-25T16:20:00',
        limit: 20,
      },
    })
  })

  it('loads default reply text from the latest mail in a thread', async () => {
    const replyTextData = {
      threadId: 2001,
      sourceMailId: 1002,
      replyText: '收到，我会尽快处理。',
    }
    installAdapter(replyTextData)
    const { default: threadApi } = await import('../src/api/thread')

    await expect(threadApi.replyText(2001)).resolves.toEqual(replyTextData)

    expect(lastRequest()).toMatchObject({
      method: 'get',
      url: '/api/threads/2001/reply-text',
    })
  })

  it('does not expose state actions that are absent from the final thread contract', async () => {
    const { default: threadApi } = await import('../src/api/thread')

    expect(threadApi).not.toHaveProperty('markRead')
    expect(threadApi).not.toHaveProperty('delete')
    expect(threadApi).not.toHaveProperty('restore')
    expect(threadApi).not.toHaveProperty('retryAnalysis')
    expect(threadApi).not.toHaveProperty('statistics')
  })
})
