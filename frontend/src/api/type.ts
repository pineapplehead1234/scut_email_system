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

export type Provider = 'DEEPSEEK' | 'OPENAI' | 'CUSTOM'

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

export type UserMailRole = 'SENDER' | 'RECIPIENT'
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type SpamLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH'
export type AnalysisStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export type MailAnalysisVO = {
  summary: string | null
  priority: Priority
  priorityLabel: string
  spamLevel: SpamLevel
  spamLevelLabel?: string
  riskLevel: RiskLevel
  riskLabel: string
  riskReason: string | null
  replySuggestion: string | null
  analysisStatus: AnalysisStatus
}

export type FileAttachmentVO = {
  fileId: string
  originalFilename: string
  contentType: string
  fileSize: number
  downloadUrl: string
}

export type FileUploadData = {
  fileId: string
}

export type SendMailRequest = {
  recipientUsername: string
  subject: string
  content: RichTextNode[]
  attachmentFileId?: string
}

export type SendMailData = {
  mailId: number
}

export type MailListItemVO = {
  mailId: number
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
  riskReason?: string | null
  deletedAt?: string
  spamLevelLabel?: string
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
  attachment: FileAttachmentVO | null
  analysis: MailAnalysisVO
}

export type MailStatisticsVO = {
  inboxTotal: number
  inboxUnread: number
  sentTotal: number
  trashTotal: number
  spamTotal: number
}

export type MailFolder = 'inbox' | 'sent' | 'trash' | 'spam'

export type MailQueryParams = {
  page?: number
  size?: number
  keyword?: string
  read?: boolean
  startTime?: string
  endTime?: string
}

export type DeleteMailData = {
  mailId: number
  deleted: boolean
}

export type ReadMailRequest = {
  read: boolean
}

export type ReadMailData = {
  mailId: number
  read: boolean
}

export type RestoreMailData = {
  mailId: number
  deleted: boolean
}

export type RetryAnalysisData = {
  mailId: number
  analysis: MailAnalysisVO
}
