<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import userApi from '../../api/user'
import type { Provider, UpdateUserSettingsRequest, UserSettingsVO } from '../../api/type'

type SettingsForm = {
  aiEnabled: boolean
  autoReplyEnabled: boolean
  prioritySortEnabled: boolean
  provider: Provider | ''
  baseUrl: string
  modelName: string
  apiKey: string
  timeoutMs: number
  maxTokens: number
  temperature: number
}

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const modelConfigured = ref(false)
const apiKeyConfigured = ref(false)
const maskedApiKey = ref<string | null>(null)
const clearApiKeyRequested = ref(false)

const form = reactive<SettingsForm>({
  aiEnabled: false,
  autoReplyEnabled: false,
  prioritySortEnabled: false,
  provider: '',
  baseUrl: '',
  modelName: '',
  apiKey: '',
  timeoutMs: 30000,
  maxTokens: 2048,
  temperature: 0.7,
})

const providerLabel = computed(() => {
  if (!form.provider) {
    return '未选择'
  }

  return form.provider
})

function fillForm(settings: UserSettingsVO) {
  form.aiEnabled = settings.aiEnabled
  form.autoReplyEnabled = settings.autoReplyEnabled
  form.prioritySortEnabled = settings.prioritySortEnabled
  form.provider = settings.provider ?? ''
  form.baseUrl = settings.baseUrl ?? ''
  form.modelName = settings.modelName ?? ''
  form.apiKey = ''
  form.timeoutMs = settings.timeoutMs
  form.maxTokens = settings.maxTokens
  form.temperature = settings.temperature
  modelConfigured.value = settings.modelConfigured
  apiKeyConfigured.value = settings.apiKeyConfigured
  maskedApiKey.value = settings.maskedApiKey
  clearApiKeyRequested.value = false
}

function buildPayload(): UpdateUserSettingsRequest {
  const payload: UpdateUserSettingsRequest = {
    aiEnabled: form.aiEnabled,
    autoReplyEnabled: form.autoReplyEnabled,
    prioritySortEnabled: form.prioritySortEnabled,
    provider: form.provider || null,
    baseUrl: form.baseUrl.trim() || null,
    modelName: form.modelName.trim() || null,
    timeoutMs: Number(form.timeoutMs),
    maxTokens: Number(form.maxTokens),
    temperature: Number(form.temperature),
  }

  const nextApiKey = form.apiKey.trim()
  if (clearApiKeyRequested.value) {
    payload.apiKey = ''
  } else if (nextApiKey) {
    payload.apiKey = nextApiKey
  }

  return payload
}

function validatePayload(payload: UpdateUserSettingsRequest) {
  if (clearApiKeyRequested.value) {
    return true
  }

  const isConfiguringModel = Boolean(
    payload.provider || payload.baseUrl || payload.modelName,
  )
  const hasKeyAfterSave =
    Boolean(payload.apiKey && payload.apiKey.trim()) ||
    (apiKeyConfigured.value && !clearApiKeyRequested.value)

  if (isConfiguringModel && !hasKeyAfterSave) {
    errorMessage.value = '首次配置模型时必须填写 API Key'
    return false
  }

  return true
}

