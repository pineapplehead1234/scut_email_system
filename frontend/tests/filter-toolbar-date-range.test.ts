import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import MailFilterToolbar from '../src/components/mail/MailFilterToolbar.vue'
import ThreadFilterToolbar from '../src/components/mail/ThreadFilterToolbar.vue'

const DatePickerStub = defineComponent({
  name: 'ElDatePicker',
  props: {
    modelValue: {
      type: [Array, String, Date, Object],
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  template: `
    <button
      type="button"
      @click="$emit('update:modelValue', ['2026-05-01T00:00:00', '2026-05-31T23:59:59'])"
    />
  `,
})

describe('filter toolbar date ranges', () => {
  it('uses an Element Plus date range picker for mail filters', async () => {
    const wrapper = mount(MailFilterToolbar, {
      props: {
        folder: 'SPAM',
      },
      global: {
        plugins: [ElementPlus],
        stubs: {
          ElDatePicker: DatePickerStub,
        },
      },
    })

    expect(wrapper.find('[data-test="mail-filter-start-time"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="mail-filter-end-time"]').exists()).toBe(false)

    await wrapper.get('[data-test="mail-filter-date-range"]').trigger('click')
    await wrapper.get('[data-test="mail-filter-search"]').trigger('click')

    expect(wrapper.emitted('search')?.[0]).toEqual([
      {
        keyword: undefined,
        senderUsername: undefined,
        recipientUsername: undefined,
        readStatus: undefined,
        priority: undefined,
        spamLevel: undefined,
        riskLevel: undefined,
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59',
      },
    ])
  })

  it('uses an Element Plus date range picker for thread filters', async () => {
    const wrapper = mount(ThreadFilterToolbar, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          ElDatePicker: DatePickerStub,
        },
      },
    })

    expect(wrapper.find('[data-test="thread-filter-start-time"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="thread-filter-end-time"]').exists()).toBe(false)

    await wrapper.get('[data-test="thread-filter-date-range"]').trigger('click')
    await wrapper.get('[data-test="thread-filter-search"]').trigger('click')

    expect(wrapper.emitted('search')?.[0]).toEqual([
      {
        keyword: undefined,
        readStatus: undefined,
        senderUsername: undefined,
        priority: undefined,
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59',
      },
    ])
  })
})
