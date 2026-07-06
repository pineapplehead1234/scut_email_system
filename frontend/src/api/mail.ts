import http from './http'
import type {
  DeleteMailData,
  MailDetailVO,
  MailFolder,
  MailListQueryParams,
  MailPageData,
  MailStatisticsVO,
  ReadMailData,
  ReadMailRequest,
  RestoreMailData,
  RetryAnalysisData,
} from './type'

const folderEndpoints: Record<MailFolder, string> = {
  INBOX: '/api/mails/inbox',
  SENT: '/api/mails/sent',
  TRASH: '/api/mails/trash',
  SPAM: '/api/mails/spam',
}

const mailApi = {
  list(folder: MailFolder, params?: MailListQueryParams) {
    return http.get<MailPageData>(folderEndpoints[folder], { params })
  },

  detail(mailId: number | string) {
    return http.get<MailDetailVO>(`/api/mails/${mailId}`)
  },

  delete(mailId: number | string) {
    return http.delete<DeleteMailData>(`/api/mails/${mailId}`)
  },

  markRead(mailId: number | string, data: ReadMailRequest) {
    return http.patch<ReadMailData, ReadMailRequest>(
      `/api/mails/${mailId}/read`,
      data,
    )
  },

  restore(mailId: number | string) {
    return http.patch<RestoreMailData>(`/api/mails/${mailId}/restore`)
  },

  statistics() {
    return http.get<MailStatisticsVO>('/api/mails/statistics')
  },

  retryAnalysis(mailId: number | string) {
    return http.post<RetryAnalysisData>(
      `/api/mails/${mailId}/analysis/retry`,
      null,
    )
  },
}

export default mailApi
