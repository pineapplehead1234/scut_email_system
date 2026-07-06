<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { RefreshLeft, Search } from '@element-plus/icons-vue'

import type {
  MailFolder,
  MailListQueryParams,
  Priority,
  ReadStatus,
  RiskLevel,
  SpamLevel,
} from '../../api/type'

const props = defineProps<
  MailListQueryParams & {
    folder: MailFolder
  }
>()

const emit = defineEmits<{
  search: [filters: MailListQueryParams]
  reset: []
}>()

function toDateRange(startTime?: string, endTime?: string) {
  return startTime && endTime ? [startTime, endTime] : []
}

const model = reactive({
  keyword: props.keyword || '',
  senderUsername: props.senderUsername || '',
  recipientUsername: props.recipientUsername || '',
  readStatus: props.readStatus || 'ALL',
  priority: props.priority || '',
  spamLevel: props.spamLevel || '',
  riskLevel: props.riskLevel || '',
  dateRange: toDateRange(props.startTime, props.endTime),
})

const showRecipientFilter = computed(() => props.folder === 'SENT')
const showInboxFilters = computed(() => props.folder === 'INBOX')
const showSpamFilters = computed(() => props.folder === 'SPAM')

watch(
  () =>
    [
      props.keyword,
      props.senderUsername,
      props.recipientUsername,
      props.readStatus,
      props.priority,
      props.spamLevel,
      props.riskLevel,
      props.startTime,
      props.endTime,
    ] as const,
  ([
    keyword,
    senderUsername,
    recipientUsername,
    readStatus,
    priority,
    spamLevel,
    riskLevel,
    startTime,
    endTime,
  ]) => {
    model.keyword = keyword || ''
    model.senderUsername = senderUsername || ''
    model.recipientUsername = recipientUsername || ''
    model.readStatus = readStatus || 'ALL'
    model.priority = priority || ''
    model.spamLevel = spamLevel || ''
    model.riskLevel = riskLevel || ''
    model.dateRange = toDateRange(startTime, endTime)
  },
)

function clean(value: string) {
  const nextValue = value.trim()

  return nextValue || undefined
}

function submit() {
  const [startTime, endTime] = model.dateRange

  emit('search', {
    keyword: clean(model.keyword),
    senderUsername: showInboxFilters.value
      ? clean(model.senderUsername)
      : undefined,
    recipientUsername: showRecipientFilter.value
      ? clean(model.recipientUsername)
      : undefined,
    readStatus:
      showInboxFilters.value && model.readStatus !== 'ALL'
        ? (model.readStatus as ReadStatus)
        : undefined,
    priority:
      showInboxFilters.value && model.priority
        ? (model.priority as Priority)
        : undefined,
    spamLevel:
      showSpamFilters.value && model.spamLevel
        ? (model.spamLevel as SpamLevel)
        : undefined,
    riskLevel:
      showSpamFilters.value && model.riskLevel
        ? (model.riskLevel as RiskLevel)
        : undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
  })
}

function reset() {
  model.keyword = ''
  model.senderUsername = ''
  model.recipientUsername = ''
  model.readStatus = 'ALL'
  model.priority = ''
  model.spamLevel = ''
  model.riskLevel = ''
  model.dateRange = []
  emit('reset')
}
</script>

<template>
  <section
    class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
  >
    <input
      v-model="model.keyword"
      data-test="mail-filter-keyword"
      class="h-9 w-64 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
      placeholder="搜索主题或摘要"
      type="search"
      @keyup.enter="submit"
    />

    <input
      v-if="showInboxFilters"
      v-model="model.senderUsername"
      data-test="mail-filter-sender"
      class="h-9 w-44 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
      placeholder="发件人"
      type="text"
      @keyup.enter="submit"
    />

    <input
      v-if="showRecipientFilter"
      v-model="model.recipientUsername"
      data-test="mail-filter-recipient"
      class="h-9 w-44 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
      placeholder="收件人"
      type="text"
      @keyup.enter="submit"
    />

    <select
      v-if="showInboxFilters"
      v-model="model.readStatus"
      data-test="mail-filter-read-status"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="ALL">全部状态</option>
      <option value="UNREAD">未读</option>
      <option value="READ">已读</option>
    </select>

    <select
      v-if="showInboxFilters"
      v-model="model.priority"
      data-test="mail-filter-priority"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="">优先级</option>
      <option value="HIGH">高</option>
      <option value="MEDIUM">中</option>
      <option value="LOW">低</option>
    </select>

    <select
      v-if="showSpamFilters"
      v-model="model.spamLevel"
      data-test="mail-filter-spam-level"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="">垃圾等级</option>
      <option value="NONE">无</option>
      <option value="LOW">低</option>
      <option value="MEDIUM">中</option>
      <option value="HIGH">高</option>
    </select>

    <select
      v-if="showSpamFilters"
      v-model="model.riskLevel"
      data-test="mail-filter-risk-level"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="">风险等级</option>
      <option value="SAFE">安全</option>
      <option value="LOW">低</option>
      <option value="MEDIUM">中</option>
      <option value="HIGH">高</option>
    </select>

    <el-date-picker
      v-model="model.dateRange"
      data-test="mail-filter-date-range"
      class="w-[360px]"
      type="datetimerange"
      range-separator="至"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      format="YYYY-MM-DD HH:mm"
      value-format="YYYY-MM-DDTHH:mm:ss"
      clearable
      unlink-panels
    />

    <div class="ml-auto flex items-center gap-2">
      <el-button data-test="mail-filter-reset" :icon="RefreshLeft" @click="reset">
        重置
      </el-button>
      <el-button
        data-test="mail-filter-search"
        type="primary"
        :icon="Search"
        @click="submit"
      >
        查询
      </el-button>
    </div>
  </section>
</template>
