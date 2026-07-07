import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ThreadDetailPage from '../src/pages/mail/ThreadDetailPage.vue'
import type { ThreadDetailVO } from '../src/api/type'
import { refreshMailStatisticsKey } from '../src/pages/mail/mail-statistics-context'

const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  generateReplySuggestion: vi.fn(),
  replyText: vi.fn(),
  reply: vi.fn(),
  retryAnalysis: vi.fn(),
  upload: vi.fn(),
  getSettings: vi.fn(),
}))

vi.mock('../src/api/thread', () => ({
  default: {
    detail: mocks.detail,
    replyText: mocks.replyText,
  },
}))

vi.mock('../src/api/email', () => ({
  default: {
    generateReplySuggestion: mocks.generateReplySuggestion,
    reply: mocks.reply,
  },
}))

vi.mock('../src/api/file', () => ({
  default: {
    upload: mocks.upload,
    download: vi.fn(),
  },
}))

vi.mock('../src/api/mail', () => ({
  default: {
    retryAnalysis: mocks.retryAnalysis,
  },
}))

vi.mock('../src/api/user', () => ({
  default: {
    getSettings: mocks.getSettings,
  },
}))

vi.mock('../src/components/mail/RichTextEditor.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <textarea
        data-test="composer-content"
        :value="modelValue?.[0]?.children?.[0]?.text || ''"
        @input="$emit('update:modelValue', [{ type: 'paragraph', children: [{ type: 'text', text: $event.target.value }] }])"
      />
    `,
  },
}))

const threadDetail: ThreadDetailVO = {
  threadId: 2001,
  subject: 'Lab report',
  total: 2,
  limit: 20,
  nextCursor: null,
  hasMore: false,
  analysis: {
    analysisStatus: 'SUCCESS',
    summary: '本线程主要提醒学生提交实验报告。',
    spamLevel: 'NONE',
    spamLevelLabel: '正常',
    spamReason: '未发现垃圾邮件特征。',
    riskLevel: 'SAFE',
    riskLabel: '安全',
    riskReason: '未发现异常链接或敏感风险。',
    priority: 'HIGH',
    priorityLabel: '高优先级',
    priorityReason: '涉及实验报告提交截止时间。',
    replySuggestions: ['收到，我会尽快查看实验报告。'],
  },
  mails: [
    {
      mailId: 1001,
      threadId: 2001,
      replyToMailId: null,
      subject: 'Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Please submit this week.' }],
        },
      ],
      sender: {
        username: 'teacher',
        nickname: 'Teacher',
        emailAddress: 'teacher@mail.test',
        avatarText: 'T',
      },
      recipient: {
        username: 'student',
        nickname: 'Student',
        emailAddress: 'student@mail.test',
        avatarText: 'S',
      },
      sentAt: '2026-05-25T16:04:00',
      analysisStatus: 'FAILED',
      priorityLabel: 'High',
      riskLabel: 'Risky',
      riskReason: 'Suspicious link detected',
    },
    {
      mailId: 1002,
      threadId: 2001,
      replyToMailId: 1001,
      subject: 'Re: Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'I have updated the template.' }],
        },
      ],
      sender: {
        username: 'student',
        nickname: 'Student',
        emailAddress: 'student@mail.test',
        avatarText: 'S',
      },
      recipient: {
        username: 'teacher',
        nickname: 'Teacher',
        emailAddress: 'teacher@mail.test',
        avatarText: 'T',
      },
      sentAt: '2026-05-25T16:20:00',
    },
  ],
}

async function mountThreadDetail(refreshMailStatistics = vi.fn()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/mail/thread/:threadId',
        component: ThreadDetailPage,
      },
    ],
  })

  await router.push('/mail/thread/2001')
  await router.isReady()

  const wrapper = mount(ThreadDetailPage, {
    global: {
      plugins: [ElementPlus, router],
      provide: {
        [refreshMailStatisticsKey as symbol]: refreshMailStatistics,
      },
    },
  })

  await flushPromises()

  return { refreshMailStatistics, wrapper }
}

describe('ThreadDetailPage', () => {
  beforeEach(() => {
    mocks.detail.mockReset()
    mocks.generateReplySuggestion.mockReset()
    mocks.replyText.mockReset()
    mocks.reply.mockReset()
    mocks.retryAnalysis.mockReset()
    mocks.upload.mockReset()
    mocks.getSettings.mockReset()
    mocks.detail.mockResolvedValue(threadDetail)
    mocks.getSettings.mockResolvedValue({
      aiEnabled: true,
      autoReplyEnabled: true,
      prioritySortEnabled: true,
      modelConfigured: false,
      provider: null,
      modelName: null,
      baseUrl: null,
      apiKeyConfigured: false,
      maskedApiKey: null,
      timeoutMs: 10000,
      maxTokens: 800,
      temperature: 0.2,
    })
    mocks.generateReplySuggestion.mockResolvedValue({
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: '建议回复：我会继续跟进。' }],
        },
      ],
    })
    mocks.replyText.mockResolvedValue({
      threadId: 2001,
      sourceMailId: 1002,
      replyText: '收到，我会尽快查看实验报告。',
    })
    mocks.reply.mockResolvedValue({ mailId: 1002, threadId: 2001 })
    mocks.retryAnalysis.mockResolvedValue({
      mailId: 1001,
      analysisStatus: 'PENDING',
    })
    mocks.upload.mockResolvedValue({ fileId: 'file_reply_1' })
  })

  it('loads thread detail by route threadId', async () => {
    const { wrapper } = await mountThreadDetail()

    expect(mocks.detail).toHaveBeenCalledWith('2001')
    expect(wrapper.text()).toContain('Lab report')
    expect(wrapper.text()).toContain('Please submit this week.')
  })

  it('refreshes mailbox statistics after opening thread detail', async () => {
    const { refreshMailStatistics } = await mountThreadDetail()

    expect(refreshMailStatistics).toHaveBeenCalledOnce()
  })
  it('renders thread-level AI analysis from thread detail data', async () => {
    const { wrapper } = await mountThreadDetail()

    const panel = wrapper.get('[data-test="thread-analysis-panel"]')

    expect(panel.text()).toContain('本线程主要提醒学生提交实验报告。')
    expect(panel.text()).toContain('高优先级')
    expect(panel.text()).toContain('安全')
    expect(panel.text()).toContain('正常')
    expect(panel.text()).toContain('收到，我会尽快查看实验报告。')
  })

  it('loads more mails by cursor and appends them to the timeline', async () => {
    const firstPage: ThreadDetailVO = {
      ...threadDetail,
      total: 2,
      limit: 20,
      nextCursor: 'cursor-2',
      hasMore: true,
      mails: [threadDetail.mails[0]],
    }
    const secondPage: ThreadDetailVO = {
      ...threadDetail,
      nextCursor: null,
      hasMore: false,
      mails: [
        {
          ...threadDetail.mails[0],
          mailId: 1002,
          replyToMailId: 1001,
          content: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Received and updated.' }],
            },
          ],
          sentAt: '2026-05-25T17:10:00',
        },
      ],
    }

    mocks.detail.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)

    const { wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="load-more-mails"]').trigger('click')
    await flushPromises()

    expect(mocks.detail).toHaveBeenLastCalledWith('2001', {
      cursor: 'cursor-2',
      limit: 20,
    })
    expect(wrapper.findAll('[data-test="thread-mail"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Please submit this week.')
    expect(wrapper.text()).toContain('Received and updated.')
    expect(wrapper.find('[data-test="load-more-mails"]').exists()).toBe(false)
  })

  it('sends a quick reply to the latest mail in the thread', async () => {
    const { refreshMailStatistics, wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="quick-reply-input"]').setValue('Received.')
    await wrapper.get('[data-test="quick-reply-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.reply).toHaveBeenCalledWith({
      mailId: 1002,
      threadId: 2001,
      subject: 'Re: Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Received.' }],
        },
      ],
    })
    expect(mocks.detail).toHaveBeenCalledTimes(2)
    expect(refreshMailStatistics).toHaveBeenCalledTimes(2)
  })

  it('opens a bottom reply drawer and sends a full reply with an attachment', async () => {
    const { wrapper } = await mountThreadDetail()
    const file = new File(['reply'], 'reply.pdf', { type: 'application/pdf' })

    await wrapper.get('[data-test="open-reply-drawer"]').trigger('click')

    expect(wrapper.get('[data-test="reply-drawer"]').isVisible()).toBe(true)

    await wrapper.get('[data-test="composer-content"]').setValue('Full reply.')

    const attachmentInput = wrapper.get('[data-test="attachment-input"]')
    Object.defineProperty(attachmentInput.element, 'files', {
      configurable: true,
      value: [file],
    })

    await attachmentInput.trigger('change')
    await flushPromises()

    expect(mocks.upload).toHaveBeenCalledWith(file)
    expect(wrapper.text()).toContain('reply.pdf')

    await wrapper.get('[data-test="composer-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.reply).toHaveBeenCalledWith({
      mailId: 1002,
      threadId: 2001,
      subject: 'Re: Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Full reply.' }],
        },
      ],
      attachmentFileId: 'file_reply_1',
    })
  })

  it('loads an AI reply suggestion from the thread reply-text endpoint and adopts it', async () => {
    const { wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="ai-reply-suggest"]').trigger('click')
    await flushPromises()

    expect(mocks.replyText).toHaveBeenCalledWith('2001')
    expect(wrapper.get('[data-test="ai-suggestion-card"]').text()).toContain(
      '收到，我会尽快查看实验报告。',
    )

    await wrapper.get('[data-test="ai-suggestion-adopt"]').trigger('click')

    expect(
      (wrapper.get('[data-test="quick-reply-input"]').element as HTMLTextAreaElement)
        .value,
    ).toBe('收到，我会尽快查看实验报告。')
  })

  it('blocks manual AI analysis when the current user has disabled mail analysis', async () => {
    mocks.getSettings.mockResolvedValueOnce({
      aiEnabled: false,
      autoReplyEnabled: true,
      prioritySortEnabled: true,
      modelConfigured: false,
      provider: null,
      modelName: null,
      baseUrl: null,
      apiKeyConfigured: false,
      maskedApiKey: null,
      timeoutMs: 10000,
      maxTokens: 800,
      temperature: 0.2,
    })
    const { wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="thread-ai-analysis-run"]').trigger('click')
    await flushPromises()

    expect(mocks.retryAnalysis).not.toHaveBeenCalled()
    expect(mocks.replyText).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('AI 分析功能已关闭，请在设置中开启后再重新分析。')
  })

  it('blocks AI reply suggestions when the current user has disabled auto reply', async () => {
    mocks.getSettings.mockResolvedValueOnce({
      aiEnabled: true,
      autoReplyEnabled: false,
      prioritySortEnabled: true,
      modelConfigured: false,
      provider: null,
      modelName: null,
      baseUrl: null,
      apiKeyConfigured: false,
      maskedApiKey: null,
      timeoutMs: 10000,
      maxTokens: 800,
      temperature: 0.2,
    })
    const { wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="ai-reply-suggest"]').trigger('click')
    await flushPromises()

    expect(mocks.replyText).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('AI 回复功能已关闭，请在设置中开启后使用。')
  })

  it('reanalyzes the latest loaded mail, refreshes detail, then loads reply text', async () => {
    const { refreshMailStatistics, wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="thread-ai-analysis-run"]').trigger('click')
    await flushPromises()

    expect(mocks.retryAnalysis).toHaveBeenCalledWith(1002)
    expect(refreshMailStatistics).toHaveBeenCalledTimes(2)
    expect(mocks.detail).toHaveBeenCalledTimes(2)
    expect(mocks.replyText).toHaveBeenCalledWith('2001')
    expect(wrapper.get('[data-test="ai-suggestion-card"]').text()).toContain(
      '收到，我会尽快查看实验报告。',
    )
  })

  it('reanalyzes all currently loaded mails when the analysis option is checked', async () => {
    const { refreshMailStatistics, wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="reanalyze-all-toggle"]').setValue(true)
    await wrapper.get('[data-test="thread-ai-analysis-run"]').trigger('click')
    await flushPromises()

    expect(mocks.retryAnalysis).toHaveBeenCalledTimes(2)
    expect(mocks.retryAnalysis).toHaveBeenNthCalledWith(1, 1001)
    expect(mocks.retryAnalysis).toHaveBeenNthCalledWith(2, 1002)
    expect(refreshMailStatistics).toHaveBeenCalledTimes(2)
    expect(mocks.detail).toHaveBeenCalledTimes(2)
  })

  it('retries failed mail analysis then refreshes thread detail and statistics', async () => {
    const { refreshMailStatistics, wrapper } = await mountThreadDetail()

    await wrapper.get('[data-test="retry-analysis"]').trigger('click')
    await flushPromises()

    expect(mocks.retryAnalysis).toHaveBeenCalledWith(1001)
    expect(mocks.detail).toHaveBeenCalledTimes(2)
    expect(refreshMailStatistics).toHaveBeenCalledTimes(2)
  })
})
