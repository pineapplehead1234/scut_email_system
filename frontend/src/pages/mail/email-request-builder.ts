import type {
  MailItemVO,
  ReplyEmailRequest,
  RichTextNode,
  SendEmailRequest,
} from '../../api/type'

export type SendEmailForm = {
  recipientUsername: string
  subject: string
  content: RichTextNode[]
  attachmentFileId?: string | null
}

export type ReplyEmailForm = {
  threadSubject: string
  replyTarget: MailItemVO
  content: RichTextNode[]
  attachmentFileId?: string | null
}

export function buildReplySubject(subject: string) {
  return subject.startsWith('Re:') ? subject : `Re: ${subject}`
}

export function buildSendEmailRequest(form: SendEmailForm): SendEmailRequest {
  const request: SendEmailRequest = {
    to: form.recipientUsername.trim(),
    subject: form.subject.trim(),
    content: form.content,
  }

  if (form.attachmentFileId) {
    request.attachmentFileId = form.attachmentFileId
  }

  return request
}

export function buildReplyEmailRequest(form: ReplyEmailForm): ReplyEmailRequest {
  const request: ReplyEmailRequest = {
    mailId: form.replyTarget.mailId,
    threadId: form.replyTarget.threadId,
    subject: buildReplySubject(form.threadSubject),
    content: form.content,
  }

  if (form.attachmentFileId) {
    request.attachmentFileId = form.attachmentFileId
  }

  return request
}
