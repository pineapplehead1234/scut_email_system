import http from './http'
import type {
  DeleteMailData,
  MailDetailVO,
  MailFolder,
  MailPageData,
  MailQueryParams,
  MailStatisticsVO,
  ReadMailData,
  ReadMailRequest,
  RestoreMailData,
  RetryAnalysisData,
  SendMailData,
  SendMailRequest,
} from './type'

const folderPathMap: Record<MailFolder, string> = {
  inbox: '/api/mails/inbox',
  sent: '/api/mails/sent',
  trash: '/api/mails/trash',
  spam: '/api/mails/spam',
}

const mailApi = {
  send(data: SendMailRequest) {
    return http.post<SendMailData, SendMailRequest>('/api/mails', data)
  },

  list(folder: MailFolder, params?: MailQueryParams) {
    return http.get<MailPageData>(folderPathMap[folder], { params })
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
