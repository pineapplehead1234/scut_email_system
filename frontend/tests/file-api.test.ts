import { beforeEach, describe, expect, it, vi } from 'vitest'

import fileApi from '../src/api/file'

const mocks = vi.hoisted(() => ({
  blob: vi.fn(),
  upload: vi.fn(),
}))

vi.mock('../src/api/http', () => ({
  default: {
    blob: mocks.blob,
    upload: mocks.upload,
  },
}))

describe('fileApi', () => {
  beforeEach(() => {
    mocks.blob.mockReset()
    mocks.upload.mockReset()
  })

  it('uploads a file as multipart form data', async () => {
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })
    mocks.upload.mockResolvedValue({ fileId: 'file_1' })

    await expect(fileApi.upload(file)).resolves.toEqual({ fileId: 'file_1' })

    expect(mocks.upload).toHaveBeenCalledWith('/api/files', expect.any(FormData))
    expect((mocks.upload.mock.calls[0][1] as FormData).get('file')).toBe(file)
  })

  it('downloads a file as blob with encoded fileId', async () => {
    const blob = new Blob(['report'], { type: 'application/pdf' })
    mocks.blob.mockResolvedValue(blob)

    await expect(fileApi.download('file 1')).resolves.toBe(blob)

    expect(mocks.blob).toHaveBeenCalledWith('/api/files/file%201/download')
  })
})
