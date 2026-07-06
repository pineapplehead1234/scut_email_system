<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import threadApi from '../../api/thread'
import type {
  MailAttachmentVO,
  MailItemVO,
  RichTextNode,
  ThreadDetailVO,
} from '../../api/type'
import MailComposer, {
  type MailComposerSubmitPayload,
} from '../../components/mail/MailComposer.vue'
import RichTextRenderer from '../../components/mail/RichTextRenderer.vue'
import ThreadAnalysisPanel from '../../components/mail/ThreadAnalysisPanel.vue'
import ThreadTimeline from '../../components/mail/ThreadTimeline.vue'
import { buildReplyEmailRequest, buildReplySubject } from './email-request-builder'
import { refreshMailStatisticsKey } from './mail-statistics-context'
import { createMailboxMutationService } from './mailbox-mutations'
import { richTextToPlainText, textToRichText } from './rich-text'
import { isRichTextEmpty } from './rich-text-adapter'

const route = useRoute()
const refreshMailStatistics = inject(refreshMailStatisticsKey, undefined)
const mailboxMutations = createMailboxMutationService({
  refreshMailStatistics,
})
const threadId = computed(() => String(route.params.threadId || ''))

const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const thread = ref<ThreadDetailVO | null>(null)
const quickReplyText = ref('')
const replyDrawerOpen = ref(false)
const fullReplyRecipientUsername = ref('')
const fullReplySubject = ref('')
const fullReplyContent = ref<RichTextNode[]>([])
const fullReplyAttachment = ref<NonNullable<MailAttachmentVO> | null>(null)
const aiSuggestion = ref<RichTextNode[] | null>(null)
const aiLoading = ref(false)
const aiErrorMessage = ref('')
const analysisLoading = ref(false)
const analysisErrorMessage = ref('')
const reanalyzeAllLoadedMails = ref(false)

const latestReplyTarget = computed(() => {
  const mails = thread.value?.mails || []
  const sortedMails = [...mails].sort(
    (left, right) =>
      new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  )

  return sortedMails[sortedMails.length - 1] || null
})

const replyRecipient = computed(() => {
  const target = latestReplyTarget.value

  if (!target) {
    return null
  }

  const currentUsername = readCurrentUsername()

  if (currentUsername && target.sender.username === currentUsername) {
    return target.recipient
  }

  return target.sender
})

const replyRecipientLabel = computed(() => {
  const recipient = replyRecipient.value

  if (!recipient) {
    return '当前线程'
  }

  return `${recipient.nickname}（${recipient.username}）`
})

const hasFullReplyDraft = computed(() =>
  Boolean(!isRichTextEmpty(fullReplyContent.value) || fullReplyAttachment.value),
)

function readCurrentUsername() {
  const rawUser = localStorage.getItem('mail_user')

  if (!rawUser) {
    return ''
  }

  try {
    const user = JSON.parse(rawUser) as { username?: string }

    return user.username || ''
  } catch {
    return ''
  }
}

function resetReplyDrafts() {
  quickReplyText.value = ''
  replyDrawerOpen.value = false
  fullReplyRecipientUsername.value = ''
  fullReplySubject.value = ''
  fullReplyContent.value = []
  fullReplyAttachment.value = null
  aiSuggestion.value = null
  aiErrorMessage.value = ''
  analysisErrorMessage.value = ''
  reanalyzeAllLoadedMails.value = false
}

function syncFullReplyContext() {
  fullReplyRecipientUsername.value = replyRecipient.value?.username || ''
  fullReplySubject.value = buildReplySubject(thread.value?.subject || '')
}

