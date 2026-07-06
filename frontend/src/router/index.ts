import type { RouteRecordRaw } from 'vue-router'
import {
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
} from 'vue-router'

import { setUnauthorizedHandler } from '../api/http'
import AppLayout from '../layouts/AppLayout.vue'
import AuthPage from '../pages/auth/AuthPage.vue'
import ComposePage from '../pages/mail/ComposePage.vue'
import MailListPage from '../pages/mail/MailListPage.vue'
import ThreadDetailPage from '../pages/mail/ThreadDetailPage.vue'
import ThreadListPage from '../pages/mail/ThreadListPage.vue'
import ChangePasswordPage from '../pages/settings/ChangePasswordPage.vue'
import SettingsPage from '../pages/settings/SettingsPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/mail/inbox',
  },
  {
    path: '/login',
    name: 'login',
    component: AuthPage,
    meta: {
      public: true,
      title: '登录',
    },
  },
  {
    path: '/mail',
    component: AppLayout,
    redirect: '/mail/inbox',
    children: [
      {
        path: 'inbox',
        name: 'mail-inbox',
        component: ThreadListPage,
        meta: {
          title: '收件箱',
          folder: 'INBOX',
        },
      },
      {
        path: 'sent',
        name: 'mail-sent',
        component: MailListPage,
        meta: {
          title: '已发送',
          folder: 'SENT',
        },
      },
      {
        path: 'trash',
        name: 'mail-trash',
        component: MailListPage,
        meta: {
          title: '已删除',
          folder: 'TRASH',
        },
      },
      {
        path: 'spam',
        name: 'mail-spam',
        component: MailListPage,
        meta: {
          title: '垃圾邮件',
          folder: 'SPAM',
        },
      },
      {
        path: 'compose',
        name: 'mail-compose',
        component: ComposePage,
        meta: {
          title: '写邮件',
        },
      },
      {
        path: 'thread/:threadId',
        name: 'mail-thread-detail',
        component: ThreadDetailPage,
        meta: {
          title: '邮件线程详情',
        },
      },
    ],
  },
  {
    path: '/settings',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'settings',
        component: SettingsPage,
        meta: {
          title: '设置',
        },
      },
      {
        path: 'password',
        name: 'settings-password',
        component: ChangePasswordPage,
        meta: {
          title: '修改密码',
        },
      },
    ],
  },
]

function hasToken() {
  return Boolean(localStorage.getItem('mail_token'))
}

function installAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const loggedIn = hasToken()

    if (!to.meta.public && !loggedIn) {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.path === '/login' && loggedIn) {
      return '/mail/inbox'
    }

    return true
  })

  setUnauthorizedHandler(() => {
    const currentRoute = router.currentRoute.value

    if (currentRoute.path === '/login') {
      return
    }

    router.push({
      path: '/login',
      query: {
        redirect: currentRoute.fullPath,
      },
    })
  })
}

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
  })

  installAuthGuard(router)

  return router
}

const router = createAppRouter()

export default router
