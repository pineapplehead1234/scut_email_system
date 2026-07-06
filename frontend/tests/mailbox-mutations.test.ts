import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMailboxMutationService } from '../src/pages/mail/mailbox-mutations'

const mailGateway = {
  delete: vi.fn(),
  markRead: vi.fn(),
  restore: vi.fn(),
  retryAnalysis: vi.fn(),
}

const emailGateway = {
  reply: vi.fn(),
  send: vi.fn(),
}

const refreshMailStatistics = vi.fn()

describe('createMailboxMutationService', () => {
  beforeEach(() => {
    mailGateway.delete.mockReset()
    mailGateway.markRead.mockReset()
    mailGateway.restore.mockReset()
    mailGateway.retryAnalysis.mockReset()
    emailGateway.reply.mockReset()
    emailGateway.send.mockReset()
    refreshMailStatistics.mockReset()

    mailGateway.markRead.mockResolvedValue({ mailId: 1001, read: true })
    mailGateway.delete.mockResolvedValue({ mailId: 1001, deleted: true })
    mailGateway.restore.mockResolvedValue({ mailId: 1001, deleted: false })
    mailGateway.retryAnalysis.mockResolvedValue({
      mailId: 1001,
      analysisStatus: 'PENDING',
    })
    emailGateway.send.mockResolvedValue({ mailId: 1001, threadId: 2001 })
    emailGateway.reply.mockResolvedValue({ mailId: 1002, threadId: 2001 })
  })

  it('refreshes mail statistics after mail mutations', async () => {
    const service = createMailboxMutationService({
      emailGateway,
      mailGateway,
      refreshMailStatistics,
    })

    await service.markMailRead(1001)
    await service.deleteMail(1001)
    await service.restoreMail(1001)
    await service.retryMailAnalysis(1001)

    expect(mailGateway.markRead).toHaveBeenCalledWith(1001, { read: true })
    expect(mailGateway.delete).toHaveBeenCalledWith(1001)
    expect(mailGateway.restore).toHaveBeenCalledWith(1001)
    expect(mailGateway.retryAnalysis).toHaveBeenCalledWith(1001)
    expect(refreshMailStatistics).toHaveBeenCalledTimes(4)
  })

  it('refreshes mail statistics once after batch analysis retry', async () => {
    const service = createMailboxMutationService({
      emailGateway,
      mailGateway,
      refreshMailStatistics,
    })

    await service.retryMailAnalyses([1001, 1002])

    expect(mailGateway.retryAnalysis).toHaveBeenCalledTimes(2)
    expect(mailGateway.retryAnalysis).toHaveBeenNthCalledWith(1, 1001)
    expect(mailGateway.retryAnalysis).toHaveBeenNthCalledWith(2, 1002)
    expect(refreshMailStatistics).toHaveBeenCalledOnce()
  })

  it('refreshes thread statistics after send and reply mutations', async () => {
    const service = createMailboxMutationService({
      emailGateway,
      mailGateway,
      refreshMailStatistics,
    })

    await service.sendEmail({
      to: 'teacher',
      subject: 'Lab report',
      content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Body' }] }],
    })
    await service.replyEmail({
      mailId: 1001,
      threadId: 2001,
      subject: 'Re: Lab report',
      content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Reply' }] }],
    })

    expect(emailGateway.send).toHaveBeenCalledOnce()
    expect(emailGateway.reply).toHaveBeenCalledOnce()
    expect(refreshMailStatistics).toHaveBeenCalledTimes(2)
  })
})
