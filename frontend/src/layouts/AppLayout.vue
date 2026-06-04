<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Delete,
  EditPen,
  FolderOpened,
  Lock,
  Message,
  Promotion,
  Refresh,
  Search,
  Setting,
  SwitchButton,
  User,
  WarningFilled,
} from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'

type SidebarItem = {
  label: string
  to: string
  icon: Component
  count?: number
  tone?: 'normal' | 'danger'
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => String(route.meta.title || '邮件系统'))

const folderItems: SidebarItem[] = [
  {
    label: '收件箱',
    to: '/mail/inbox',
    icon: Message,
    count: 12,
  },
  {
    label: '已发送',
    to: '/mail/sent',
    icon: Promotion,
    count: 8,
  },
  {
    label: '已删除',
    to: '/mail/trash',
    icon: Delete,
    count: 2,
  },
  {
    label: '垃圾邮箱',
    to: '/mail/spam',
    icon: WarningFilled,
    count: 1,
    tone: 'danger',
  },
]

function isActive(path: string) {
  return route.path === path
}

function openSettings() {
  router.push('/settings')
}

function openPasswordSettings() {
  router.push('/settings/password')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
    <aside class="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-[#fbfcff]">
      <div class="px-5 pb-4 pt-5">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-lg bg-[#185c68] text-sm font-semibold text-white shadow-sm"
          >
            MS
          </div>
          <div class="min-w-0">
            <div class="truncate text-base font-semibold tracking-wide text-slate-950">
              Mail System
            </div>
            <div class="mt-0.5 text-xs text-slate-500">站内邮件工作台</div>
          </div>
        </div>
      </div>

      <div class="px-4 pb-4">
        <RouterLink
          to="/mail/compose"
          class="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#185c68] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#124b55] focus:outline-none focus:ring-2 focus:ring-[#185c68]/30"
          :class="{ 'bg-[#124b55]': isActive('/mail/compose') }"
        >
          <el-icon>
            <EditPen />
          </el-icon>
          <span>写邮件</span>
        </RouterLink>
      </div>

      <nav class="min-h-0 flex-1 overflow-auto px-3">
        <div class="mb-2 flex items-center justify-between px-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            文件夹
          </span>
          <el-icon class="text-slate-400">
            <FolderOpened />
          </el-icon>
        </div>

        <div class="space-y-1">
          <RouterLink
            v-for="item in folderItems"
            :key="item.to"
            :to="item.to"
            class="group flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition"
            :class="
              isActive(item.to)
                ? 'bg-[#e4f2f3] text-[#124b55]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            "
          >
            <el-icon
              class="text-base"
              :class="
                item.tone === 'danger' && !isActive(item.to)
                  ? 'text-rose-500'
                  : 'text-inherit'
              "
            >
              <component :is="item.icon" />
            </el-icon>
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            <span
              v-if="item.count !== undefined"
              class="min-w-6 rounded-full px-2 py-0.5 text-center text-xs"
              :class="
                item.tone === 'danger'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-white'
              "
            >
              {{ item.count }}
            </span>
          </RouterLink>
        </div>
      </nav>

      <div class="border-t border-slate-200 p-3">
        <el-dropdown trigger="click" placement="top-start">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-[#9ac7cd] hover:shadow"
          >
            <el-avatar :size="38" class="bg-[#d7ecef] text-[#124b55]">
              {{ authStore.user.avatarText }}
            </el-avatar>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-slate-950">
                {{ authStore.displayName }}
              </span>
              <span class="block truncate text-xs text-slate-500">
                {{ authStore.user.username }}
              </span>
            </span>
          </button>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="User" disabled>
                {{ authStore.user.emailAddress }}
              </el-dropdown-item>
              <el-dropdown-item :icon="Setting" @click="openSettings">
                设置
              </el-dropdown-item>
              <el-dropdown-item :icon="Lock" @click="openPasswordSettings">
                修改密码
              </el-dropdown-item>
              <el-dropdown-item divided :icon="SwitchButton" @click="logout">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/85 px-7 backdrop-blur"
      >
        <div>
          <h1 class="text-lg font-semibold text-slate-950">{{ pageTitle }}</h1>
          <p class="mt-0.5 text-xs text-slate-500">站内消息、附件与 AI 分析统一处理</p>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Search" circle />
          <el-button :icon="Refresh" circle />
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-auto px-7 py-6">
        <RouterView />
      </main>
    </section>
  </div>
</template>
