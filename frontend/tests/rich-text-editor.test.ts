import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RichTextEditor from '../src/components/mail/RichTextEditor.vue'
import type { RichTextNode } from '../src/api/type'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    upload: mocks.upload,
    download: vi.fn(),
  },
}))

describe('RichTextEditor', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.upload.mockResolvedValue({ fileId: 'file_image_1' })
  })

  it('renders rich text toolbar and contextual formatting menu controls', () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: [],
      },
    })

    expect(wrapper.find('[data-test="rich-editor-toolbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-bubble-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-bold"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-italic"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-underline"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-bullet-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rich-editor-ordered-list"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="rich-editor-bullet-list"]').text()).toBe('•')
    expect(wrapper.get('[data-test="rich-editor-ordered-list"]').text()).toBe('1.')
  })

  it('uploads an inline image and emits a RichTextNode image resource', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: '正文' }],
          },
        ] satisfies RichTextNode[],
      },
    })
    const image = new File(['image'], 'inline.png', { type: 'image/png' })
    const input = wrapper.get('[data-test="rich-editor-image-input"]')

    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [image],
    })

    await input.trigger('change')
    await flushPromises()

    expect(mocks.upload).toHaveBeenCalledWith(image)
    const updates = wrapper.emitted('update:modelValue')
    const latest = updates?.[updates.length - 1]?.[0] as RichTextNode[]

    expect(latest).toContainEqual({
      type: 'paragraph',
      children: [{ type: 'image', resourceId: 'file_image_1' }],
    })
  })

  it('rejects non-image files for inline image insertion', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: [],
      },
    })
    const pdf = new File(['pdf'], 'report.pdf', { type: 'application/pdf' })
    const input = wrapper.get('[data-test="rich-editor-image-input"]')

    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [pdf],
    })

    await input.trigger('change')
    await flushPromises()

    expect(mocks.upload).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('正文图片只支持 png、jpg、jpeg')
  })
})
