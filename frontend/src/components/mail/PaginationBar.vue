<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  page: number
  totalPages: number
  loading?: boolean
}>()

const emit = defineEmits<{
  'change-page': [page: number]
}>()

const currentPage = computed(() => Math.max(props.page || 1, 1))
const pageCount = computed(() => Math.max(props.totalPages || 1, 1))
const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < pageCount.value)

function changePage(page: number) {
  if (page < 1 || page > pageCount.value || page === currentPage.value) {
    return
  }

  emit('change-page', page)
}
</script>

<template>
  <div
    data-test="pagination-bar"
    class="fixed bottom-6 right-6 z-30 flex max-w-[calc(100vw-3rem)] flex-wrap items-center justify-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
  >
    <span class="text-xs text-slate-500">
      第 {{ currentPage }} / {{ pageCount }} 页
    </span>
    <div class="flex items-center gap-2">
      <el-button
        data-test="prev-page"
        :disabled="!canGoPrevious || loading"
        :icon="ArrowLeft"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </el-button>
      <el-button
        data-test="next-page"
        :disabled="!canGoNext || loading"
        :icon="ArrowRight"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </el-button>
    </div>
  </div>
</template>