async function loadDetail() {
  if (!threadId.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    thread.value = await threadApi.detail(threadId.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '线程详情加载失败'
    thread.value = null
  } finally {
    loading.value = false
  }
}

async function loadMoreMails() {
  const currentThread = thread.value
  const nextCursor = currentThread?.nextCursor

  if (!currentThread?.hasMore || !nextCursor || loadingMore.value) {
    return
  }

  loadingMore.value = true
  errorMessage.value = ''

  try {
    const nextPage = await threadApi.detail(threadId.value, {
      cursor: nextCursor,
      limit: currentThread.limit,
    })

    thread.value = {
      ...nextPage,
      mails: [...currentThread.mails, ...nextPage.mails],
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '更多邮件加载失败'
  } finally {
    loadingMore.value = false
  }
}

function openReplyDrawer() {
  syncFullReplyContext()

  if (isRichTextEmpty(fullReplyContent.value) && quickReplyText.value.trim()) {
    fullReplyContent.value = textToRichText(quickReplyText.value)
  }

  replyDrawerOpen.value = true
}

function closeReplyDrawer() {
  replyDrawerOpen.value = false
}

function clearFullReplyDraft() {
  fullReplyContent.value = []
  fullReplyAttachment.value = null
  replyDrawerOpen.value = false
}

async function submitQuickReply() {
  if (!thread.value || !latestReplyTarget.value) {
    return
  }

  if (!quickReplyText.value.trim()) {
    errorMessage.value = '请输入回复内容'

    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    await mailboxMutations.replyEmail(
      buildReplyEmailRequest({
        threadSubject: thread.value.subject,
        replyTarget: latestReplyTarget.value,
        content: textToRichText(quickReplyText.value),
      }),
    )
    quickReplyText.value = ''
    aiSuggestion.value = null
    await loadDetail()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '回复发送失败'
  } finally {
    submitting.value = false
  }
}

async function submitFullReply(payload: MailComposerSubmitPayload) {
  if (!thread.value || !latestReplyTarget.value) {
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    await mailboxMutations.replyEmail(
      buildReplyEmailRequest({
        threadSubject: thread.value.subject,
        replyTarget: latestReplyTarget.value,
        content: payload.content,
        attachmentFileId: payload.attachmentFileId,
      }),
    )
    clearFullReplyDraft()
    quickReplyText.value = ''
    aiSuggestion.value = null
    await loadDetail()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '回复发送失败'
  } finally {
    submitting.value = false
  }
}

async function generateAiSuggestion() {
  if (!threadId.value) {
    return
  }

  aiLoading.value = true
  aiErrorMessage.value = ''

  try {
    const data = await threadApi.replyText(threadId.value)

    if (!data.replyText.trim()) {
      aiSuggestion.value = null
      aiErrorMessage.value = '暂无可用的 AI 回复建议'

      return
    }

    aiSuggestion.value = textToRichText(data.replyText)
  } catch (error) {
    aiErrorMessage.value =
      error instanceof Error ? error.message : 'AI 回复建议加载失败'
  } finally {
    aiLoading.value = false
  }
}

async function runThreadAnalysis() {
  const currentThread = thread.value
  const target = latestReplyTarget.value

  if (!currentThread || !target) {
    return
  }

  analysisLoading.value = true
  analysisErrorMessage.value = ''
  aiErrorMessage.value = ''

  try {
    if (reanalyzeAllLoadedMails.value) {
      await mailboxMutations.retryMailAnalyses(
        currentThread.mails.map((mail) => mail.mailId),
      )
    } else {
      await mailboxMutations.retryMailAnalysis(target.mailId)
    }

    await loadDetail()
    await generateAiSuggestion()
  } catch (error) {
    analysisErrorMessage.value =
      error instanceof Error ? error.message : 'AI 分析失败'
  } finally {
    analysisLoading.value = false
  }
}

function adoptAiSuggestion() {
  if (!aiSuggestion.value) {
    return
  }

  if (
    quickReplyText.value.trim() &&
    !window.confirm('AI 建议会覆盖当前快速回复内容，是否继续？')
  ) {
    return
  }

  quickReplyText.value = richTextToPlainText(aiSuggestion.value)
}

async function retryAnalysis(mail: MailItemVO) {
  errorMessage.value = ''

  try {
    await mailboxMutations.retryMailAnalysis(mail.mailId)
    await loadDetail()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '重新分析失败'
  }
}

watch(
  threadId,
  () => {
    resetReplyDrafts()
    void loadDetail()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4 pb-8">
    <section class="min-w-0 space-y-4">
      <header class="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-semibold text-slate-950">
              {{ thread?.subject || '邮件线程详情' }}
            </h2>
            <p class="mt-2 text-xs text-slate-500">
              Thread #{{ threadId }}
              <span v-if="thread"> · {{ thread.total }} 封邮件</span>
            </p>
          </div>
          <el-button :loading="loading" @click="loadDetail">刷新</el-button>
        </div>
      </header>

      <el-alert
        v-if="errorMessage"
        type="error"
        show-icon
        :closable="false"
        :title="errorMessage"
      />

      <div v-if="loading && !thread" class="space-y-3">
        <el-skeleton v-for="index in 2" :key="index" animated />
      </div>

      <template v-else-if="thread">
        <ThreadAnalysisPanel
          v-model:reanalyze-all="reanalyzeAllLoadedMails"
          :analysis="thread.analysis"
          :error-message="analysisErrorMessage"
          :has-more="thread.hasMore"
          :loaded-mail-count="thread.mails.length"
          :loading="analysisLoading || aiLoading"
          @run-analysis="runThreadAnalysis"
        />

        <ThreadTimeline
          :mails="thread.mails"
          @retry-analysis="retryAnalysis"
        />

        <div v-if="thread.hasMore" class="flex justify-center">
          <el-button
            data-test="load-more-mails"
            :loading="loadingMore"
            @click="loadMoreMails"
          >
            加载更多
          </el-button>
        </div>
      </template>
    </section>

    <section
      v-if="thread && latestReplyTarget"
      data-test="thread-reply-bar"
      class="sticky bottom-0 z-20 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>回复最新邮件：{{ replyRecipientLabel }}</span>
        <span
          v-if="hasFullReplyDraft && !replyDrawerOpen"
          class="rounded-full bg-[#e4f2f3] px-2.5 py-1 font-medium text-[#124b55]"
        >
          已有草稿
        </span>
      </div>

      <el-alert
        v-if="aiErrorMessage"
        class="mb-3"
        type="error"
        show-icon
        :closable="false"
        :title="aiErrorMessage"
      />

      <section
        v-if="aiSuggestion"
        data-test="ai-suggestion-card"
        class="mb-3 rounded-lg border border-[#b7d7dc] bg-[#f2fbfc] px-4 py-3"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-semibold text-[#124b55]">AI 回复建议</span>
          <div class="flex gap-2">
            <el-button
              data-test="ai-suggestion-adopt"
              size="small"
              type="primary"
              @click="adoptAiSuggestion"
            >
              采用
            </el-button>
            <el-button
              data-test="ai-suggestion-refresh"
              size="small"
              :loading="aiLoading"
              @click="generateAiSuggestion"
            >
              重新生成
            </el-button>
            <el-button
              data-test="ai-suggestion-close"
              size="small"
              text
              @click="aiSuggestion = null"
            >
              关闭
            </el-button>
          </div>
        </div>
        <RichTextRenderer :nodes="aiSuggestion" />
      </section>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <textarea
          v-model="quickReplyText"
          data-test="quick-reply-input"
          rows="1"
          class="min-h-10 resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#185c68] focus:ring-2 focus:ring-[#185c68]/15"
          placeholder="写一句简短回复"
        />
        <div class="flex flex-wrap items-center justify-end gap-2">
          <el-button
            data-test="quick-reply-submit"
            type="primary"
            :loading="submitting"
            @click="submitQuickReply"
          >
            回复
          </el-button>
          <el-button data-test="open-reply-drawer" @click="openReplyDrawer">
            拉起
          </el-button>
          <el-button
            data-test="ai-reply-suggest"
            :loading="aiLoading"
            @click="generateAiSuggestion"
          >
            AI 回复
          </el-button>
        </div>
      </div>
    </section>

    <div
      v-if="thread && latestReplyTarget"
      v-show="replyDrawerOpen"
      class="fixed inset-0 z-40 bg-slate-950/25"
      @click.self="closeReplyDrawer"
    />
    <section
      v-if="thread && latestReplyTarget"
      v-show="replyDrawerOpen"
      data-test="reply-drawer"
      class="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white shadow-2xl"
    >
      <header class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-950">回复线程</h3>
          <p class="mt-1 text-xs text-slate-500">
            收起会保留草稿，清空草稿才会丢弃内容。
          </p>
        </div>
        <el-button data-test="collapse-reply-drawer" text @click="closeReplyDrawer">
          收起
        </el-button>
      </header>

      <div class="max-h-[min(76vh,720px)] overflow-y-auto p-5">
        <MailComposer
          v-model:recipient-username="fullReplyRecipientUsername"
          v-model:subject="fullReplySubject"
          v-model:content="fullReplyContent"
          v-model:attachment="fullReplyAttachment"
          recipient-readonly
          subject-readonly
          submit-label="发送回复"
          cancel-label="清空草稿"
          validation-message="回复正文不能为空"
          :submitting="submitting"
          @submit="submitFullReply"
          @cancel="clearFullReplyDraft"
        />
      </div>
    </section>
  </div>
</template>
