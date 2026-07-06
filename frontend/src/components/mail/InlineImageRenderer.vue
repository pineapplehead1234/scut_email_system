<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import fileApi from '../../api/file'

const props = defineProps<{
  resourceId: string
}>()

const imageUrl = ref('')
const errorMessage = ref('')

function revokeImageUrl() {
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
}

async function loadImage() {
  revokeImageUrl()
  imageUrl.value = ''
  errorMessage.value = ''

  try {
    imageUrl.value = await fileApi.createObjectUrl(props.resourceId)
  } catch {
    errorMessage.value = '图片加载失败'
  }
}

watch(() => props.resourceId, loadImage, { immediate: true })
onBeforeUnmount(revokeImageUrl)
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt="邮件内嵌图片"
      class="max-h-[420px] w-full object-contain"
    />
    <div v-else class="px-4 py-6 text-center text-sm text-slate-500">
      {{ errorMessage || '图片加载中...' }}
    </div>
  </div>
</template>
