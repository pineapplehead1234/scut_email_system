import { describe, expect, it } from 'vitest'

import { richTextToParagraphs, textToRichText } from '../src/pages/mail/rich-text'

describe('rich text helpers', () => {
  it('converts plain text into paragraph rich text nodes', () => {
    expect(textToRichText(' First line \n\nSecond line ')).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'First line' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Second line' }],
      },
    ])
  })

  it('reads display paragraphs from nested rich text nodes', () => {
    expect(
      richTextToParagraphs([
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Open ' },
            { type: 'link', text: 'docs', href: 'https://example.test' },
          ],
        },
      ]),
    ).toEqual(['Open docs'])
  })
})
