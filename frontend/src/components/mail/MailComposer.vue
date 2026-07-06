<script setup lang="ts">
import { computed, ref } from 'vue'
import { Promotion } from '@element-plus/icons-vue'

import type { MailAttachmentVO, RichTextNode } from '../../api/type'
import AttachmentCard from './AttachmentCard.vue'
import AttachmentUploader from './AttachmentUploader.vue'
import RichTextEditor from './RichTextEditor.vue'
import { isRichTextEmpty } from '../../pages/mail/rich-text-adapter'

type ComposerAttachment = NonNullable<MailAttachmentVO>

export type MailComposerSubmitPayload = {
  recipientUsername: string
  subject: string
  content: RichTextNode[]
  attachmentFileId?: string
}

const props = withDefaults(
  defineProps<{
    recipientUsername: string
    subject: string
    content: RichTextNode[]
    attachment: ComposerAttachment | null
    recipientReadonly?: boolean
    subjectReadonly?: boolean
    submitting?: boolean
    submitLabel?: string
    submitDataTest?: string
    cancelLabel?: string
    showCancel?: boolean
    errorMessage?: string
    validationMessage?: string
  }>(),
  {
    recipientReadonly: false,
    subjectReadonly: false,
    submitting: false,
    submitLabel: '发送邮件',
    submitDataTest: 'composer-submit',
    cancelLabel: '取消',
    showCancel: true,
    errorMessage: '',
    validationMessage: '收件人、主题和正文不能为空',
  },
)

const emit = defineEmits<{
  'update:recipientUsername': [value: string]
  'update:subject': [value: string]
  'update:content': [value: RichTextNode[]]
  'update:attachment': [value: ComposerAttachment | null]
  submit: [payload: MailComposerSubmitPayload]
  cancel: []
}>()

const localErrorMessage = ref('')

const recipientModel = computed({
  get: () => props.recipientUsername,
  set: (value: string) => emit('update:recipientUsername', value),
})

const subjectModel = computed({
  get: () => props.subject,
  set: (value: string) => emit('update:subject', value),
})

const contentModel = computed({
  get: () => props.content,
  set: (value: RichTextNode[]) => emit('update:content', value),
})

const displayErrorMessage = computed(
  () => props.errorMessage || localErrorMessage.value,
)

function submit() {
  localErrorMessage.value = ''

  if (
    !props.recipientUsername.trim() ||
    !props.subject.trim() ||
    isRichTextEmpty(props.content)
  ) {
    localErrorMessage.value = props.validationMessage

    return
  }

  const payload: MailComposerSubmitPayload = {
    recipientUsername: props.recipientUsername.trim(),
    subject: props.subject.trim(),
    content: props.content,
  }

  if (props.attachment?.fileId) {
    payload.attachmentFileId = props.attachment.fileId
  }

  emit('submit', payload)
}
</script>

<template>
  <section class="space-y-4">
    <el-alert
      v-if="displayErrorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="displayErrorMessage"
    />

    <label class="block">
      <span class="mb-1 block text-xs font-medium text-slate-500">收件人</span>
      <input
        v-model="recipientModel"
        data-test="composer-recipient"
        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68] focus:ring-2 focus:ring-[#185c68]/15 read-only:bg-slate-50 read-only:text-slate-500"
        placeholder="收件人用户名"
        :readonly="recipientReadonly"
      />
    </label>

    <label class="block">
      <span class="mb-1 block text-xs font-medium text-slate-500">主题</span>
      <input
        v-model="subjectModel"
        data-test="composer-subject"
        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#185c68] focus:ring-2 focus:ring-[#185c68]/15 read-only:bg-slate-50 read-only:text-slate-500"
        placeholder="邮件主题"
        :readonly="subjectReadonly"
      />
    </label>

    <label class="block">
      <span class="mb-1 block text-xs font-medium text-slate-500">正文</span>
      <RichTextEditor
        v-model="contentModel"
        placeholder="输入邮件正文"
      />
    </label>

    <AttachmentCard v-if="attachment" :attachment="attachment" />
    <AttachmentUploader v-else @uploaded="emit('update:attachment', $event)" />

    <div class="flex justify-end gap-2">
      <el-button v-if="showCancel" @click="emit('cancel')">
        {{ cancelLabel }}
      </el-button>
      <el-button
        :data-test="submitDataTest"
        type="primary"
        :icon="Promotion"
        :loading="submitting"
        @click="submit"
      >
        {{ submitLabel }}
      </el-button>
    </div>
  </section>
</template>
