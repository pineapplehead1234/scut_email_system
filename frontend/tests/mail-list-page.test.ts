import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import MailListPage from '../src/pages/mail/MailListPage.vue'
import type { MailPageData } from '../src/api/type'
import { refreshMailStatisticsKey } from '../src/pages/mail/mail-statistics-context'

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  list: vi.fn(),
  markRead: vi.fn(),
  restore: vi.fn(),
  retryAnalysis: vi.fn(),
}))

vi.mock('../src/api/mail', () => ({
  default: {
    delete: mocks.delete,
    list: mocks.list,
    markRead: mocks.markRead,
    restore: mocks.restore,
    retryAnalysis: mocks.retryAnalysis,
  },
}))

const pageData: MailPageData = {
  page: 2,
  size: 20,
  total: 1,
  totalPages: 1,
  records: [
    {
      mailId: 1001,
      threadId: 2001,
      replyToMailId: null,
      subject: 'Lab report',
      snippet: 'Please submit this week.',
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
      sentAt: '2026-05-25T16:20:00',
      read: false,
      priority: 'HIGH',
      priorityLabel: 'High',
      spam: false,
      spamLevel: 'NONE',
      riskLevel: 'SAFE',
      riskLabel: 'Safe',
      analysisStatus: 'FAILED',
      riskReason: null,
    },
  ],
}

async function mountMailList(
  initialPath: string,
  folder: string,
  refreshMailStatistics = vi.fn(),
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/mail/sent',
        component: MailListPage,
        meta: { title: 'Sent', folder },
      },
      {
        path: '/mail/trash',
        component: MailListPage,
        meta: { title: 'Trash', folder },
      },
      {
        path: '/mail/spam',
        component: MailListPage,
        meta: { title: 'Spam', folder },
      },
      {
        path: '/mail/thread/:threadId',
        component: { template: '<div />' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  const wrapper = mount(MailListPage, {
    global: {
      plugins: [ElementPlus, router],
      provide: {
        [refreshMailStatisticsKey as symbol]: refreshMailStatistics,
      },
    },
  })

  await flushPromises()

  return { refreshMailStatistics, router, wrapper }
}

describe('MailListPage', () => {
  beforeEach(() => {
    mocks.delete.mockReset()
    mocks.list.mockReset()
    mocks.markRead.mockReset()
    mocks.restore.mockReset()
    mocks.retryAnalysis.mockReset()
    mocks.delete.mockResolvedValue({ mailId: 1001, deleted: true })
    mocks.list.mockResolvedValue(pageData)
    mocks.markRead.mockResolvedValue({ mailId: 1001, read: true })
    mocks.restore.mockResolvedValue({ mailId: 1001, deleted: false })
    mocks.retryAnalysis.mockResolvedValue({
      mailId: 1001,
      analysisStatus: 'PENDING',
    })
  })

  it('loads a final mail folder endpoint with query params', async () => {
    await mountMailList(
      '/mail/sent?page=2&size=20&keyword=lab&recipientUsername=teacher',
      'SENT',
    )

    expect(mocks.list).toHaveBeenCalledWith('SENT', {
      page: 2,
      size: 20,
      keyword: 'lab',
      recipientUsername: 'teacher',
    })
  })

  it('does not render the summary text block below filters', async () => {
    const { wrapper } = await mountMailList('/mail/sent', 'SENT')

    expect(wrapper.text()).not.toContain('Sent')
  })

  it('keeps pagination fixed at the bottom right of the viewport', async () => {
    mocks.list.mockResolvedValue({
      ...pageData,
      total: 60,
      totalPages: 3,
    })

    const { wrapper } = await mountMailList('/mail/sent?page=2', 'SENT')
    const pagination = wrapper.get('[data-test="pagination-bar"]')

    expect(pagination.classes()).toContain('fixed')
    expect(pagination.classes()).toContain('bottom-6')
    expect(pagination.classes()).toContain('right-6')
  })

  it('changes page through the route query and reloads the list', async () => {
    mocks.list.mockResolvedValue({
      ...pageData,
      total: 60,
      totalPages: 3,
    })

    const { router, wrapper } = await mountMailList(
      '/mail/sent?page=2&size=20',
      'SENT',
    )

    await wrapper.get('[data-test="next-page"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.page).toBe('3')
    expect(mocks.list).toHaveBeenLastCalledWith('SENT', {
      page: 3,
      size: 20,
    })
  })

  it('submits folder-specific filters through final mail list query params', async () => {
    const { router, wrapper } = await mountMailList('/mail/spam?page=3', 'SPAM')

    await wrapper.get('[data-test="mail-filter-keyword"]').setValue('phishing')
    await wrapper.get('[data-test="mail-filter-spam-level"]').setValue('HIGH')
    await wrapper.get('[data-test="mail-filter-risk-level"]').setValue('HIGH')
    await wrapper.get('[data-test="mail-filter-search"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toMatchObject({
      page: '1',
      keyword: 'phishing',
      spamLevel: 'HIGH',
      riskLevel: 'HIGH',
    })
    expect(mocks.list).toHaveBeenLastCalledWith('SPAM', {
      page: 1,
      keyword: 'phishing',
      spamLevel: 'HIGH',
      riskLevel: 'HIGH',
    })
  })

  it('renders mails and navigates to the owning thread', async () => {
    const { router, wrapper } = await mountMailList('/mail/sent', 'SENT')

    expect(wrapper.text()).toContain('Lab report')

    await wrapper.get('[data-test="mail-row"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/mail/thread/2001')
  })

  it('runs mail-level operations with mailId and refreshes statistics', async () => {
    const { refreshMailStatistics, wrapper } = await mountMailList(
      '/mail/trash',
      'TRASH',
    )

    await wrapper.get('[data-test="restore-mail"]').trigger('click')
    await flushPromises()

    expect(mocks.restore).toHaveBeenCalledWith(1001)
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(refreshMailStatistics).toHaveBeenCalledOnce()
  })
})
