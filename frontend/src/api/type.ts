export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type ErrorResponse = ApiResponse<null>

export type RegisterRequest = {
  username: string
  password: string
  nickname?: string
}

export type RegisterData = {
  username: string
  nickname: string
}

export type LoginRequest = {
  username: string
  password: string
}

export type LoginUser = {
  username: string
  nickname: string
  emailAddress: string
}

export type LoginData = {
  token: string
  user: LoginUser
}

export type CurrentUserVO = LoginUser & {
  avatarText: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type Provider = 'qwen' | 'openai' | 'deepseek' | 'kimi' | 'glm' | 'siliconflow' | 'custom'

export type UserSettingsVO = {
  aiEnabled: boolean
  autoReplyEnabled: boolean
  prioritySortEnabled: boolean
  modelConfigured: boolean
  provider: Provider | null
  modelName: string | null
  baseUrl: string | null
  apiKeyConfigured: boolean
  maskedApiKey: string | null
  timeoutMs: number
  maxTokens: number
  temperature: number
}

export type UpdateUserSettingsRequest = {
  aiEnabled: boolean
  autoReplyEnabled: boolean
  prioritySortEnabled: boolean
  provider: Provider | null
  modelName: string | null
  baseUrl: string | null
  apiKey?: string
  timeoutMs: number
  maxTokens: number
  temperature: number
}

export type RichTextNode = {
  type: 'paragraph' | 'text' | 'link' | 'image' | 'ul' | 'ol' | 'li'
  text?: string
  href?: string
  resourceId?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  children?: RichTextNode[]
}

export type UserBrief = {
  username: string
  nickname: string
  emailAddress: string
  avatarText: string
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type SpamLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH'
export type AnalysisStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'DISABLED'

export type FileUploadData = {
  fileId: string
}

export type ReadStatus = 'ALL' | 'READ' | 'UNREAD'

export type MailFolder = 'INBOX' | 'SENT' | 'TRASH' | 'SPAM'
export type ThreadFolder = MailFolder

export type ThreadQueryParams = {
  page?: number
  size?: number
  keyword?: string
  readStatus?: ReadStatus
  senderUsername?: string
  priority?: Priority
  startTime?: string
  endTime?: string
}

export type MailListQueryParams = {
  page?: number
  size?: number
  keyword?: string
  readStatus?: ReadStatus
  senderUsername?: string
  recipientUsername?: string
  priority?: Priority
  spamLevel?: SpamLevel
  riskLevel?: RiskLevel
  startTime?: string
  endTime?: string
}

export type ThreadDetailQueryParams = {
  cursor?: string
  limit?: number
}

export type ThreadListItemVO = {
  threadId: number
  subject: string
  lastSnippet: string
  lastMail: Record<string, unknown>
  unreadCount: number
  mailCount: number
  updatedAt: string
  priority: Priority
  priorityLabel: string
  spam: boolean
  spamLevel: SpamLevel
  riskLevel: RiskLevel
  riskLabel: string
  analysisStatus: AnalysisStatus
  riskReason: string | null
}

export type ThreadPageData = {
  page: number
  size: number
  total: number
  totalPages: number
  records: ThreadListItemVO[]
}

export type MailItemVO = {
  mailId: number
  threadId: number
  replyToMailId: number | null
  subject: string
  content: RichTextNode[]
  sender: UserBrief
  recipient: UserBrief
  sentAt: string
  priority?: Priority
  priorityLabel?: string
  spam?: boolean
  spamLevel?: SpamLevel
  spamLevelLabel?: string | null
  riskLevel?: RiskLevel
  riskLabel?: string
  riskReason?: string | null
  analysisStatus?: AnalysisStatus
  attachment?: MailAttachmentVO
}

export type ThreadAnalysisVO = {
  analysisStatus: AnalysisStatus
  summary: string
  spamLevel: SpamLevel
  spamLevelLabel: string
  spamReason: string
  riskLevel: RiskLevel
  riskLabel: string
  riskReason: string
  priority: Priority
  priorityLabel: string
  priorityReason: string
  replySuggestions: string[]
}

export type ThreadDetailVO = {
  threadId: number
  subject: string
  total: number
  limit: number
  nextCursor: string | null
  hasMore: boolean
  analysis?: ThreadAnalysisVO | null
  mails: MailItemVO[]
}

export type ThreadReplyTextData = {
  threadId: number
  sourceMailId: number
  replyText: string
}

export type MailAnalysisVO = {
  priority: Priority
  priorityLabel: string
  spam: boolean
  spamLevel: SpamLevel
  riskLevel: RiskLevel
  riskLabel: string
  riskReason: string | null
  analysisStatus: AnalysisStatus
}

export type MailAttachmentVO = {
  fileId: string
  originalFilename: string
  contentType: string
  fileSize: number
  downloadUrl: string
} | null

export type UserMailRole = 'SENDER' | 'RECIPIENT'

export type MailListItemVO = {
  mailId: number
  threadId: number
  replyToMailId: number | null
  subject: string
  snippet: string
  sender: UserBrief
  recipient: UserBrief
  sentAt: string
  read: boolean | null
  priority: Priority
  priorityLabel: string
  spam: boolean
  spamLevel: SpamLevel
  riskLevel: RiskLevel
  riskLabel: string
  analysisStatus: AnalysisStatus
  deletedAt?: string | null
  spamLevelLabel?: string | null
  riskReason?: string | null
}

export type MailPageData = {
  page: number
  size: number
  total: number
  totalPages: number
  records: MailListItemVO[]
}

export type MailDetailVO = {
  mailId: number
  subject: string
  content: RichTextNode[]
  sender: UserBrief
  recipient: UserBrief
  sentAt: string
  currentUserRole: UserMailRole
  read: boolean
  deleted: boolean
  spam: boolean
  analysis: MailAnalysisVO
  attachment: MailAttachmentVO
}

export type MailStatisticsVO = {
  inboxTotal: number
  inboxUnread: number
  sentTotal: number
  trashTotal: number
  spamTotal: number
}

export type ReadMailRequest = {
  read: true
}

export type ReadMailData = {
  mailId: number
  read: true
}

export type DeleteMailData = {
  mailId: number
  deleted: boolean
  deletedAt: string
}

export type RestoreMailData = {
  mailId: number
  deleted: boolean
}

export type RetryAnalysisData = {
  mailId: number
  analysisStatus: AnalysisStatus
}

export type SendEmailRequest = {
  to: string
  subject: string
  content: RichTextNode[]
  attachmentFileId?: string
}

export type SendEmailData = {
  mailId: number
  threadId: number
  subject?: string
  sender?: UserBrief
  recipient?: UserBrief
  sentAt?: string
  analysisStatus?: AnalysisStatus
}

export type ReplyEmailRequest = {
  mailId: number
  threadId: number
  content: RichTextNode[]
  subject?: string
  attachmentFileId?: string
}

export type ReplyEmailData = SendEmailData

export type GenerateReplySuggestionRequest = {
  mailId: number
  threadId: number
}

export type GenerateReplySuggestionData = {
  content: RichTextNode[]
}
