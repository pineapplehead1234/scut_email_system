import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'

import ThreadMessageList from '../src/components/mail/ThreadMessageList.vue'
import type { ThreadListItemVO } from '../src/api/type'

const thread: ThreadListItemVO = {
  threadId: 2001,
  subject: '实验报告提交提醒',
  lastSnippet: '请在本周五之前提交实验报告。',
  lastMail: {
    mailId: 1002,
    threadId: 2001,
    replyToMailId: 1001,
    subject: 'Re: 实验报告提交提醒',
    sender: {
      username: 'teacher',
      nickname: '教师',
      emailAddress: 'teacher@mail.test',
      avatarText: '教',
    },
    recipient: {
      username: 'student',
      nickname: '学生',
      emailAddress: 'student@mail.test',
      avatarText: '学',
    },
    sentAt: '2026-05-25T16:20:00',
  },
  unreadCount: 1,
  mailCount: 2,
  updatedAt: '2026-05-25T16:20:00',
  priority: 'HIGH',
  priorityLabel: '高优先级',
  spam: false,
  spamLevel: 'NONE',
  riskLevel: 'SAFE',
  riskLabel: '安全',
  analysisStatus: 'SUCCESS',
  riskReason: null,
}

describe('ThreadMessageList', () => {
  it('renders thread records and emits threadId for navigation', async () => {
    const wrapper = mount(ThreadMessageList, {
      props: {
        threads: [thread],
        folder: 'INBOX',
        loading: false,
        resolveActions: () => [],
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('实验报告提交提醒')
    expect(wrapper.text()).toContain('请在本周五之前提交实验报告。')
    expect(wrapper.text()).toContain('2 封')
    expect(wrapper.get('[data-test="thread-row"]').attributes('data-thread-id')).toBe(
      '2001',
    )

    await wrapper.get('[data-test="thread-row"]').trigger('click')

    expect(wrapper.emitted('view-thread')).toEqual([[2001]])
  })

  it('renders only provided thread actions and emits a generic command', async () => {
    const failedThread = {
      ...thread,
      analysisStatus: 'FAILED' as const,
    }
    const wrapper = mount(ThreadMessageList, {
      props: {
        threads: [failedThread],
        folder: 'INBOX',
        loading: false,
        resolveActions: () => [{ type: 'delete' as const }],
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.find('[data-test="mark-read-thread"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="retry-analysis-thread"]').exists()).toBe(false)

    await wrapper.get('[data-test="delete-thread"]').trigger('click')

    expect(wrapper.emitted('thread-action')).toEqual([[{ type: 'delete' }, 2001]])
    expect(wrapper.emitted('view-thread')).toBeUndefined()
  })

  it('can render restore as a provided action', async () => {
    const wrapper = mount(ThreadMessageList, {
      props: {
        threads: [thread],
        folder: 'TRASH',
        loading: false,
        resolveActions: () => [{ type: 'restore' as const }],
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    await wrapper.get('[data-test="restore-thread"]').trigger('click')

    expect(wrapper.emitted('thread-action')).toEqual([[{ type: 'restore' }, 2001]])
  })
})
