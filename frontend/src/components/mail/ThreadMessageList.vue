<script setup lang="ts">
import type { Component } from 'vue'
import {
  Delete,
  Message,
  Refresh,
  RefreshLeft,
} from '@element-plus/icons-vue'

import type { ThreadFolder, ThreadListItemVO, UserBrief } from '../../api/type'
import ThreadStatusTags from './ThreadStatusTags.vue'

type ThreadListActionType =
  | 'delete'
  | 'mark-read'
  | 'restore'
  | 'retry-analysis'

type ThreadListAction = {
  type: ThreadListActionType
}

const props = defineProps<{
  threads: ThreadListItemVO[]
  folder: ThreadFolder
  loading: boolean
  operatingThreadId?: number | null
  resolveActions: (thread: ThreadListItemVO) => ThreadListAction[]
}>()

const emit = defineEmits<{
  'view-thread': [threadId: number]
  'thread-action': [action: ThreadListAction, threadId: number]
}>()

const actionMeta: Record<
  ThreadListActionType,
  {
    icon: Component
    label: string
    testId: string
    type?: 'danger'
  }
> = {
  delete: {
    icon: Delete,
    label: '删除',
    testId: 'delete-thread',
    type: 'danger',
  },
  'mark-read': {
    icon: Message,
    label: '已读',
    testId: 'mark-read-thread',
  },
  restore: {
    icon: RefreshLeft,
    label: '恢复',
    testId: 'restore-thread',
  },
  'retry-analysis': {
    icon: Refresh,
    label: '重试',
    testId: 'retry-analysis-thread',
  },
}

function primaryUser(thread: ThreadListItemVO) {
  const lastMail = thread.lastMail as {
    recipient?: UserBrief
    sender?: UserBrief
  }
  const user = props.folder === 'SENT' ? lastMail.recipient : lastMail.sender

  return (
    user || {
      username: `thread-${thread.threadId}`,
      nickname: `Thread #${thread.threadId}`,
      emailAddress: '',
      avatarText: String(thread.subject || 'T').slice(0, 1).toUpperCase(),
    }
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isOperating(threadId: number) {
  return props.operatingThreadId === threadId
}

function actionsFor(thread: ThreadListItemVO) {
  return props.resolveActions(thread)
}

function metaFor(action: ThreadListAction) {
  return actionMeta[action.type]
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div v-if="loading" class="space-y-3 p-5">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <div class="grid grid-cols-[180px_1fr_120px] items-center gap-4">
            <el-skeleton-item variant="circle" class="size-9" />
            <div class="space-y-2">
              <el-skeleton-item variant="text" class="w-2/5" />
              <el-skeleton-item variant="text" class="w-4/5" />
            </div>
            <el-skeleton-item variant="text" class="w-full" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <el-empty
      v-else-if="threads.length === 0"
      class="py-14"
      description="当前文件夹没有邮件线程"
    />

    <div v-else class="divide-y divide-slate-100">
      <div
        v-for="thread in threads"
        :key="thread.threadId"
        role="button"
        tabindex="0"
        data-test="thread-row"
        class="grid w-full grid-cols-[minmax(150px,190px)_minmax(0,1fr)_120px_160px] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
        :data-thread-id="thread.threadId"
        @click="emit('view-thread', thread.threadId)"
        @keyup.enter="emit('view-thread', thread.threadId)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f2f3] text-xs font-semibold text-[#124b55]"
          >
            {{ primaryUser(thread).avatarText }}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-slate-900">
              {{ primaryUser(thread).nickname }}
            </span>
            <span class="block truncate text-xs text-slate-400">
              {{ primaryUser(thread).username }}
            </span>
          </span>
        </div>

        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <span
              v-if="thread.unreadCount > 0"
              class="size-2 shrink-0 rounded-full bg-[#185c68]"
            />
            <span class="truncate text-sm font-semibold text-slate-950">
              {{ thread.subject }}
            </span>
            <span class="shrink-0 text-xs text-slate-400">
              {{ thread.mailCount }} 封
            </span>
          </div>
          <p class="mt-1 truncate text-xs text-slate-500">
            {{ thread.lastSnippet }}
          </p>
          <ThreadStatusTags class="mt-2" :thread="thread" />
        </div>

        <div class="text-right text-xs text-slate-400">
          {{ formatDateTime(thread.updatedAt) }}
        </div>

        <div class="flex justify-end gap-1">
          <el-button
            v-for="action in actionsFor(thread)"
            :key="action.type"
            :data-test="metaFor(action).testId"
            size="small"
            text
            :type="metaFor(action).type"
            :icon="metaFor(action).icon"
            :loading="isOperating(thread.threadId)"
            @click.stop="emit('thread-action', action, thread.threadId)"
          >
            {{ metaFor(action).label }}
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>
