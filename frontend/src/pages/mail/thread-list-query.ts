import type { LocationQuery } from 'vue-router'

import type { Priority, ReadStatus, ThreadQueryParams } from '../../api/type'
import { readEnum, readPositiveInteger, readString } from './query-readers'

const readStatuses: ReadStatus[] = ['ALL', 'READ', 'UNREAD']
const priorities: Priority[] = ['HIGH', 'MEDIUM', 'LOW']

export function toThreadListQuery(query: LocationQuery): ThreadQueryParams {
  const params: ThreadQueryParams = {}
  const page = readPositiveInteger(query.page)
  const size = readPositiveInteger(query.size)
  const keyword = readString(query.keyword)
  const senderUsername = readString(query.senderUsername)
  const startTime = readString(query.startTime)
  const endTime = readString(query.endTime)
  const readStatus = readEnum(query.readStatus, readStatuses)
  const priority = readEnum(query.priority, priorities)

  if (page) params.page = page
  if (size) params.size = size
  if (keyword) params.keyword = keyword
  if (readStatus) params.readStatus = readStatus
  if (senderUsername) params.senderUsername = senderUsername
  if (priority) params.priority = priority
  if (startTime) params.startTime = startTime
  if (endTime) params.endTime = endTime

  return params
}
