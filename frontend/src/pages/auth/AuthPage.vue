<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Lock, Message, User } from '@element-plus/icons-vue'
import { computed, nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import authApi from '../../api/auth'
import { useAuthStore } from '../../stores/auth'

type AuthMode = 'login' | 'register'

type LoginForm = {
  username: string
  password: string
}

type RegisterForm = {
  username: string
  nickname: string
  password: string
  confirmPassword: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const mode = ref<AuthMode>('login')
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const submitting = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
})

const registerForm = reactive<RegisterForm>({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

const loginRules: FormRules<LoginForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerRules: FormRules<RegisterForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
          return
        }

        callback()
      },
      trigger: 'blur',
    },
  ],
}

const headingText = computed(() =>
  mode.value === 'login' ? '登录 Mail System' : '注册 Mail System',
)
const descriptionText = computed(() =>
  mode.value === 'login' ? '使用站内账号进入邮件工作台。' : '创建站内账号后即可登录使用。',
)

function resolveRedirect() {
  const redirect = route.query.redirect

  return typeof redirect === 'string' && redirect.startsWith('/')
    ? redirect
    : '/mail/inbox'
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode

  void nextTick(() => {
    loginFormRef.value?.clearValidate()
    registerFormRef.value?.clearValidate()
  })
}

async function submitLogin() {
  if (submitting.value) {
    return
  }

  submitting.value = true

  try {
    const valid = await loginFormRef.value?.validate().catch(() => false)

    if (!valid) {
      return
    }

    await authStore.login({
      username: loginForm.username.trim(),
      password: loginForm.password,
    })
    await router.push(resolveRedirect())
  } finally {
    submitting.value = false
  }
}

