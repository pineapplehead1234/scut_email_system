<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { Delete, Message, Refresh, RefreshLeft } from '@element-plus/icons-vue'

import mailApi from '../../api/mail'
import type {
  MailFolder,
  MailListItemVO,
  MailListQueryParams,
  MailPageData,
} from '../../api/type'
import MailFilterToolbar from '../../components/mail/MailFilterToolbar.vue'
import PaginationBar from '../../components/mail/PaginationBar.vue'
import { refreshMailStatisticsKey } from './mail-statistics-context'
import { createMailboxMutationService } from './mailbox-mutations'
import { toMailListQuery } from './mail-list-query'

const route = useRoute()
const router = useRouter()
const refreshMailStatistics = inject(refreshMailStatisticsKey, undefined)
const mailboxMutations = createMailboxMutationService({
  refreshMailStatistics,
})

const emptyPage: MailPageData = {
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0,
  records: [],
}

const loading = ref(false)
const operatingMailId = ref<number | null>(null)
const errorMessage = ref('')
const pageData = ref<MailPageData>({ ...emptyPage })

const folder = computed(() => normalizeFolder(route.meta.folder))
const query = computed(() => toMailListQuery(route.query))

function normalizeFolder(value: unknown): MailFolder {
  if (
    value === 'INBOX' ||
    value === 'SENT' ||
    value === 'TRASH' ||
    value === 'SPAM'
  ) {
    return value
  }

  return 'SENT'
}

function counterpart(mail: MailListItemVO) {
  return folder.value === 'SENT' ? mail.recipient : mail.sender
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

async function loadMails() {
  loading.value = true
  errorMessage.value = ''

  try {
    pageData.value = await mailApi.list(folder.value, query.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '邮件列表加载失败'
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

function search(filters: MailListQueryParams) {
  pushListQuery({
    page: 1,
    keyword: filters.keyword,
    readStatus: filters.readStatus,
    senderUsername: filters.senderUsername,
    recipientUsername: filters.recipientUsername,
    priority: filters.priority,
    spamLevel: filters.spamLevel,
    riskLevel: filters.riskLevel,
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

async function runMailOperation(
  mailId: number,
  operation: () => Promise<unknown>,
) {
  operatingMailId.value = mailId
  errorMessage.value = ''

  try {
    await operation()
    await loadMails()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '邮件操作失败'
  } finally {
    operatingMailId.value = null
  }
}

function markMailRead(mailId: number) {
  return runMailOperation(mailId, () => mailboxMutations.markMailRead(mailId))
}

function deleteMail(mailId: number) {
  return runMailOperation(mailId, () => mailboxMutations.deleteMail(mailId))
}

function restoreMail(mailId: number) {
  return runMailOperation(mailId, () => mailboxMutations.restoreMail(mailId))
}

function retryMailAnalysis(mailId: number) {
  return runMailOperation(mailId, () =>
    mailboxMutations.retryMailAnalysis(mailId),
  )
}

function isOperating(mailId: number) {
  return operatingMailId.value === mailId
}

watch(() => route.fullPath, loadMails, { immediate: true })
</script>

<template>
  <div class="space-y-4 pb-24">
    <MailFilterToolbar
      v-bind="query"
      :folder="folder"
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

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="space-y-3 p-5">
        <el-skeleton v-for="index in 4" :key="index" animated />
      </div>

      <el-empty
        v-else-if="pageData.records.length === 0"
        class="py-14"
        description="当前文件夹没有邮件"
      />

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="mail in pageData.records"
          :key="mail.mailId"
          role="button"
          tabindex="0"
          data-test="mail-row"
          class="grid w-full grid-cols-[minmax(150px,190px)_minmax(0,1fr)_120px_180px] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          :data-mail-id="mail.mailId"
          @click="viewThread(mail.threadId)"
          @keyup.enter="viewThread(mail.threadId)"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f2f3] text-xs font-semibold text-[#124b55]"
            >
              {{ counterpart(mail).avatarText }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-slate-900">
                {{ counterpart(mail).nickname }}
              </span>
              <span class="block truncate text-xs text-slate-400">
                {{ counterpart(mail).username }}
              </span>
            </span>
          </div>

          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <span
                v-if="mail.read === false"
                class="size-2 shrink-0 rounded-full bg-[#185c68]"
              />
              <span class="truncate text-sm font-semibold text-slate-950">
                {{ mail.subject }}
              </span>
            </div>
            <p class="mt-1 truncate text-xs text-slate-500">
              {{ mail.snippet }}
            </p>
          </div>

          <div class="text-right text-xs text-slate-400">
            {{ formatDateTime(mail.sentAt) }}
          </div>

          <div class="flex justify-end gap-1">
            <el-button
              v-if="mail.read === false && folder !== 'SENT'"
              data-test="mark-read-mail"
              size="small"
              text
              :icon="Message"
              :loading="isOperating(mail.mailId)"
              @click.stop="markMailRead(mail.mailId)"
            >
              已读
            </el-button>
            <el-button
              v-if="folder === 'TRASH'"
              data-test="restore-mail"
              size="small"
              text
              :icon="RefreshLeft"
              :loading="isOperating(mail.mailId)"
              @click.stop="restoreMail(mail.mailId)"
            >
              恢复
            </el-button>
            <el-button
              v-else-if="folder !== 'SENT'"
              data-test="delete-mail"
              size="small"
              text
              type="danger"
              :icon="Delete"
              :loading="isOperating(mail.mailId)"
              @click.stop="deleteMail(mail.mailId)"
            >
              删除
            </el-button>
            <el-button
              v-if="mail.analysisStatus === 'FAILED'"
              data-test="retry-analysis-mail"
              size="small"
              text
              :icon="Refresh"
              :loading="isOperating(mail.mailId)"
              @click.stop="retryMailAnalysis(mail.mailId)"
            >
              重试
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <PaginationBar
      :page="pageData.page"
      :total-pages="pageData.totalPages"
      :loading="loading"
      @change-page="changePage"
    />
  </div>
</template>
