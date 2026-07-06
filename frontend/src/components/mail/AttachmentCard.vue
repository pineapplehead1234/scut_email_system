<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Paperclip } from '@element-plus/icons-vue'

import fileApi from '../../api/file'
import type { MailAttachmentVO } from '../../api/type'

const props = defineProps<{
  attachment: NonNullable<MailAttachmentVO>
}>()

const downloading = ref(false)

const fileSizeText = computed(() => {
  const size = props.attachment.fileSize

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }

  return `${Math.round(size / 1024)} KB`
})

async function downloadAttachment() {
  downloading.value = true

  try {
    const blob = await fileApi.download(props.attachment.fileId)
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = props.attachment.originalFilename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f2f3] text-[#124b55]"
      >
        <el-icon>
          <Paperclip />
        </el-icon>
      </span>
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium text-slate-950">
          {{ attachment.originalFilename }}
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ fileSizeText }} · {{ attachment.contentType }}
        </span>
      </span>
    </div>

    <el-button
      data-test="attachment-download"
      size="small"
      text
      :icon="Download"
      :loading="downloading"
      @click="downloadAttachment"
    >
      下载
    </el-button>
  </div>
</template>