async function submitRegister() {
  if (submitting.value) {
    return
  }

  submitting.value = true

  try {
    const valid = await registerFormRef.value?.validate().catch(() => false)

    if (!valid) {
      return
    }

    const username = registerForm.username.trim()
    const nickname = registerForm.nickname.trim()

    await authApi.register({
      username,
      password: registerForm.password,
      ...(nickname ? { nickname } : {}),
    })

    loginForm.username = username
    loginForm.password = ''
    ElMessage.success('注册成功，请登录')
    switchMode('login')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#eef3f8] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div
      class="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px]"
    >
      <section class="hidden max-w-xl lg:block" aria-label="Mail System">
        <div class="flex items-center gap-3">
          <div
            class="flex size-12 items-center justify-center rounded-lg bg-[#185c68] text-white shadow-sm"
          >
            <el-icon :size="22">
              <Message />
            </el-icon>
          </div>
          <div>
            <div class="text-base font-semibold text-slate-950">SCUT Mail System</div>
            <div class="mt-1 text-sm text-slate-500">统一身份入口</div>
          </div>
        </div>

        <div class="mt-12 space-y-5">
          <p class="text-sm font-medium text-[#185c68]">站内邮件工作台</p>
          <h2 class="max-w-lg text-4xl font-semibold leading-tight text-slate-950">
            安静、清晰地处理邮件认证与会话访问。
          </h2>
          <p class="max-w-md text-base leading-7 text-slate-600">
            登录后进入收件箱、已发送、附件和账号设置。注册后回到登录入口，流程保持可控。
          </p>
        </div>

        <div class="mt-12 flex items-center gap-4 border-t border-slate-300 pt-5">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#185c68] shadow-sm"
          >
            <el-icon :size="18">
              <Lock />
            </el-icon>
          </div>
          <div>
            <div class="text-sm font-medium text-slate-900">受保护的 Bearer Token 会话</div>
            <div class="mt-1 text-sm text-slate-500">登录失效时自动回到认证入口。</div>
          </div>
        </div>
      </section>

      <section
        class="auth-panel relative w-full overflow-hidden rounded-lg border border-slate-200 bg-[#fbfcff]"
      >
        <div class="h-1 bg-[#185c68]" />
        <div class="px-5 py-6 sm:px-7 sm:py-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div
                class="flex size-11 items-center justify-center rounded-lg bg-[#185c68] text-sm font-semibold text-white lg:hidden"
              >
                MS
              </div>
              <h1 class="mt-4 text-2xl font-semibold text-slate-950 lg:mt-0">
                {{ headingText }}
              </h1>
              <p class="mt-2 text-sm leading-6 text-slate-500">{{ descriptionText }}</p>
            </div>
            <div
              class="hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:block"
            >
              /api
            </div>
          </div>

          <div
            class="mt-7 grid h-11 grid-cols-2 rounded-lg bg-slate-100 p-1"
            role="tablist"
          >
            <button
              type="button"
              class="auth-mode-button rounded-md text-sm font-medium"
              :class="mode === 'login' ? 'is-active' : ''"
              :aria-selected="mode === 'login'"
              data-test="auth-mode-login"
              role="tab"
              @click="switchMode('login')"
            >
              登录
            </button>
            <button
              type="button"
              class="auth-mode-button rounded-md text-sm font-medium"
              :class="mode === 'register' ? 'is-active' : ''"
              :aria-selected="mode === 'register'"
              data-test="auth-mode-register"
              role="tab"
              @click="switchMode('register')"
            >
              注册
            </button>
          </div>

          <Transition name="auth-form" mode="out-in">
            <el-form
              v-if="mode === 'login'"
              ref="loginFormRef"
              key="login-form"
              :model="loginForm"
              :rules="loginRules"
              class="auth-form mt-8 space-y-5"
              label-position="top"
              @submit.prevent="submitLogin"
            >
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="loginForm.password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                  autocomplete="current-password"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-button
                class="auth-submit w-full"
                type="primary"
                native-type="submit"
                :loading="submitting"
                data-test="login-submit"
                @click="submitLogin"
              >
                登录
              </el-button>
            </el-form>

            <el-form
              v-else
              ref="registerFormRef"
              key="register-form"
              :model="registerForm"
              :rules="registerRules"
              class="auth-form auth-register-form mt-8 space-y-6"
              data-test="register-form"
              label-position="top"
              @submit.prevent="submitRegister"
            >
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="registerForm.username"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="registerForm.nickname"
                  placeholder="不填则默认使用用户名"
                  autocomplete="nickname"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="registerForm.password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  placeholder="请再次输入密码"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-button
                class="auth-submit w-full"
                type="primary"
                native-type="submit"
                :loading="submitting"
                data-test="register-submit"
                @click="submitRegister"
              >
                注册
              </el-button>
            </el-form>
          </Transition>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-panel {
  box-shadow: 0 24px 70px rgb(15 23 42 / 10%);
}

.auth-mode-button {
  color: #64748b;
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.auth-mode-button:hover {
  color: #0f172a;
}

.auth-mode-button:focus-visible {
  outline: 2px solid rgb(24 92 104 / 45%);
  outline-offset: 2px;
}

.auth-mode-button.is-active {
  background: #ffffff;
  color: #124b55;
  box-shadow: 0 1px 4px rgb(15 23 42 / 12%);
}

.auth-mode-button:active {
  transform: translateY(1px);
}

:deep(.auth-form .el-form-item) {
  margin-bottom: 0;
}

:deep(.auth-form .el-form-item__label) {
  padding-bottom: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
}

:deep(.auth-form .el-input__wrapper) {
  min-height: 44px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #d6e0ea inset;
  transition:
    box-shadow 180ms ease,
    background-color 180ms ease;
}

:deep(.auth-form .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #9fb7c1 inset;
}

:deep(.auth-form .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #185c68 inset,
    0 0 0 3px rgb(24 92 104 / 14%);
}

:deep(.auth-form .el-input__inner) {
  color: #0f172a;
}

:deep(.auth-form .el-input__prefix) {
  color: #64748b;
}

:deep(.auth-submit.el-button) {
  min-height: 44px;
  border-color: #185c68;
  border-radius: 8px;
  background: #185c68;
  font-weight: 600;
}

:deep(.auth-submit.el-button:hover),
:deep(.auth-submit.el-button:focus) {
  border-color: #124b55;
  background: #124b55;
}

.auth-form-enter-active,
.auth-form-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.auth-form-enter-from,
.auth-form-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .auth-mode-button,
  .auth-form-enter-active,
  .auth-form-leave-active,
  :deep(.auth-form .el-input__wrapper) {
    transition: none;
  }
}
</style>
