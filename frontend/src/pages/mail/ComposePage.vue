<script setup lang="ts">
import { inject, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { buildSendEmailRequest } from './email-request-builder'
import { refreshMailStatisticsKey } from './mail-statistics-context'
import { createMailboxMutationService } from './mailbox-mutations'
import MailComposer, {
  type MailComposerSubmitPayload,
} from '../../components/mail/MailComposer.vue'
import type { MailAttachmentVO, RichTextNode } from '../../api/type'

const router = useRouter()
const refreshMailStatistics = inject(refreshMailStatisticsKey, undefined)
const mailboxMutations = createMailboxMutationService({
  refreshMailStatistics,
})

const form = reactive({
  recipientUsername: '',
  subject: '',
  content: [] as RichTextNode[],
})

const submitting = ref(false)
const errorMessage = ref('')
const attachment = ref<NonNullable<MailAttachmentVO> | null>(null)

async function submit(payload: MailComposerSubmitPayload) {
  errorMessage.value = ''

  submitting.value = true

  try {
    const data = await mailboxMutations.sendEmail(
      buildSendEmailRequest(payload),
    )

    router.push(`/mail/thread/${data.threadId}`)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '邮件发送失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-5 py-4">
      <h2 class="text-base font-semibold text-slate-950">新邮件</h2>
      <p class="mt-1 text-xs text-slate-500">当前版本支持单收件人。</p>
    </div>

    <div class="space-y-4 p-5">
      <el-alert
        v-if="errorMessage"
        type="error"
        show-icon
        :closable="false"
        :title="errorMessage"
      />

      <MailComposer
        v-model:recipient-username="form.recipientUsername"
        v-model:subject="form.subject"
        v-model:content="form.content"
        v-model:attachment="attachment"
        :submitting="submitting"
        submit-data-test="compose-submit"
        @submit="submit"
        @cancel="router.push('/mail/inbox')"
      />
    </div>
  </section>
</template>
