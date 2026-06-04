import { describe, expect, it } from 'vitest'

import { routes } from '../src/router'

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
})
