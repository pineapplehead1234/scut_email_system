import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AttachmentUploader from '../src/components/mail/AttachmentUploader.vue'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    upload: mocks.upload,
  },
}))

async function chooseFile(wrapper: ReturnType<typeof mount>, file: File) {
  const input = wrapper.get('[data-test="attachment-input"]')
  Object.defineProperty(input.element, 'files', {
    configurable: true,
    value: [file],
  })
  await input.trigger('change')
  await flushPromises()
}

describe('AttachmentUploader', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.upload.mockResolvedValue({ fileId: 'file_1' })
  })

  it('uploads a supported file and emits attachment metadata', async () => {
    const wrapper = mount(AttachmentUploader, {
      global: {
        plugins: [ElementPlus],
      },
    })
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })

    await chooseFile(wrapper, file)

    expect(mocks.upload).toHaveBeenCalledWith(file)
    expect(wrapper.emitted('uploaded')?.[0]).toEqual([
      {
        fileId: 'file_1',
        originalFilename: 'report.pdf',
        contentType: 'application/pdf',
        fileSize: file.size,
        downloadUrl: '/api/files/file_1/download',
      },
    ])
  })

  it('rejects unsupported file types before uploading', async () => {
    const wrapper = mount(AttachmentUploader, {
      global: {
        plugins: [ElementPlus],
      },
    })
    const file = new File(['script'], 'script.exe', {
      type: 'application/octet-stream',
    })

    await chooseFile(wrapper, file)

    expect(mocks.upload).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('文件类型不支持')
  })
})
