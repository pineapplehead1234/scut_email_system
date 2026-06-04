<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-5 py-4">
      <h2 class="text-base font-semibold text-slate-950">新邮件</h2>
      <p class="mt-1 text-xs text-slate-500">当前版本支持单收件人和一个附件。</p>
    </div>

    <div class="space-y-4 p-5">
      <el-input placeholder="收件人用户名" />
      <el-input placeholder="邮件主题" />
      <el-input type="textarea" :rows="10" placeholder="输入邮件正文" />

      <div
        class="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3"
      >
        <div>
          <div class="text-sm font-medium text-slate-800">附件</div>
          <div class="mt-1 text-xs text-slate-500">支持 png、jpg、pdf、docx、zip，最大 10MB。</div>
        </div>
        <el-button>选择文件</el-button>
      </div>

      <div class="flex justify-end gap-2">
        <el-button>存草稿</el-button>
        <el-button type="primary">发送邮件</el-button>
      </div>
    </div>
  </section>
</template>
