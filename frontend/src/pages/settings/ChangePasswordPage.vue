<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import userApi from '../../api/user'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function validateForm() {
  if (!form.currentPassword) {
    return '请输入当前密码'
  }

  if (!form.newPassword) {
    return '请输入新密码'
  }

  if (form.newPassword.length < 8) {
    return '新密码至少 8 位'
  }

  if (!form.confirmPassword) {
    return '请再次输入新密码'
  }

  if (form.confirmPassword !== form.newPassword) {
    return '两次输入的新密码不一致'
  }

  return ''
}

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

async function submitPasswordChange() {
  errorMessage.value = ''
  successMessage.value = ''

  const validationError = validateForm()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  saving.value = true
  try {
    await userApi.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    resetForm()
    successMessage.value = '密码已更新'
    ElMessage.success(successMessage.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '密码修改失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,640px)_minmax(280px,1fr)]">
    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <h2 class="text-base font-semibold text-slate-950">修改密码</h2>
        <p class="mt-1 text-sm text-slate-500">
          更新登录密码后，后续登录将使用新密码。
        </p>
      </div>

      <form class="max-w-[520px]" @submit.prevent="submitPasswordChange">
        <div
          v-if="errorMessage"
          class="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <label class="block text-sm font-medium text-slate-700">
          当前密码
          <input
            v-model="form.currentPassword"
            data-test="password-current"
            type="password"
            autocomplete="current-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="请输入当前密码"
          />
        </label>

        <label class="mt-5 block text-sm font-medium text-slate-700">
          新密码
          <input
            v-model="form.newPassword"
            data-test="password-new"
            type="password"
            autocomplete="new-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="至少 8 位"
          />
        </label>

        <label class="mt-5 block text-sm font-medium text-slate-700">
          确认新密码
          <input
            v-model="form.confirmPassword"
            data-test="password-confirm"
            type="password"
            autocomplete="new-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="再次输入新密码"
          />
        </label>

        <div class="mt-7 flex items-center gap-3">
          <el-button
            type="primary"
            native-type="submit"
            :loading="saving"
            data-test="password-submit"
            @click="submitPasswordChange"
          >
            保存修改
          </el-button>
          <RouterLink to="/settings" class="text-sm text-slate-500 hover:text-[#185c68]">
            返回设置
          </RouterLink>
        </div>
      </form>
    </section>

    <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-950">密码要求</h3>
      <div class="mt-4 space-y-3 text-sm text-slate-600">
        <div class="rounded-md bg-slate-50 px-4 py-3">至少 8 位字符</div>
        <div class="rounded-md bg-slate-50 px-4 py-3">避免与常用账号密码重复</div>
        <div class="rounded-md bg-slate-50 px-4 py-3">修改完成后建议重新登录验证</div>
      </div>
    </aside>
  </div>
</template>
