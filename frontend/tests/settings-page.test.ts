import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SettingsPage from '../src/pages/settings/SettingsPage.vue'

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}))

vi.mock('../src/api/user', () => ({
  default: {
    getSettings: mocks.getSettings,
    updateSettings: mocks.updateSettings,
  },
}))

const configuredSettings = {
  aiEnabled: true,
  autoReplyEnabled: false,
  prioritySortEnabled: true,
  modelConfigured: true,
  provider: 'DEEPSEEK' as const,
  baseUrl: 'https://api.deepseek.com',
  modelName: 'deepseek-chat',
  apiKeyConfigured: true,
  maskedApiKey: 'sk-****abcd',
  timeoutMs: 30000,
  maxTokens: 2048,
  temperature: 0.7,
}

async function mountSettingsPage(settings = configuredSettings) {
  mocks.getSettings.mockResolvedValue(settings)
  mocks.updateSettings.mockResolvedValue(settings)

  const wrapper = mount(SettingsPage, {
    global: {
      plugins: [ElementPlus],
    },
  })

  await flushPromises()

  return wrapper
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mocks.getSettings.mockReset()
    mocks.updateSettings.mockReset()
  })

  it('loads user settings on mount and renders model status', async () => {
    const wrapper = await mountSettingsPage()

    expect(mocks.getSettings).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('deepseek-chat')
    expect(wrapper.text()).toContain('sk-****abcd')
  })

  it('saves settings without apiKey when a key is already configured and the field is empty', async () => {
    const wrapper = await mountSettingsPage()

    await wrapper.get('[data-test="settings-auto-reply"]').setValue(true)
    await wrapper.get('[data-test="settings-save"]').trigger('click')
    await flushPromises()

    expect(mocks.updateSettings).toHaveBeenCalledWith({
      aiEnabled: true,
      autoReplyEnabled: true,
      prioritySortEnabled: true,
      provider: 'DEEPSEEK',
      baseUrl: 'https://api.deepseek.com',
      modelName: 'deepseek-chat',
      timeoutMs: 30000,
      maxTokens: 2048,
      temperature: 0.7,
    })
  })

  it('blocks first model configuration when apiKey is missing', async () => {
    const wrapper = await mountSettingsPage({
      ...configuredSettings,
      modelConfigured: false,
      apiKeyConfigured: false,
      maskedApiKey: null,
      provider: 'CUSTOM',
      baseUrl: 'https://api.example.com',
      modelName: 'custom-model',
    })

    await wrapper.get('[data-test="settings-save"]').trigger('click')
    await flushPromises()

    expect(mocks.updateSettings).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('首次配置模型时必须填写 API Key')
  })

  it('sends an empty apiKey after clicking clear key', async () => {
    const wrapper = await mountSettingsPage()

    await wrapper.get('[data-test="settings-clear-api-key"]').trigger('click')
    await wrapper.get('[data-test="settings-save"]').trigger('click')
    await flushPromises()

    expect(mocks.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: '',
      }),
    )
  })
})
