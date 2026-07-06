import http from './http'
import type {
  GenerateReplySuggestionData,
  GenerateReplySuggestionRequest,
  ReplyEmailData,
  ReplyEmailRequest,
  SendEmailData,
  SendEmailRequest,
} from './type'

const emailApi = {
  send(data: SendEmailRequest) {
    return http.post<SendEmailData, SendEmailRequest>('/api/emails/send', data)
  },

  reply(data: ReplyEmailRequest) {
    return http.post<ReplyEmailData, ReplyEmailRequest>(
      '/api/emails/reply',
      data,
    )
  },

  generateReplySuggestion(data: GenerateReplySuggestionRequest) {
    return http.post<
      GenerateReplySuggestionData,
      GenerateReplySuggestionRequest
    >('/api/emails/reply/suggestion', data)
  },
}

export default emailApi
