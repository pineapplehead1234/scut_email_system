<template>
  <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-base font-semibold text-slate-950">AI 功能</h2>
      <div class="mt-5 space-y-4">
        <div class="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <div>
            <div class="text-sm font-medium text-slate-900">邮件分析</div>
            <div class="mt-1 text-xs text-slate-500">摘要、优先级和风险识别</div>
          </div>
          <el-switch />
        </div>
        <div class="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <div>
            <div class="text-sm font-medium text-slate-900">回复建议</div>
            <div class="mt-1 text-xs text-slate-500">根据正文生成回复草稿</div>
          </div>
          <el-switch />
        </div>
      </div>
    </section>

    <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-base font-semibold text-slate-950">账号信息</h2>
      <div class="mt-5 space-y-3 text-sm text-slate-600">
        <div class="flex justify-between">
          <span>用户名</span>
          <span class="font-medium text-slate-900">admin</span>
        </div>
        <div class="flex justify-between">
          <span>邮箱</span>
          <span class="font-medium text-slate-900">admin@mail.com</span>
        </div>
      </div>
    </aside>
  </div>
</template>
