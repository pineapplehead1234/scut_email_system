<script setup lang="ts">
import { computed } from 'vue'

import type { MailItemVO } from '../../api/type'
import ThreadMailItem from './ThreadMailItem.vue'

const props = defineProps<{
  mails: MailItemVO[]
}>()

const emit = defineEmits<{
  'retry-analysis': [mail: MailItemVO]
}>()

const sortedMails = computed(() =>
  [...props.mails].sort(
    (left, right) =>
      new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  ),
)
</script>

<template>
  <div class="space-y-3">
    <ThreadMailItem
      v-for="mail in sortedMails"
      :key="mail.mailId"
      :mail="mail"
      @retry-analysis="emit('retry-analysis', $event)"
    />
  </div>
</template>
