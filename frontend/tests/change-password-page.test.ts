import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChangePasswordPage from '../src/pages/settings/ChangePasswordPage.vue'

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
}))

vi.mock('../src/api/user', () => ({
  default: {
    changePassword: mocks.changePassword,
  },
}))

async function mountChangePasswordPage() {
  const wrapper = mount(ChangePasswordPage, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })

  await flushPromises()

  return wrapper
}

async function submitPasswordForm(
  wrapper: Awaited<ReturnType<typeof mountChangePasswordPage>>,
  values: {
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  },
) {
  if (values.currentPassword !== undefined) {
    await wrapper.get('[data-test="password-current"]').setValue(values.currentPassword)
  }
  if (values.newPassword !== undefined) {
    await wrapper.get('[data-test="password-new"]').setValue(values.newPassword)
  }
  if (values.confirmPassword !== undefined) {
    await wrapper.get('[data-test="password-confirm"]').setValue(values.confirmPassword)
  }

  await wrapper.get('[data-test="password-submit"]').trigger('click')
  await flushPromises()
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    mocks.changePassword.mockReset()
    mocks.changePassword.mockResolvedValue(true)
  })

  it('does not submit when current password is empty', async () => {
    const wrapper = await mountChangePasswordPage()

    await submitPasswordForm(wrapper, {
      newPassword: 'new-pass-123',
      confirmPassword: 'new-pass-123',
    })

    expect(mocks.changePassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请输入当前密码')
  })

  it('does not submit when new password is shorter than 8 characters', async () => {
    const wrapper = await mountChangePasswordPage()

    await submitPasswordForm(wrapper, {
      currentPassword: 'old-pass',
      newPassword: 'short',
      confirmPassword: 'short',
    })

    expect(mocks.changePassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('新密码至少 8 位')
  })

  it('does not submit when confirmation differs from the new password', async () => {
    const wrapper = await mountChangePasswordPage()

    await submitPasswordForm(wrapper, {
      currentPassword: 'old-pass',
      newPassword: 'new-pass-123',
      confirmPassword: 'other-pass-123',
    })

    expect(mocks.changePassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('两次输入的新密码不一致')
  })

  it('submits the mapped payload and clears the form after success', async () => {
    const wrapper = await mountChangePasswordPage()

    await submitPasswordForm(wrapper, {
      currentPassword: 'old-pass',
      newPassword: 'new-pass-123',
      confirmPassword: 'new-pass-123',
    })

    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      newPassword: 'new-pass-123',
    })
    expect((wrapper.get('[data-test="password-current"]').element as HTMLInputElement).value)
      .toBe('')
    expect((wrapper.get('[data-test="password-new"]').element as HTMLInputElement).value)
      .toBe('')
    expect((wrapper.get('[data-test="password-confirm"]').element as HTMLInputElement).value)
      .toBe('')
  })
})
