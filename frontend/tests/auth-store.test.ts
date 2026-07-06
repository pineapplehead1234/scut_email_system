import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../src/stores/auth'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('../src/api/auth', () => ({
  default: {
    login: mocks.login,
    logout: mocks.logout,
    getCurrentUser: mocks.getCurrentUser,
  },
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mocks.login.mockReset()
    mocks.logout.mockReset()
    mocks.getCurrentUser.mockReset()
  })

  it('logs in then fetches and persists the current user profile', async () => {
    mocks.login.mockResolvedValue({
      token: 'token-123',
      user: {
        username: 'admin',
        nickname: '登录返回昵称',
        emailAddress: 'login@mail.com',
      },
    })
    mocks.getCurrentUser.mockResolvedValue({
      username: 'admin',
      nickname: '管理员',
      emailAddress: 'admin@mail.com',
      avatarText: '管',
    })

    const store = useAuthStore()

    await store.login({
      username: 'admin',
      password: '123456',
    })

    expect(store.token).toBe('token-123')
    expect(mocks.getCurrentUser).toHaveBeenCalledOnce()
    expect(store.user).toEqual({
      username: 'admin',
      nickname: '管理员',
      emailAddress: 'admin@mail.com',
      avatarText: '管',
    })
    expect(localStorage.getItem('mail_token')).toBe('token-123')
    expect(JSON.parse(localStorage.getItem('mail_user') || '{}')).toEqual(store.user)
  })

  it('removes corrupted stored user data and keeps safe defaults', () => {
    localStorage.setItem('mail_token', 'token-123')
    localStorage.setItem('mail_user', '{bad-json')

    const store = useAuthStore()

    expect(store.token).toBe('token-123')
    expect(store.user).toEqual({
      username: '',
      nickname: '',
      emailAddress: '',
      avatarText: '',
    })
    expect(localStorage.getItem('mail_user')).toBeNull()
  })

  it('clears local session even when remote logout fails', async () => {
    localStorage.setItem('mail_token', 'token-123')
    localStorage.setItem(
      'mail_user',
      JSON.stringify({
        username: 'admin',
        nickname: '管理员',
        emailAddress: 'admin@mail.com',
        avatarText: '管',
      }),
    )
    mocks.logout.mockRejectedValue(new Error('network failed'))

    const store = useAuthStore()

    await store.logout()

    expect(store.token).toBeNull()
    expect(store.user.username).toBe('')
    expect(localStorage.getItem('mail_token')).toBeNull()
    expect(localStorage.getItem('mail_user')).toBeNull()
  })
})
