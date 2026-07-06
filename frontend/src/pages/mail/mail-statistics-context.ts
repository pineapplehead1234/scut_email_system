import type { InjectionKey } from 'vue'

export type RefreshMailStatistics = () => Promise<void> | void

export const refreshMailStatisticsKey: InjectionKey<RefreshMailStatistics> =
  Symbol('refreshMailStatistics')
