<script setup lang="ts">
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

import type { AnalysisStatus, MailItemVO } from '../../api/type'
import AttachmentCard from './AttachmentCard.vue'
import RichTextRenderer from './RichTextRenderer.vue'

const props = defineProps<{
  mail: MailItemVO
}>()

const emit = defineEmits<{
  'retry-analysis': [mail: MailItemVO]
}>()

const analysisStatusLabels: Record<AnalysisStatus, string> = {
  NOT_STARTED: '未开始',
  PENDING: '分析中',
  SUCCESS: '分析完成',
  FAILED: '分析失败',
  DISABLED: '已停用',
}

const hasAnalysisMetadata = computed(() =>
  Boolean(
    props.mail.analysisStatus ||
      props.mail.priorityLabel ||
      props.mail.riskLabel ||
      props.mail.spamLevelLabel ||
      props.mail.riskReason,
  ),
)

const analysisStatusText = computed(() => {
  if (!props.mail.analysisStatus) {
    return ''
  }

  return analysisStatusLabels[props.mail.analysisStatus]
})

const sentAtText = computed(() => {
  const date = new Date(props.mail.sentAt)

  if (Number.isNaN(date.getTime())) {
    return props.mail.sentAt
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})
</script>

<template>
  <article
    data-test="thread-mail"
    class="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e4f2f3] text-sm font-semibold text-[#124b55]"
        >
          {{ mail.sender.avatarText }}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-slate-950">
            {{ mail.sender.nickname }}
          </span>
          <span class="block truncate text-xs text-slate-500">
            {{ mail.sender.emailAddress }}
          </span>
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span class="text-xs text-slate-400">{{ sentAtText }}</span>
      </div>
    </header>

    <RichTextRenderer class="mt-4" :nodes="mail.content" />

    <AttachmentCard
      v-if="mail.attachment"
      class="mt-4"
      :attachment="mail.attachment"
    />

    <section
      v-if="hasAnalysisMetadata"
      class="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span
          v-if="analysisStatusText"
          class="rounded-full bg-white px-2.5 py-1 font-medium text-slate-600"
        >
          {{ analysisStatusText }}
        </span>
        <span
          v-if="mail.priorityLabel"
          class="rounded-full bg-white px-2.5 py-1 font-medium text-[#185c68]"
        >
          {{ mail.priorityLabel }}
        </span>
        <span
          v-if="mail.riskLabel"
          class="rounded-full bg-white px-2.5 py-1 font-medium text-rose-600"
        >
          {{ mail.riskLabel }}
        </span>
        <span
          v-if="mail.spamLevelLabel"
          class="rounded-full bg-white px-2.5 py-1 font-medium text-amber-600"
        >
          {{ mail.spamLevelLabel }}
        </span>
        <el-button
          v-if="mail.analysisStatus === 'FAILED'"
          data-test="retry-analysis"
          size="small"
          text
          :icon="Refresh"
          @click="emit('retry-analysis', mail)"
        >
          重新分析
        </el-button>
      </div>
      <p v-if="mail.riskReason" class="mt-3 text-sm leading-6 text-slate-600">
        {{ mail.riskReason }}
      </p>
    </section>
  </article>
</template>