async function loadSettings() {
  loading.value = true
  errorMessage.value = ''

  try {
    fillForm(await userApi.getSettings())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '设置加载失败'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  errorMessage.value = ''
  successMessage.value = ''

  const payload = buildPayload()
  if (!validatePayload(payload)) {
    return
  }

  saving.value = true
  try {
    const updated = await userApi.updateSettings(payload)
    fillForm(updated)
    successMessage.value = '设置已保存'
    ElMessage.success(successMessage.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '设置保存失败'
  } finally {
    saving.value = false
  }
}

function clearApiKey() {
  form.apiKey = ''
  clearApiKeyRequested.value = true
  maskedApiKey.value = null
}

onMounted(loadSettings)
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-slate-950">AI 配置</h2>
          <p class="mt-1 text-sm text-slate-500">
            控制邮件分析、自动回复和优先级排序的模型参数。
          </p>
        </div>
        <el-button
          type="primary"
          :loading="saving"
          data-test="settings-save"
          @click="saveSettings"
        >
          保存设置
        </el-button>
      </div>

      <div v-if="loading" class="mt-5 text-sm text-slate-500">正在加载设置...</div>
      <div
        v-if="errorMessage"
        class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>
      <div
        v-if="successMessage"
        class="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        {{ successMessage }}
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <label class="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <input
            v-model="form.aiEnabled"
            type="checkbox"
            data-test="settings-ai-enabled"
            class="h-4 w-4 rounded border-slate-300 text-[#185c68]"
          />
          <span>
            <span class="block text-sm font-medium text-slate-900">邮件分析</span>
            <span class="text-xs text-slate-500">摘要、风险和优先级识别</span>
          </span>
        </label>

        <label class="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <input
            v-model="form.autoReplyEnabled"
            type="checkbox"
            data-test="settings-auto-reply"
            class="h-4 w-4 rounded border-slate-300 text-[#185c68]"
          />
          <span>
            <span class="block text-sm font-medium text-slate-900">自动回复</span>
            <span class="text-xs text-slate-500">按正文生成回复草稿</span>
          </span>
        </label>

        <label class="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <input
            v-model="form.prioritySortEnabled"
            type="checkbox"
            data-test="settings-priority-sort"
            class="h-4 w-4 rounded border-slate-300 text-[#185c68]"
          />
          <span>
            <span class="block text-sm font-medium text-slate-900">优先级排序</span>
            <span class="text-xs text-slate-500">高优先级邮件靠前显示</span>
          </span>
        </label>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <label class="text-sm font-medium text-slate-700">
          服务商
          <select
            v-model="form.provider"
            data-test="settings-provider"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">未选择</option>
            <option value="qwen">QWEN</option>
            <option value="deepseek">DEEPSEEK</option>
            <option value="openai">OPENAI</option>
            <option value="custom">CUSTOM</option>
          </select>
        </label>

        <label class="text-sm font-medium text-slate-700">
          模型名称
          <input
            v-model="form.modelName"
            data-test="settings-model-name"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="例如 deepseek-chat"
          />
        </label>

        <label class="md:col-span-2 text-sm font-medium text-slate-700">
          Base URL
          <input
            v-model="form.baseUrl"
            data-test="settings-base-url"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="https://api.example.com"
          />
        </label>

        <label class="text-sm font-medium text-slate-700">
          API Key
          <input
            v-model="form.apiKey"
            data-test="settings-api-key"
            type="password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="留空表示不修改已保存 Key"
          />
        </label>

        <div class="flex items-end gap-3">
          <el-button
            plain
            data-test="settings-clear-api-key"
            @click="clearApiKey"
          >
            清空 Key
          </el-button>
          <span class="pb-2 text-xs text-slate-500">
            当前：{{ maskedApiKey || '未配置' }}
          </span>
        </div>

        <label class="text-sm font-medium text-slate-700">
          超时时间（毫秒）
          <input
            v-model.number="form.timeoutMs"
            data-test="settings-timeout"
            type="number"
            min="1000"
            step="1000"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label class="text-sm font-medium text-slate-700">
          Max Tokens
          <input
            v-model.number="form.maxTokens"
            data-test="settings-max-tokens"
            type="number"
            min="1"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label class="text-sm font-medium text-slate-700">
          Temperature
          <input
            v-model.number="form.temperature"
            data-test="settings-temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>
    </section>

    <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-base font-semibold text-slate-950">模型状态</h2>
      <div class="mt-5 space-y-3 text-sm text-slate-600">
        <div class="flex justify-between gap-4">
          <span>模型</span>
          <span class="text-right font-medium text-slate-900">
            {{ form.modelName || '未配置' }}
          </span>
        </div>
        <div class="flex justify-between gap-4">
          <span>服务商</span>
          <span class="text-right font-medium text-slate-900">
            {{ providerLabel }}
          </span>
        </div>
        <div class="flex justify-between gap-4">
          <span>模型状态</span>
          <span class="text-right font-medium text-slate-900">
            {{ modelConfigured ? '已配置' : '未配置' }}
          </span>
        </div>
        <div class="flex justify-between gap-4">
          <span>API Key</span>
          <span class="text-right font-medium text-slate-900">
            {{ maskedApiKey || (apiKeyConfigured ? '已配置' : '未配置') }}
          </span>
        </div>
      </div>
    </aside>
  </div>
</template>
