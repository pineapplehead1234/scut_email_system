import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type CurrentUser = {
  username: string
  nickname: string
  emailAddress: string
  avatarText: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('mail_token'))
  const user = ref<CurrentUser>({
    username: 'admin',
    nickname: '管理员',
    emailAddress: 'admin@mail.com',
    avatarText: '管',
  })

  const isLoggedIn = computed(() => Boolean(token.value))
  const displayName = computed(() => user.value.nickname || user.value.username)

  function logout() {
    token.value = null
    localStorage.removeItem('mail_token')
  }

  return {
    token,
    user,
    isLoggedIn,
    displayName,
    logout,
  }
})
