<script setup lang="ts">
import { reactive, watch } from 'vue'
import { RefreshLeft, Search } from '@element-plus/icons-vue'

import type { Priority, ReadStatus, ThreadQueryParams } from '../../api/type'

const props = defineProps<ThreadQueryParams>()

const emit = defineEmits<{
  search: [filters: ThreadQueryParams]
  reset: []
}>()

function toDateRange(startTime?: string, endTime?: string) {
  return startTime && endTime ? [startTime, endTime] : []
}

const model = reactive({
  keyword: props.keyword || '',
  readStatus: props.readStatus || 'ALL',
  senderUsername: props.senderUsername || '',
  priority: props.priority || '',
  dateRange: toDateRange(props.startTime, props.endTime),
})

watch(
  () =>
    [
      props.keyword,
      props.readStatus,
      props.senderUsername,
      props.priority,
      props.startTime,
      props.endTime,
    ] as const,
  ([keyword, readStatus, senderUsername, priority, startTime, endTime]) => {
    model.keyword = keyword || ''
    model.readStatus = readStatus || 'ALL'
    model.senderUsername = senderUsername || ''
    model.priority = priority || ''
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
    readStatus:
      model.readStatus === 'ALL' ? undefined : (model.readStatus as ReadStatus),
    senderUsername: clean(model.senderUsername),
    priority: model.priority ? (model.priority as Priority) : undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
  })
}

function reset() {
  model.keyword = ''
  model.readStatus = 'ALL'
  model.senderUsername = ''
  model.priority = ''
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
      data-test="thread-filter-keyword"
      class="h-9 w-64 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
      placeholder="搜索主题、摘要或联系人"
      type="search"
      @keyup.enter="submit"
    />

    <input
      v-model="model.senderUsername"
      data-test="thread-filter-sender"
      class="h-9 w-40 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
      placeholder="发件人"
      type="text"
      @keyup.enter="submit"
    />

    <select
      v-model="model.readStatus"
      data-test="thread-filter-read-status"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="ALL">全部状态</option>
      <option value="UNREAD">未读</option>
      <option value="READ">已读</option>
    </select>

    <select
      v-model="model.priority"
      data-test="thread-filter-priority"
      class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68]"
    >
      <option value="">优先级</option>
      <option value="HIGH">高</option>
      <option value="MEDIUM">中</option>
      <option value="LOW">低</option>
    </select>

    <el-date-picker
      v-model="model.dateRange"
      data-test="thread-filter-date-range"
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
      <el-button data-test="thread-filter-reset" :icon="RefreshLeft" @click="reset">
        重置
      </el-button>
      <el-button
        data-test="thread-filter-search"
        type="primary"
        :icon="Search"
        @click="submit"
      >
        查询
      </el-button>
    </div>
  </section>
</template>
