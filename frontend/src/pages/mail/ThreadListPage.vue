<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import threadApi from '../../api/thread'
import type { ThreadPageData, ThreadQueryParams } from '../../api/type'
import PaginationBar from '../../components/mail/PaginationBar.vue'
import ThreadFilterToolbar from '../../components/mail/ThreadFilterToolbar.vue'
import ThreadMessageList from '../../components/mail/ThreadMessageList.vue'
import { toThreadListQuery } from './thread-list-query'

const route = useRoute()
const router = useRouter()

const emptyPage: ThreadPageData = {
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0,
  records: [],
}

const loading = ref(false)
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
      :resolve-actions="() => []"
      @view-thread="viewThread"
    />

    <PaginationBar
      :page="pageData.page"
      :total-pages="pageData.totalPages"
      :loading="loading"
      @change-page="changePage"
    />
  </div>
</template>
