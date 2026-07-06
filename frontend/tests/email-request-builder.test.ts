import { describe, expect, it } from 'vitest'

import {
  buildReplyEmailRequest,
  buildSendEmailRequest,
} from '../src/pages/mail/email-request-builder'
import type { MailItemVO, RichTextNode } from '../src/api/type'

const richContent: RichTextNode[] = [
  {
    type: 'paragraph',
    children: [
      { type: 'text', text: 'Please review ', bold: true },
      {
        type: 'link',
        href: 'https://example.test/report',
        children: [{ type: 'text', text: 'report', underline: true }],
      },
    ],
  },
]

const replyTarget: MailItemVO = {
  mailId: 1001,
  threadId: 2001,
  replyToMailId: null,
  subject: 'Lab report',
  content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Original' }] }],
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
}

describe('email-request-builder', () => {
  it('trims send fields and keeps editor rich text content unchanged', () => {
    expect(
      buildSendEmailRequest({
        recipientUsername: ' teacher ',
        subject: ' Lab report ',
        content: richContent,
        attachmentFileId: 'file_1',
      }),
    ).toEqual({
      to: 'teacher',
      subject: 'Lab report',
      content: richContent,
      attachmentFileId: 'file_1',
    })
  })

  it('builds reply payload from the selected mail and preserves existing Re subject', () => {
    expect(
      buildReplyEmailRequest({
        threadSubject: 'Re: Lab report',
        replyTarget,
        content: richContent,
        attachmentFileId: 'file_reply_1',
      }),
    ).toEqual({
      mailId: 1001,
      threadId: 2001,
      subject: 'Re: Lab report',
      content: richContent,
      attachmentFileId: 'file_reply_1',
    })
  })
})
