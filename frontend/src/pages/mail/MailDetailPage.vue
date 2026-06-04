<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <article class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 px-6 py-5">
        <h2 class="text-xl font-semibold text-slate-950">实验报告提交提醒</h2>
        <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          <span>发件人：系统通知</span>
          <span>收件人：admin</span>
          <span>今天 14:21</span>
        </div>
      </div>

      <div class="space-y-5 px-6 py-5 text-sm leading-7 text-slate-700">
        <p>您好，请注意本周五之前提交实验报告。附件区域会展示邮件携带的文件。</p>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div class="text-sm font-medium text-slate-900">实验报告模板.pdf</div>
          <div class="mt-1 text-xs text-slate-500">204 KB · PDF 附件</div>
        </div>
      </div>
    </article>

    <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div class="text-sm font-semibold text-slate-950">AI 分析</div>
      <div class="mt-4 space-y-3 text-sm">
        <div class="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">风险等级：安全</div>
        <div class="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">优先级：中</div>
        <p class="text-xs leading-6 text-slate-500">后续会在这里展示摘要、风险原因和回复建议。</p>
      </div>
    </aside>
  </div>
</template>
