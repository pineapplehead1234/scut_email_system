<script setup lang="ts">
import { computed } from 'vue'

import type { AnalysisStatus, ThreadAnalysisVO } from '../../api/type'

type DisplayItem = {
  label: string
  value: string
}

const props = defineProps<{
  analysis?: ThreadAnalysisVO | null
  errorMessage?: string
  hasMore: boolean
  loadedMailCount: number
  loading: boolean
  reanalyzeAll: boolean
}>()

const emit = defineEmits<{
  'run-analysis': []
  'update:reanalyzeAll': [value: boolean]
}>()

const statusLabels: Record<AnalysisStatus, string> = {
  NOT_STARTED: '未开始',
  PENDING: '分析中',
  SUCCESS: '分析完成',
  FAILED: '分析失败',
  DISABLED: '已停用',
}

const statusClasses: Record<AnalysisStatus, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-sky-50 text-sky-700',
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-rose-50 text-rose-700',
  DISABLED: 'bg-slate-100 text-slate-500',
}

const statusText = computed(() => {
  const status = props.analysis?.analysisStatus

  return status ? statusLabels[status] : '未开始'
})

const statusClass = computed(() => {
  const status = props.analysis?.analysisStatus

  return status ? statusClasses[status] : statusClasses.NOT_STARTED
})

function isDisplayItem(item: DisplayItem | null): item is DisplayItem {
  return item !== null
}

const metricItems = computed(() =>
  [
    props.analysis?.priorityLabel
      ? { label: '优先级', value: props.analysis.priorityLabel }
      : null,
    props.analysis?.riskLabel
      ? { label: '风险', value: props.analysis.riskLabel }
      : null,
    props.analysis?.spamLevelLabel
      ? { label: '垃圾', value: props.analysis.spamLevelLabel }
      : null,
  ].filter(isDisplayItem),
)

const reasonItems = computed(() =>
  [
    props.analysis?.priorityReason
      ? { label: '优先级依据', value: props.analysis.priorityReason }
      : null,
    props.analysis?.riskReason
      ? { label: '风险依据', value: props.analysis.riskReason }
      : null,
    props.analysis?.spamReason
      ? { label: '垃圾邮件依据', value: props.analysis.spamReason }
      : null,
  ].filter(isDisplayItem),
)

const replySuggestions = computed(() =>
  (props.analysis?.replySuggestions || []).filter((item) => item.trim()),
)

function updateReanalyzeAll(event: Event) {
  emit(
    'update:reanalyzeAll',
    (event.target as HTMLInputElement).checked,
  )
}
</script>

<template>
  <section
    data-test="thread-analysis-panel"
    class="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-sm font-semibold text-slate-950">AI 分析</h3>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="statusClass"
          >
            {{ statusText }}
          </span>
        </div>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {{ analysis?.summary || '暂无分析结果。' }}
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <label class="inline-flex items-center gap-2 text-xs text-slate-600">
          <input
            data-test="reanalyze-all-toggle"
            type="checkbox"
            class="size-4 rounded border-slate-300 text-[#185c68] focus:ring-[#185c68]"
            :checked="reanalyzeAll"
            @change="updateReanalyzeAll"
          />
          全部重新分析
        </label>
        <button
          data-test="thread-ai-analysis-run"
          type="button"
          class="inline-flex h-9 items-center rounded-md bg-[#185c68] px-3 text-sm font-medium text-white transition hover:bg-[#124b55] disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="loading || loadedMailCount === 0"
          @click="emit('run-analysis')"
        >
          {{ loading ? '分析中...' : 'AI 分析' }}
        </button>
      </div>
    </header>

    <p v-if="errorMessage" class="mt-3 text-sm text-rose-600">
      {{ errorMessage }}
    </p>

    <p v-if="hasMore" class="mt-3 text-xs text-slate-500">
      全部重新分析仅处理当前已加载 {{ loadedMailCount }} 封邮件。
    </p>

    <div v-if="metricItems.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="item in metricItems"
        :key="item.label"
        class="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
      >
        {{ item.label }}：{{ item.value }}
      </span>
    </div>

    <dl
      v-if="reasonItems.length"
      class="mt-4 grid gap-3 text-sm md:grid-cols-3"
    >
      <div v-for="item in reasonItems" :key="item.label">
        <dt class="text-xs font-medium text-slate-500">{{ item.label }}</dt>
        <dd class="mt-1 leading-6 text-slate-700">{{ item.value }}</dd>
      </div>
    </dl>

    <div v-if="replySuggestions.length" class="mt-4">
      <p class="text-xs font-medium text-slate-500">回复建议</p>
      <ul class="mt-2 space-y-2 text-sm leading-6 text-slate-700">
        <li
          v-for="suggestion in replySuggestions"
          :key="suggestion"
          class="rounded-md bg-slate-50 px-3 py-2"
        >
          {{ suggestion }}
        </li>
      </ul>
    </div>
  </section>
</template>
