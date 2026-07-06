import { describe, expect, it } from 'vitest'

import { shouldApplyExternalRichTextUpdate } from '../src/pages/mail/rich-text-editor-sync'
import type { RichTextNode } from '../src/api/type'
import type { TiptapJsonNode } from '../src/pages/mail/rich-text-adapter'

describe('rich text editor sync', () => {
  it('does not overwrite transient empty lines created by editor input', () => {
    const currentEditorDoc: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Line one' }],
        },
        {
          type: 'paragraph',
        },
      ],
    }
    const emittedNodes: RichTextNode[] = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Line one' }],
      },
    ]

    expect(
      shouldApplyExternalRichTextUpdate({
        currentEditorDoc,
        lastEmittedRichTextJson: JSON.stringify(emittedNodes),
        nextNodes: emittedNodes,
      }),
    ).toBe(false)
  })

  it('still applies a real external model change', () => {
    const currentEditorDoc: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Line one' }],
        },
      ],
    }
    const nextNodes: RichTextNode[] = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'External draft' }],
      },
    ]

    expect(
      shouldApplyExternalRichTextUpdate({
        currentEditorDoc,
        lastEmittedRichTextJson: JSON.stringify([
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Line one' }],
          },
        ]),
        nextNodes,
      }),
    ).toBe(true)
  })
})
