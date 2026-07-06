import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ComposePage from '../src/pages/mail/ComposePage.vue'
import { refreshMailStatisticsKey } from '../src/pages/mail/mail-statistics-context'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  send: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    upload: mocks.upload,
    download: vi.fn(),
  },
}))

vi.mock('../src/api/email', () => ({
  default: {
    send: mocks.send,
  },
}))

vi.mock('../src/components/mail/RichTextEditor.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <textarea
        data-test="composer-content"
        :value="modelValue?.map(node => node.children?.map(child => child.text || '').join('')).join('\\n\\n') || ''"
        @input="$emit('update:modelValue', $event.target.value.split(/\\n{2,}/).filter(Boolean).map(text => ({ type: 'paragraph', children: [{ type: 'text', text: text.trim() }] })))"
      />
    `,
  },
}))

async function mountComposePage(refreshMailStatistics = vi.fn()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/mail/compose',
        component: ComposePage,
      },
      {
        path: '/mail/thread/:threadId',
        component: { template: '<div />' },
      },
    ],
  })

  await router.push('/mail/compose')
  await router.isReady()

  const wrapper = mount(ComposePage, {
    global: {
      plugins: [ElementPlus, router],
      provide: {
        [refreshMailStatisticsKey as symbol]: refreshMailStatistics,
      },
    },
  })

  return { refreshMailStatistics, router, wrapper }
}

describe('ComposePage', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.send.mockReset()
    mocks.upload.mockResolvedValue({ fileId: 'file_1' })
    mocks.send.mockResolvedValue({ mailId: 1001, threadId: 2001 })
  })

  it('sends an email and navigates to the created thread', async () => {
    const { refreshMailStatistics, router, wrapper } = await mountComposePage()
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('teacher')
    await inputs[1].setValue('Lab report')
    await wrapper.get('[data-test="composer-content"]').setValue('Please review.\n\nThanks.')
    await wrapper.get('[data-test="compose-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.send).toHaveBeenCalledWith({
      to: 'teacher',
      subject: 'Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Please review.' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Thanks.' }],
        },
      ],
    })
    expect(refreshMailStatistics).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/mail/thread/2001')
  })

  it('does not send when required fields are empty', async () => {
    const { wrapper } = await mountComposePage()

    await wrapper.get('[data-test="compose-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.send).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('收件人、主题和正文不能为空')
  })

  it('uploads an attachment and includes attachmentFileId when sending', async () => {
    const { wrapper } = await mountComposePage()
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })
    const attachmentInput = wrapper.get('[data-test="attachment-input"]')
    Object.defineProperty(attachmentInput.element, 'files', {
      configurable: true,
      value: [file],
    })

    await attachmentInput.trigger('change')
    await flushPromises()

    expect(mocks.upload).toHaveBeenCalledWith(file)
    expect(wrapper.text()).toContain('report.pdf')

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('teacher')
    await inputs[1].setValue('Lab report')
    await wrapper.get('[data-test="composer-content"]').setValue('Please review.')
    await wrapper.get('[data-test="compose-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.send).toHaveBeenCalledWith({
      to: 'teacher',
      subject: 'Lab report',
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Please review.' }],
        },
      ],
      attachmentFileId: 'file_1',
    })
  })
})
