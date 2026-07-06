<script setup lang="ts">
import { computed } from 'vue'

import type { ThreadListItemVO } from '../../api/type'

const props = defineProps<{
  thread: ThreadListItemVO
}>()

const priorityType = computed(() => {
  if (props.thread.priority === 'HIGH') return 'danger'
  if (props.thread.priority === 'MEDIUM') return 'warning'

  return 'info'
})

const riskType = computed(() => {
  if (props.thread.riskLevel === 'HIGH' || props.thread.riskLevel === 'MEDIUM') {
    return 'danger'
  }
  if (props.thread.riskLevel === 'LOW') return 'warning'

  return 'success'
})

const analysisType = computed(() => {
  if (props.thread.analysisStatus === 'SUCCESS') return 'success'
  if (props.thread.analysisStatus === 'FAILED') return 'danger'

  return 'info'
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <el-tag size="small" effect="plain" :type="priorityType">
      {{ thread.priorityLabel }}
    </el-tag>
    <el-tag size="small" effect="plain" :type="riskType">
      {{ thread.riskLabel }}
    </el-tag>
    <el-tag v-if="thread.spam" size="small" effect="plain" type="danger">
      垃圾邮件
    </el-tag>
    <el-tag size="small" effect="plain" :type="analysisType">
      {{ thread.analysisStatus }}
    </el-tag>
  </div>
</template>
