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

const content = [
  {
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: 'hello',
      },
    ],
  },
] as const

describe('emailApi', () => {
  beforeEach(() => {
    localStorage.clear()
    requests.length = 0
  })

  it('is exported from the API barrel', async () => {
    const api = await import('../src/api')

    expect(api.emailApi).toBeDefined()
  })

  it('sends a new email through /api/emails/send', async () => {
    const responseData = { mailId: 1001, threadId: 2001 }
    const payload = {
      to: 'zhangsan',
      subject: 'Subject',
      content,
    }
    installAdapter(responseData)
    const { default: emailApi } = await import('../src/api/email')

    await expect(emailApi.send(payload)).resolves.toEqual(responseData)

    expect(lastRequest()).toMatchObject({
      method: 'post',
      url: '/api/emails/send',
    })
    expect(readBody(lastRequest().data)).toEqual(payload)
  })

  it('creates a reply with mailId, threadId, and optional attachmentFileId', async () => {
    const responseData = { mailId: 1002, threadId: 2001 }
    const payload = {
      mailId: 1001,
      threadId: 2001,
      subject: 'Re: Subject',
      content,
      attachmentFileId: 'file_reply_1',
    }
    installAdapter(responseData)
    const { default: emailApi } = await import('../src/api/email')

    await expect(emailApi.reply(payload)).resolves.toEqual(responseData)

    expect(lastRequest()).toMatchObject({
      method: 'post',
      url: '/api/emails/reply',
    })
    expect(readBody(lastRequest().data)).toEqual(payload)
    expect(readBody(lastRequest().data)).not.toHaveProperty('Sessionid')
  })

  it('generates a rich-text reply suggestion for a thread mail', async () => {
    const responseData = { content }
    const payload = {
      mailId: 1001,
      threadId: 2001,
    }
    installAdapter(responseData)
    const { default: emailApi } = await import('../src/api/email')

    await expect(emailApi.generateReplySuggestion(payload)).resolves.toEqual(
      responseData,
    )

    expect(lastRequest()).toMatchObject({
      method: 'post',
      url: '/api/emails/reply/suggestion',
    })
    expect(readBody(lastRequest().data)).toEqual(payload)
  })
})
