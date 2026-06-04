<template>
  <main class="flex min-h-screen items-center justify-center bg-[#eef3f8] px-4">
    <section class="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div
        class="mb-5 flex size-11 items-center justify-center rounded-lg bg-[#185c68] text-sm font-semibold text-white"
      >
        MS
      </div>
      <h1 class="text-xl font-semibold text-slate-950">登录 Mail System</h1>
      <p class="mt-2 text-sm text-slate-500">使用站内账号进入邮件工作台。</p>

      <div class="mt-6 space-y-3">
        <el-input placeholder="用户名" />
        <el-input placeholder="密码" type="password" show-password />
        <el-button class="w-full" type="primary">登录</el-button>
      </div>
    </section>
  </main>
</template>
