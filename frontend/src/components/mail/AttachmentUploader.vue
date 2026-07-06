<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'

import fileApi from '../../api/file'
import type { MailAttachmentVO } from '../../api/type'

const emit = defineEmits<{
  uploaded: [attachment: NonNullable<MailAttachmentVO>]
}>()

const maxFileSize = 10 * 1024 * 1024
const supportedExtensions = new Set(['png', 'jpg', 'jpeg', 'pdf', 'docx', 'zip'])

const uploading = ref(false)
const errorMessage = ref('')

function resolveExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

function validateFile(file: File) {
  if (!supportedExtensions.has(resolveExtension(file))) {
    return '文件类型不支持'
  }

  if (file.size > maxFileSize) {
    return '文件大小不能超过 10MB'
  }

  return ''
}

async function uploadFile(file: File) {
  errorMessage.value = ''

  const validationError = validateFile(file)
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  uploading.value = true
  try {
    const data = await fileApi.upload(file)
    emit('uploaded', {
      fileId: data.fileId,
      originalFilename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      downloadUrl: `/api/files/${encodeURIComponent(data.fileId)}/download`,
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '附件上传失败'
  } finally {
    uploading.value = false
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  void uploadFile(file)
}
</script>

<template>
  <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
    <label class="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span class="block text-sm font-medium text-slate-900">添加附件</span>
        <span class="mt-1 block text-xs text-slate-500">
          支持 png、jpg、pdf、docx、zip，最大 10MB。
        </span>
      </span>
      <span class="inline-flex items-center gap-2 text-sm font-medium text-[#185c68]">
        <el-icon>
          <Upload />
        </el-icon>
        {{ uploading ? '上传中' : '选择文件' }}
      </span>
      <input
        data-test="attachment-input"
        type="file"
        class="sr-only"
        accept=".png,.jpg,.jpeg,.pdf,.docx,.zip"
        :disabled="uploading"
        @change="handleFileChange"
      />
    </label>

    <p v-if="errorMessage" class="mt-3 text-sm text-red-600">
      {{ errorMessage }}
    </p>
  </div>
</template>
