<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => String(route.meta.title || '邮件列表'))
const folder = computed(() => String(route.meta.folder || 'inbox'))

const folderMeta = computed(() => {
  const meta = {
    inbox: {
      stat: '12 封邮件',
      accent: 'bg-[#185c68]',
      note: '未读邮件会在这里优先显示',
    },
    sent: {
      stat: '8 封邮件',
      accent: 'bg-[#4f6f52]',
      note: '已发送记录按时间倒序排列',
    },
    trash: {
      stat: '2 封邮件',
      accent: 'bg-[#7a6a3a]',
      note: '删除的收件邮件可在这里恢复',
    },
    spam: {
      stat: '1 封邮件',
      accent: 'bg-rose-600',
      note: '高风险邮件会在这里集中处理',
    },
  }

  return meta[folder.value as keyof typeof meta] || meta.inbox
})
</script>

<template>
  <div class="space-y-4">
    <section
      class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <el-input class="max-w-xs" placeholder="搜索主题、正文或联系人" clearable />
      <el-select class="w-32" placeholder="状态">
        <el-option label="全部" value="all" />
        <el-option label="未读" value="unread" />
        <el-option label="已读" value="read" />
      </el-select>
      <el-date-picker type="daterange" start-placeholder="开始时间" end-placeholder="结束时间" />
      <div class="ml-auto flex items-center gap-2">
        <el-button>重置</el-button>
        <el-button type="primary">查询</el-button>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 class="text-base font-semibold text-slate-950">{{ title }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ folderMeta.note }}</p>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="h-2 w-2 rounded-full" :class="folderMeta.accent" />
          <span>{{ folderMeta.stat }}</span>
        </div>
      </div>

      <div class="divide-y divide-slate-100">
        <div
          v-for="index in 3"
          :key="index"
          class="grid grid-cols-[160px_1fr_132px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e4f2f3] text-xs font-semibold text-[#124b55]"
            >
              {{ index === 1 ? '系' : index === 2 ? '张' : '李' }}
            </span>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-slate-900">
                {{ index === 1 ? '系统通知' : index === 2 ? '张三' : '李四' }}
              </div>
              <div class="truncate text-xs text-slate-400">username{{ index }}</div>
            </div>
          </div>

          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-slate-900">
              {{ index === 1 ? '实验报告提交提醒' : index === 2 ? '课程资料已更新' : '会议时间确认' }}
            </div>
            <div class="mt-1 truncate text-xs text-slate-500">
              这里展示邮件正文摘要、附件状态和 AI 分析结果摘要。
            </div>
          </div>

          <div class="text-right text-xs text-slate-400">今天 14:2{{ index }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
