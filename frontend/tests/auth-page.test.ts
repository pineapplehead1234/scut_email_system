import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import AuthPage from '../src/pages/auth/AuthPage.vue'
import { createAppRouter } from '../src/router'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}))

vi.mock('../src/api/auth', () => ({
  default: {
    login: mocks.login,
    register: mocks.register,
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

describe('AuthPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    mocks.login.mockReset()
    mocks.register.mockReset()
  })

  it('submits credentials through auth store and navigates to redirect target', async () => {
    mocks.login.mockResolvedValue({
      token: 'token-123',
      user: {
        username: 'admin',
        nickname: '管理员',
        emailAddress: 'admin@mail.com',
      },
    })

    const router = createAppRouter(createMemoryHistory())
    await router.push('/login?redirect=/settings')
    await router.isReady()

    const wrapper = mount(AuthPage, {
      global: {
        plugins: [ElementPlus, router],
      },
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('123456')
    await wrapper.get('button[type="submit"]').trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve))

    expect(mocks.login).toHaveBeenCalledWith({
      username: 'admin',
      password: '123456',
    })
    expect(router.currentRoute.value.path).toBe('/settings')
  })

  it('registers an account then returns to login with username filled', async () => {
    mocks.register.mockResolvedValue({
      username: 'lisi',
      nickname: '李四',
    })

    const router = createAppRouter(createMemoryHistory())
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(AuthPage, {
      global: {
        plugins: [ElementPlus, router],
      },
    })

    await wrapper.get('[data-test="auth-mode-register"]').trigger('click')

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('lisi')
    await inputs[1].setValue('李四')
    await inputs[2].setValue('12345678')
    await inputs[3].setValue('12345678')
    await wrapper.get('[data-test="register-submit"]').trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve))

    expect(mocks.register).toHaveBeenCalledWith({
      username: 'lisi',
      nickname: '李四',
      password: '12345678',
    })
    expect(wrapper.find('[data-test="register-submit"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="login-submit"]').exists()).toBe(true)
    expect((wrapper.findAll('input')[0].element as HTMLInputElement).value).toBe('lisi')
  })
})
