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
      ':mailId',
    ])

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
})
