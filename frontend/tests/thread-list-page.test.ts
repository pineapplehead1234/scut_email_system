import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ThreadListPage from '../src/pages/mail/ThreadListPage.vue'
import type { ThreadPageData } from '../src/api/type'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  deleteMail: vi.fn(),
}))

vi.mock('../src/api/thread', () => ({
  default: {
    list: mocks.list,
  },
}))

vi.mock('../src/api/mail', () => ({
  default: {
    delete: mocks.deleteMail,
  },
}))

const pageData: ThreadPageData = {
  page: 2,
  size: 20,
  total: 1,
  totalPages: 1,
  records: [
    {
      threadId: 2001,
      subject: 'Lab report reminder',
      lastSnippet: 'Please submit this week.',
      lastMail: {
        mailId: 1002,
        sender: {
          username: 'teacher',
          nickname: 'Teacher',
          emailAddress: 'teacher@mail.test',
          avatarText: 'T',
        },
      },
      unreadCount: 1,
      mailCount: 2,
      updatedAt: '2026-05-25T16:20:00',
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

async function mountThreadList(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/mail/inbox',
        component: ThreadListPage,
        meta: {
          title: 'Inbox',
          folder: 'INBOX',
        },
      },
      {
        path: '/mail/thread/:threadId',
        component: { template: '<div />' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  const wrapper = mount(ThreadListPage, {
    global: {
      plugins: [ElementPlus, router],
    },
  })

  await flushPromises()

  return { router, wrapper }
}

describe('ThreadListPage', () => {
  beforeEach(() => {
    mocks.list.mockReset()
    mocks.deleteMail.mockReset()
    mocks.list.mockResolvedValue(pageData)
    mocks.deleteMail.mockResolvedValue({
      mailId: 1002,
      deleted: true,
      deletedAt: '2026-05-26T10:00:00',
    })
  })

  it('loads inbox threads through threadApi.list without a folder parameter', async () => {
    await mountThreadList('/mail/inbox?page=2&size=20&keyword=lab&readStatus=UNREAD')

    expect(mocks.list).toHaveBeenCalledWith({
      page: 2,
      size: 20,
      keyword: 'lab',
      readStatus: 'UNREAD',
    })
  })

  it('does not render the summary text block below filters', async () => {
    const { wrapper } = await mountThreadList('/mail/inbox')

    expect(wrapper.text()).not.toContain('Inbox')
  })

  it('keeps pagination fixed at the bottom right of the viewport', async () => {
    mocks.list.mockResolvedValue({
      ...pageData,
      total: 60,
      totalPages: 3,
    })

    const { wrapper } = await mountThreadList('/mail/inbox?page=2')
    const pagination = wrapper.get('[data-test="pagination-bar"]')

    expect(pagination.classes()).toContain('fixed')
    expect(pagination.classes()).toContain('bottom-6')
    expect(pagination.classes()).toContain('right-6')
  })

  it('changes page through the route query and reloads threads', async () => {
    mocks.list.mockResolvedValue({
      ...pageData,
      total: 60,
      totalPages: 3,
    })

    const { router, wrapper } = await mountThreadList('/mail/inbox?page=2&size=20')

    await wrapper.get('[data-test="next-page"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.page).toBe('3')
    expect(mocks.list).toHaveBeenLastCalledWith({
      page: 3,
      size: 20,
    })
  })

  it('submits final thread filters through route query params', async () => {
    const { router, wrapper } = await mountThreadList('/mail/inbox?page=3')

    await wrapper.get('[data-test="thread-filter-keyword"]').setValue('lab')
    await wrapper.get('[data-test="thread-filter-sender"]').setValue('teacher')
    await wrapper.get('[data-test="thread-filter-priority"]').setValue('HIGH')
    await wrapper.get('[data-test="thread-filter-search"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toMatchObject({
      page: '1',
      keyword: 'lab',
      senderUsername: 'teacher',
      priority: 'HIGH',
    })
    expect(mocks.list).toHaveBeenLastCalledWith({
      page: 1,
      keyword: 'lab',
      senderUsername: 'teacher',
      priority: 'HIGH',
    })
  })

  it('renders threads and navigates with threadId', async () => {
    const { router, wrapper } = await mountThreadList('/mail/inbox')

    expect(wrapper.text()).toContain('Lab report reminder')

    await wrapper.get('[data-test="thread-row"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/mail/thread/2001')
  })

  it('deletes the latest inbox mail from a thread row', async () => {
    const { wrapper } = await mountThreadList('/mail/inbox')

    expect(wrapper.find('[data-test="mark-read-thread"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="restore-thread"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="retry-analysis-thread"]').exists()).toBe(false)

    await wrapper.get('[data-test="delete-thread"]').trigger('click')
    await flushPromises()

    expect(mocks.deleteMail).toHaveBeenCalledWith(1002)
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })
})
