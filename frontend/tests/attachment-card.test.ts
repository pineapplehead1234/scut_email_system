import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AttachmentCard from '../src/components/mail/AttachmentCard.vue'

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  createObjectUrl: vi.fn(),
  revokeObjectUrl: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    download: mocks.download,
  },
}))

const attachment = {
  fileId: 'file_1',
  originalFilename: 'report.pdf',
  contentType: 'application/pdf',
  fileSize: 204800,
  downloadUrl: '/api/files/file_1/download',
}

describe('AttachmentCard', () => {
  beforeEach(() => {
    mocks.download.mockReset()
    mocks.createObjectUrl.mockReset()
    mocks.revokeObjectUrl.mockReset()
    mocks.download.mockResolvedValue(new Blob(['report']))
    mocks.createObjectUrl.mockReturnValue('blob:report')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: mocks.createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: mocks.revokeObjectUrl,
    })
  })

  it('renders attachment metadata and downloads by fileId', async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const wrapper = mount(AttachmentCard, {
      props: {
        attachment,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('report.pdf')
    expect(wrapper.text()).toContain('200 KB')
    expect(wrapper.text()).toContain('application/pdf')

    await wrapper.get('[data-test="attachment-download"]').trigger('click')

    expect(mocks.download).toHaveBeenCalledWith('file_1')
    expect(mocks.createObjectUrl).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(mocks.revokeObjectUrl).toHaveBeenCalledWith('blob:report')
    clickSpy.mockRestore()
  })
})
