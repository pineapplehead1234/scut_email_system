import http from './http'
import type {
  ThreadDetailQueryParams,
  ThreadDetailVO,
  ThreadPageData,
  ThreadQueryParams,
  ThreadReplyTextData,
} from './type'

const threadApi = {
  list(params: ThreadQueryParams) {
    return http.get<ThreadPageData>('/api/threads', { params })
  },

  detail(threadId: number | string, params?: ThreadDetailQueryParams) {
    return http.get<ThreadDetailVO>(`/api/threads/${threadId}`, { params })
  },

  replyText(threadId: number | string) {
    return http.get<ThreadReplyTextData>(
      `/api/threads/${threadId}/reply-text`,
    )
  },
}

export default threadApi
