<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const formRef = ref<FormInstance>()

const form = reactive<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules<PasswordForm> = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '新密码至少 8 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
          return
        }

        callback()
      },
      trigger: 'blur',
    },
  ],
}

async function submitPasswordChange() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  ElMessage.info('修改密码接口待接入')
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

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="max-w-[520px]"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="form.currentPassword"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入当前密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="至少 8 位"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="再次输入新密码"
          />
        </el-form-item>

        <div class="mt-7 flex items-center gap-3">
          <el-button type="primary" @click="submitPasswordChange">
            保存修改
          </el-button>
          <RouterLink to="/settings" class="text-sm text-slate-500 hover:text-[#185c68]">
            返回设置
          </RouterLink>
        </div>
      </el-form>
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
