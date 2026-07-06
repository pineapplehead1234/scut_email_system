import emailApi from '../../api/email'
import mailApi from '../../api/mail'
import type {
  DeleteMailData,
  ReadMailData,
  ReadMailRequest,
  ReplyEmailData,
  ReplyEmailRequest,
  RestoreMailData,
  RetryAnalysisData,
  SendEmailData,
  SendEmailRequest,
} from '../../api/type'
import type { RefreshMailStatistics } from './mail-statistics-context'

type MailGateway = {
  delete(mailId: number | string): Promise<DeleteMailData>
  markRead(
    mailId: number | string,
    data: ReadMailRequest,
  ): Promise<ReadMailData>
  restore(mailId: number | string): Promise<RestoreMailData>
  retryAnalysis(mailId: number | string): Promise<RetryAnalysisData>
}

type EmailGateway = {
  reply(data: ReplyEmailRequest): Promise<ReplyEmailData>
  send(data: SendEmailRequest): Promise<SendEmailData>
}

type MailboxMutationDependencies = {
  emailGateway?: EmailGateway
  mailGateway?: MailGateway
  refreshMailStatistics?: RefreshMailStatistics
}

async function runMutation<T>(
  operation: () => Promise<T>,
  refreshMailStatistics?: RefreshMailStatistics,
) {
  const result = await operation()
  await refreshMailStatistics?.()

  return result
}

export function createMailboxMutationService({
  emailGateway = emailApi,
  mailGateway = mailApi,
  refreshMailStatistics,
}: MailboxMutationDependencies = {}) {
  return {
    deleteMail(mailId: number | string) {
      return runMutation(
        () => mailGateway.delete(mailId),
        refreshMailStatistics,
      )
    },

    markMailRead(mailId: number | string) {
      return runMutation(
        () => mailGateway.markRead(mailId, { read: true }),
        refreshMailStatistics,
      )
    },

    restoreMail(mailId: number | string) {
      return runMutation(
        () => mailGateway.restore(mailId),
        refreshMailStatistics,
      )
    },

    retryMailAnalysis(mailId: number | string) {
      return runMutation(
        () => mailGateway.retryAnalysis(mailId),
        refreshMailStatistics,
      )
    },

    retryMailAnalyses(mailIds: Array<number | string>) {
      return runMutation(
        () => Promise.all(mailIds.map((mailId) => mailGateway.retryAnalysis(mailId))),
        refreshMailStatistics,
      )
    },

    replyEmail(data: ReplyEmailRequest) {
      return runMutation(() => emailGateway.reply(data), refreshMailStatistics)
    },

    sendEmail(data: SendEmailRequest) {
      return runMutation(() => emailGateway.send(data), refreshMailStatistics)
    },
  }
}
