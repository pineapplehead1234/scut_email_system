import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'

import ThreadTimeline from '../src/components/mail/ThreadTimeline.vue'
import type { MailItemVO } from '../src/api/type'

const sender = {
  username: 'teacher',
  nickname: 'Teacher',
  emailAddress: 'teacher@mail.test',
  avatarText: 'T',
}

const recipient = {
  username: 'student',
  nickname: 'Student',
  emailAddress: 'student@mail.test',
  avatarText: 'S',
}

const mails: MailItemVO[] = [
  {
    mailId: 1002,
    threadId: 2001,
    replyToMailId: 1001,
    subject: 'Re: Lab report',
    content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Reply' }] }],
    sender: recipient,
    recipient: sender,
    sentAt: '2026-05-25T16:20:00',
  },
  {
    mailId: 1001,
    threadId: 2001,
    replyToMailId: null,
    subject: 'Lab report',
    content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Original' }] }],
    sender,
    recipient,
    sentAt: '2026-05-25T16:04:00',
    analysisStatus: 'FAILED',
    priorityLabel: 'High',
    riskLabel: 'Risky',
    riskReason: 'Suspicious link detected',
    attachment: {
      fileId: 'file_1',
      originalFilename: 'report.pdf',
      contentType: 'application/pdf',
      fileSize: 204800,
      downloadUrl: '/api/files/file_1/download',
    },
  },
]

describe('ThreadTimeline', () => {
  it('renders mails by sentAt ascending without per-mail reply actions', () => {
    const wrapper = mount(ThreadTimeline, {
      props: {
        mails,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    const rows = wrapper.findAll('[data-test="thread-mail"]')

    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Original')
    expect(rows[1].text()).toContain('Reply')

    expect(wrapper.find('[data-test="reply-mail"]').exists()).toBe(false)
  })

  it('renders mail analysis metadata and emits retry for failed analysis', async () => {
    const wrapper = mount(ThreadTimeline, {
      props: {
        mails,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    const firstMail = wrapper.findAll('[data-test="thread-mail"]')[0]

    expect(firstMail.text()).toContain('High')
    expect(firstMail.text()).toContain('Risky')
    expect(firstMail.text()).toContain('Suspicious link detected')
    expect(firstMail.text()).toContain('分析失败')
    expect(firstMail.text()).toContain('report.pdf')

    await firstMail.get('[data-test="retry-analysis"]').trigger('click')

    expect(wrapper.emitted('retry-analysis')?.[0]).toEqual([mails[1]])
  })
})
