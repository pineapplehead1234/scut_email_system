import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sourceFiles = [
  'src/layouts/AppLayout.vue',
  'src/router/index.ts',
  'src/pages/auth/AuthPage.vue',
  'src/pages/mail/ComposePage.vue',
  'src/pages/mail/MailListPage.vue',
  'src/pages/mail/ThreadDetailPage.vue',
  'src/pages/mail/ThreadListPage.vue',
  'src/pages/settings/ChangePasswordPage.vue',
  'src/pages/settings/SettingsPage.vue',
  'src/components/mail/AttachmentUploader.vue',
  'src/components/mail/InlineImageRenderer.vue',
  'src/components/mail/MailComposer.vue',
  'src/components/mail/RichTextEditor.vue',
  'src/components/mail/RichTextRenderer.vue',
  'src/components/mail/ThreadMailItem.vue',
  'src/components/mail/ThreadMessageList.vue',
].map((path) => resolve(process.cwd(), path))

const mojibakePatterns = [
  /锟/,
  /閸|瀹|绔|鍙|鐢|璇|淇|涔/,
  /Ã|Â|ð|�/,
]

describe('copy quality', () => {
  it('keeps source UI copy free of common mojibake fragments', () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8')

      for (const pattern of mojibakePatterns) {
        expect(content, file).not.toMatch(pattern)
      }
    }
  })

  it('uses consistent spam folder terminology', () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8')

      expect(content, file).not.toContain('垃圾邮箱')
    }
  })
})
