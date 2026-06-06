import http from './http'
import type { FileUploadData } from './type'

const fileApi = {
  upload(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return http.upload<FileUploadData>('/api/files', formData)
  },

  download(fileId: string) {
    return http.blob(`/api/files/${encodeURIComponent(fileId)}/download`)
  },

  async createObjectUrl(fileId: string) {
    const blob = await this.download(fileId)

    return URL.createObjectURL(blob)
  },
}

export default fileApi
