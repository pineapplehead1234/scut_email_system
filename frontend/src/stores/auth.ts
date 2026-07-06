import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import authApi from '../api/auth'
import type { CurrentUserVO, LoginRequest, LoginUser } from '../api/type'

export type CurrentUser = CurrentUserVO

const TOKEN_STORAGE_KEY = 'mail_token'
const USER_STORAGE_KEY = 'mail_user'

const emptyUser: CurrentUser = {
  username: '',
  nickname: '',
  emailAddress: '',
  avatarText: '',
}

function resolveAvatarText(user: LoginUser | CurrentUser) {
  const source = user.nickname || user.username

  return source.trim().slice(0, 1).toUpperCase()
}

function normalizeUser(user: LoginUser | CurrentUser): CurrentUser {
  return {
    username: user.username,
    nickname: user.nickname,
    emailAddress: user.emailAddress,
    avatarText: 'avatarText' in user ? user.avatarText : resolveAvatarText(user),
  }
}

function readStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return normalizeUser(JSON.parse(raw) as LoginUser | CurrentUser)
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)

    return null
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))
  const user = ref<CurrentUser>(readStoredUser() || emptyUser)

  const isLoggedIn = computed(() => Boolean(token.value))
  const displayName = computed(() => user.value.nickname || user.value.username)

  async function login(credentials: LoginRequest) {
    const data = await authApi.login(credentials)

    token.value = data.token
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)

    try {
      await fetchCurrentUser()
    } catch (error) {
      token.value = null
      user.value = emptyUser
      clearSession()
      throw error
    }

    return {
      ...data,
      user: user.value,
    }
  }

  async function fetchCurrentUser() {
    const currentUser = await authApi.getCurrentUser()

    user.value = normalizeUser(currentUser)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value))

    return user.value
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 本地会话必须清理，后端退出失败不阻塞用户退出。
    } finally {
      token.value = null
      user.value = emptyUser
      clearSession()
    }
  }

  function clearLocalSession() {
    token.value = null
    user.value = emptyUser
    clearSession()
  }

  return {
    token,
    user,
    isLoggedIn,
    displayName,
    login,
    fetchCurrentUser,
    logout,
    clearLocalSession,
  }
})
