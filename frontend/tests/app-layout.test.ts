import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import AppLayout from '../src/layouts/AppLayout.vue'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  statistics: vi.fn(),
}))

vi.mock('../src/api/auth', () => ({
  default: {
    getCurrentUser: mocks.getCurrentUser,
    login: vi.fn(),
    logout: mocks.logout,
    register: vi.fn(),
  },
}))

vi.mock('../src/api/mail', () => ({
  default: {
    statistics: mocks.statistics,
  },
}))

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        component: { template: '<div />' },
        meta: { public: true },
      },
      {
        path: '/mail/inbox',
        component: { template: '<div />' },
        meta: { title: 'Inbox' },
      },
    ],
  })

  router.beforeEach((to) => {
    const loggedIn = Boolean(localStorage.getItem('mail_token'))

    if (to.path === '/login' && loggedIn) {
      return '/mail/inbox'
    }

    return true
  })

  return router
}

async function mountAppLayout(options: { router?: Router; withStoredUser?: boolean } = {}) {
  localStorage.setItem('mail_token', 'token-123')
  if (options.withStoredUser !== false) {
    localStorage.setItem(
      'mail_user',
      JSON.stringify({
        username: 'student',
        nickname: 'Student',
        emailAddress: 'student@mail.test',
        avatarText: 'S',
      }),
    )
  }

  const pinia = createPinia()
  setActivePinia(pinia)

  const router = options.router || createTestRouter()

  await router.push('/mail/inbox')
  await router.isReady()

  const wrapper = mount(AppLayout, {
    attachTo: document.body,
    global: {
      plugins: [ElementPlus, pinia, router],
    },
  })

  await flushPromises()

  return wrapper
}

describe('AppLayout', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    mocks.getCurrentUser.mockReset()
    mocks.logout.mockReset()
    mocks.statistics.mockReset()
    mocks.getCurrentUser.mockResolvedValue({
      username: 'student',
      nickname: '学生',
      emailAddress: 'student@mail.test',
      avatarText: '学',
    })
    mocks.statistics.mockResolvedValue({
      inboxTotal: 21,
      inboxUnread: 3,
      sentTotal: 8,
      trashTotal: 5,
      spamTotal: 2,
    })
    mocks.logout.mockResolvedValue(undefined)
  })

  it('loads mail statistics for sidebar folder counts', async () => {
    const wrapper = await mountAppLayout()

    expect(mocks.statistics).toHaveBeenCalledOnce()
    expect(wrapper.get('[data-test="folder-count-inbox"]').text()).toBe('21')
    expect(wrapper.get('[data-test="folder-unread-inbox"]').text()).toBe('3')
    expect(wrapper.get('[data-test="folder-count-sent"]').text()).toBe('8')
    expect(wrapper.get('[data-test="folder-count-trash"]').text()).toBe('5')
    expect(wrapper.get('[data-test="folder-count-spam"]').text()).toBe('2')
  })

  it('does not render unused global search or refresh actions in the header', async () => {
    const wrapper = await mountAppLayout()

    expect(wrapper.get('header').findAll('.el-button')).toHaveLength(0)
    expect(mocks.statistics).toHaveBeenCalledOnce()
  })

  it('fetches current user when token exists but local user is missing', async () => {
    const wrapper = await mountAppLayout({ withStoredUser: false })

    expect(mocks.getCurrentUser).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('学生')
    expect(wrapper.text()).toContain('student')
  })

  it('waits for logout cleanup before navigating to login', async () => {
    let finishLogout!: () => void
    mocks.logout.mockReturnValue(new Promise<void>((resolve) => {
      finishLogout = resolve
    }))
    const router = createTestRouter()
    const wrapper = await mountAppLayout({ router })
    await wrapper.get('[aria-haspopup="menu"]').trigger('click')
    await flushPromises()

    const logoutButton = document.body.querySelector('[data-test="logout-button"]') as HTMLElement
    expect(logoutButton).toBeTruthy()
    logoutButton.click()
    await flushPromises()

    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/mail/inbox')

    finishLogout()
    await flushPromises()
    await new Promise((resolve) => window.setTimeout(resolve))
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
  })
})
