import type { LocationQuery } from 'vue-router'

import type {
  MailListQueryParams,
  Priority,
  ReadStatus,
  RiskLevel,
  SpamLevel,
} from '../../api/type'
import { readEnum, readPositiveInteger, readString } from './query-readers'

const readStatuses: ReadStatus[] = ['ALL', 'READ', 'UNREAD']
const priorities: Priority[] = ['HIGH', 'MEDIUM', 'LOW']
const spamLevels: SpamLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH']
const riskLevels: RiskLevel[] = ['SAFE', 'LOW', 'MEDIUM', 'HIGH']

export function toMailListQuery(query: LocationQuery): MailListQueryParams {
  const params: MailListQueryParams = {}
  const page = readPositiveInteger(query.page)
  const size = readPositiveInteger(query.size)
  const keyword = readString(query.keyword)
  const senderUsername = readString(query.senderUsername)
  const recipientUsername = readString(query.recipientUsername)
  const startTime = readString(query.startTime)
  const endTime = readString(query.endTime)
  const readStatus = readEnum(query.readStatus, readStatuses)
  const priority = readEnum(query.priority, priorities)
  const spamLevel = readEnum(query.spamLevel, spamLevels)
  const riskLevel = readEnum(query.riskLevel, riskLevels)

  if (page) params.page = page
  if (size) params.size = size
  if (keyword) params.keyword = keyword
  if (readStatus) params.readStatus = readStatus
  if (senderUsername) params.senderUsername = senderUsername
  if (recipientUsername) params.recipientUsername = recipientUsername
  if (priority) params.priority = priority
  if (spamLevel) params.spamLevel = spamLevel
  if (riskLevel) params.riskLevel = riskLevel
  if (startTime) params.startTime = startTime
  if (endTime) params.endTime = endTime

  return params
}
