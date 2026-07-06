import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import { createAppRouter, routes } from '../src/router'

describe('app routes', () => {
  it('defines the primary authenticated and public routes', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '/',
      '/login',
      '/mail',
      '/settings',
    ])

    const mailRoute = routes.find((route) => route.path === '/mail')

    expect(mailRoute?.children?.map((route) => route.path)).toEqual([
      'inbox',
      'sent',
      'trash',
      'spam',
      'compose',
      'thread/:threadId',
    ])

    expect(mailRoute?.children?.map((route) => route.name)).not.toContain(
      'mail-detail',
    )
    expect(
      mailRoute?.children
        ?.filter((route) => String(route.name).startsWith('mail-'))
        .map((route) => route.meta?.folder)
        .filter(Boolean),
    ).toEqual(['INBOX', 'SENT', 'TRASH', 'SPAM'])

    const [inboxRoute, sentRoute, trashRoute, spamRoute] =
      mailRoute?.children || []

    expect(inboxRoute.component).not.toBe(sentRoute.component)
    expect(sentRoute.component).toBe(trashRoute.component)
    expect(trashRoute.component).toBe(spamRoute.component)

    const settingsRoute = routes.find((route) => route.path === '/settings')

    expect(settingsRoute?.children?.map((route) => route.path)).toEqual([
      '',
      'password',
    ])
  })

  it('redirects anonymous users from authenticated pages to login', async () => {
    localStorage.clear()
    const router = createAppRouter(createMemoryHistory())

    await router.push('/mail/inbox')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/mail/inbox')
  })

  it('redirects logged-in users away from login', async () => {
    localStorage.setItem('mail_token', 'token-123')
    const router = createAppRouter(createMemoryHistory())

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/mail/inbox')
  })

  it('does not register a standalone mailId detail route', async () => {
    localStorage.setItem('mail_token', 'token-123')
    const router = createAppRouter(createMemoryHistory())

    await router.push('/mail/1001')
    await router.isReady()

    expect(router.currentRoute.value.name).not.toBe('mail-detail')
    expect(router.currentRoute.value.matched.map((record) => record.path)).not.toContain(
      '/mail/:mailId',
    )
  })
})
