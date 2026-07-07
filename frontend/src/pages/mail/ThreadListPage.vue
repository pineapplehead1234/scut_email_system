<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import threadApi from '../../api/thread'
import type { ThreadListItemVO, ThreadPageData, ThreadQueryParams } from '../../api/type'
import PaginationBar from '../../components/mail/PaginationBar.vue'
import ThreadFilterToolbar from '../../components/mail/ThreadFilterToolbar.vue'
import ThreadMessageList from '../../components/mail/ThreadMessageList.vue'
import { refreshMailStatisticsKey } from './mail-statistics-context'
import { createMailboxMutationService } from './mailbox-mutations'
import { toThreadListQuery } from './thread-list-query'

const route = useRoute()
const router = useRouter()
const refreshMailStatistics = inject(refreshMailStatisticsKey, undefined)
const mailboxMutations = createMailboxMutationService({
  refreshMailStatistics,
})

const emptyPage: ThreadPageData = {
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0,
  records: [],
}

const loading = ref(false)
const operatingThreadId = ref<number | null>(null)
const errorMessage = ref('')
const pageData = ref<ThreadPageData>({ ...emptyPage })

const query = computed(() => toThreadListQuery(route.query))

async function loadThreads() {
  loading.value = true
  errorMessage.value = ''

  try {
    pageData.value = await threadApi.list({ ...query.value })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '线程列表加载失败'
    pageData.value = { ...emptyPage }
  } finally {
    loading.value = false
  }
}

function viewThread(threadId: number) {
  router.push(`/mail/thread/${threadId}`)
}

function pushListQuery(nextQuery: Record<string, string | number | undefined>) {
  const routeQuery: LocationQueryRaw = {
    ...route.query,
    ...nextQuery,
  }

  Object.keys(routeQuery).forEach((key) => {
    const value = routeQuery[key]

    if (value === undefined || value === '') {
      delete routeQuery[key]
    }
  })

  router.push({ query: routeQuery })
}

function changePage(page: number) {
  pushListQuery({ page })
}

function search(filters: ThreadQueryParams) {
  pushListQuery({
    page: 1,
    keyword: filters.keyword,
    readStatus: filters.readStatus,
    senderUsername: filters.senderUsername,
    priority: filters.priority,
    startTime: filters.startTime,
    endTime: filters.endTime,
  })
}

function resetFilters() {
  router.push({
    query: {
      page: 1,
    },
  })
}

function latestMailId(thread: ThreadListItemVO) {
  const value = (thread.lastMail as { mailId?: unknown }).mailId

  return typeof value === 'number' ? value : null
}

function resolveThreadActions(thread: ThreadListItemVO) {
  return latestMailId(thread) == null ? [] : [{ type: 'delete' as const }]
}

async function runThreadOperation(
  threadId: number,
  operation: () => Promise<unknown>,
) {
  operatingThreadId.value = threadId
  errorMessage.value = ''

  try {
    await operation()
    await loadThreads()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '邮件操作失败'
  } finally {
    operatingThreadId.value = null
  }
}

function deleteThread(threadId: number) {
  const thread = pageData.value.records.find((item) => item.threadId === threadId)
  const mailId = thread ? latestMailId(thread) : null

  if (mailId == null) {
    return
  }

  return runThreadOperation(threadId, () => mailboxMutations.deleteMail(mailId))
}

function handleThreadAction(action: { type: string }, threadId: number) {
  if (action.type === 'delete') {
    void deleteThread(threadId)
  }
}
watch(() => route.fullPath, loadThreads, { immediate: true })
</script>

<template>
  <div class="space-y-4 pb-24">
    <ThreadFilterToolbar
      v-bind="query"
      @search="search"
      @reset="resetFilters"
    />

    <el-alert
      v-if="errorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    />

    <ThreadMessageList
      folder="INBOX"
      :threads="pageData.records"
      :loading="loading"
      :operating-thread-id="operatingThreadId"
      :resolve-actions="resolveThreadActions"
      @view-thread="viewThread"
      @thread-action="handleThreadAction"
    />

    <PaginationBar
      :page="pageData.page"
      :total-pages="pageData.totalPages"
      :loading="loading"
      @change-page="changePage"
    />
  </div>
</template>
