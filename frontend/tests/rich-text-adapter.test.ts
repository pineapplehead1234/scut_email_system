import { describe, expect, it } from 'vitest'

import {
  richTextToTiptapDoc,
  tiptapDocToRichText,
} from '../src/pages/mail/rich-text-adapter'
import type { RichTextNode } from '../src/api/type'

describe('rich-text-adapter', () => {
  it('converts supported RichTextNode content to a Tiptap document and back', () => {
    const nodes: RichTextNode[] = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '请查看 ', bold: true },
          {
            type: 'link',
            href: 'https://example.test/report',
            children: [{ type: 'text', text: '报告链接', underline: true }],
          },
        ],
      },
      {
        type: 'ul',
        children: [
          {
            type: 'li',
            children: [{ type: 'text', text: '补充实验数据', italic: true }],
          },
        ],
      },
      {
        type: 'paragraph',
        children: [{ type: 'image', resourceId: 'file_inline_1' }],
      },
    ]

    const tiptapDoc = richTextToTiptapDoc(nodes)

    expect(tiptapDoc).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请查看 ',
              marks: [{ type: 'bold' }],
            },
            {
              type: 'text',
              text: '报告链接',
              marks: expect.arrayContaining([
                { type: 'underline' },
                { type: 'link', attrs: { href: 'https://example.test/report' } },
              ]),
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '补充实验数据',
                      marks: [{ type: 'italic' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: {
                resourceId: 'file_inline_1',
                src: '/api/files/file_inline_1/download',
              },
            },
          ],
        },
      ],
    })

    expect(tiptapDocToRichText(tiptapDoc)).toEqual(nodes)
  })

  it('detects empty rich text content', () => {
    expect(
      tiptapDocToRichText({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
    ).toEqual([])
  })

  it('preserves editor hard breaks as newline text nodes', () => {
    const richNodes: RichTextNode[] = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Line one' },
          { type: 'text', text: '\n' },
          { type: 'text', text: 'Line two', bold: true },
        ],
      },
    ]

    expect(
      tiptapDocToRichText({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Line one' },
              { type: 'hardBreak' },
              { type: 'text', text: 'Line two', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      }),
    ).toEqual(richNodes)

    expect(richTextToTiptapDoc(richNodes)).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Line one' },
            { type: 'hardBreak' },
            { type: 'text', text: 'Line two', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    })
  })
})
