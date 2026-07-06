import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MailComposer from '../src/components/mail/MailComposer.vue'
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

vi.mock('../src/components/mail/RichTextEditor.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <textarea
        data-test="composer-content"
        :value="modelValue?.[0]?.children?.[0]?.text || ''"
        @input="$emit('update:modelValue', [{ type: 'paragraph', children: [{ type: 'text', text: $event.target.value }] }])"
      />
    `,
  },
}))

const content: RichTextNode[] = [
  {
    type: 'paragraph',
    children: [{ type: 'text', text: 'Please review.' }],
  },
]

describe('MailComposer', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.upload.mockResolvedValue({ fileId: 'file_1' })
  })

  it('validates required fields before submitting', async () => {
    const wrapper = mount(MailComposer, {
      props: {
        recipientUsername: '',
        subject: '',
        content: [],
        attachment: null,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    await wrapper.get('[data-test="composer-submit"]').trigger('click')

    expect(wrapper.text()).toContain('收件人、主题和正文不能为空')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('uploads an attachment and emits a shared composer payload', async () => {
    const wrapper = mount(MailComposer, {
      props: {
        recipientUsername: 'teacher',
        subject: 'Lab report',
        content,
        attachment: null,
      },
      global: {
        plugins: [ElementPlus],
      },
    })
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })

    const attachmentInput = wrapper.get('[data-test="attachment-input"]')
    Object.defineProperty(attachmentInput.element, 'files', {
      configurable: true,
      value: [file],
    })

    await attachmentInput.trigger('change')
    await flushPromises()

    expect(mocks.upload).toHaveBeenCalledWith(file)
    expect(wrapper.emitted('update:attachment')?.[0]).toEqual([
      {
        fileId: 'file_1',
        originalFilename: 'report.pdf',
        contentType: 'application/pdf',
        fileSize: 6,
        downloadUrl: '/api/files/file_1/download',
      },
    ])

    await wrapper.setProps({
      attachment: {
        fileId: 'file_1',
        originalFilename: 'report.pdf',
        contentType: 'application/pdf',
        fileSize: 6,
        downloadUrl: '/api/files/file_1/download',
      },
    })
    await wrapper.get('[data-test="composer-submit"]').trigger('click')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      {
        recipientUsername: 'teacher',
        subject: 'Lab report',
        content,
        attachmentFileId: 'file_1',
      },
    ])
  })
})
