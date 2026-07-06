import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ThreadAnalysisPanel from '../src/components/mail/ThreadAnalysisPanel.vue'

const analysis = {
  analysisStatus: 'SUCCESS',
  summary: '本线程主要提醒学生提交实验报告。',
  spamLevel: 'NONE',
  spamLevelLabel: '正常',
  spamReason: '未发现垃圾邮件特征。',
  riskLevel: 'SAFE',
  riskLabel: '安全',
  riskReason: '未发现异常链接或敏感风险。',
  priority: 'HIGH',
  priorityLabel: '高优先级',
  priorityReason: '涉及实验报告提交截止时间。',
  replySuggestions: ['收到，我会尽快查看实验报告。'],
} as const

describe('ThreadAnalysisPanel', () => {
  it('renders analysis summary, labels, reasons, and reply suggestions', () => {
    const wrapper = mount(ThreadAnalysisPanel, {
      props: {
        analysis,
        hasMore: false,
        loadedMailCount: 2,
        loading: false,
        reanalyzeAll: false,
      },
    })

    expect(wrapper.text()).toContain('本线程主要提醒学生提交实验报告。')
    expect(wrapper.text()).toContain('高优先级')
    expect(wrapper.text()).toContain('安全')
    expect(wrapper.text()).toContain('正常')
    expect(wrapper.text()).toContain('涉及实验报告提交截止时间。')
    expect(wrapper.text()).toContain('收到，我会尽快查看实验报告。')
  })

  it('emits option updates and run events for AI analysis', async () => {
    const wrapper = mount(ThreadAnalysisPanel, {
      props: {
        analysis: null,
        hasMore: true,
        loadedMailCount: 2,
        loading: false,
        reanalyzeAll: false,
      },
    })

    await wrapper.get('[data-test="reanalyze-all-toggle"]').setValue(true)
    await wrapper.get('[data-test="thread-ai-analysis-run"]').trigger('click')

    expect(wrapper.emitted('update:reanalyzeAll')?.[0]).toEqual([true])
    expect(wrapper.emitted('run-analysis')).toHaveLength(1)
    expect(wrapper.text()).toContain('当前已加载 2 封')
  })
})
