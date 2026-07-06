import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InlineImageRenderer from '../src/components/mail/InlineImageRenderer.vue'

const mocks = vi.hoisted(() => ({
  createObjectUrl: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    createObjectUrl: mocks.createObjectUrl,
  },
}))

describe('InlineImageRenderer', () => {
  beforeEach(() => {
    mocks.createObjectUrl.mockReset()
  })

  it('loads an inline image blob url by resourceId', async () => {
    mocks.createObjectUrl.mockResolvedValue('blob:test-image')

    const wrapper = mount(InlineImageRenderer, {
      props: {
        resourceId: 'file_image',
      },
    })
    await flushPromises()

    expect(mocks.createObjectUrl).toHaveBeenCalledWith('file_image')
    expect(wrapper.get('img').attributes('src')).toBe('blob:test-image')
  })

  it('shows a placeholder when image loading fails', async () => {
    mocks.createObjectUrl.mockRejectedValue(new Error('download failed'))

    const wrapper = mount(InlineImageRenderer, {
      props: {
        resourceId: 'file_image',
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('图片加载失败')
  })
})
