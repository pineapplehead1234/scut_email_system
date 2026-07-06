import type { RichTextNode } from '../../api/type'

function readNodeText(node: RichTextNode): string {
  if (node.text) {
    return node.text
  }

  return node.children?.map(readNodeText).join('') || ''
}

export function textToRichText(text: string): RichTextNode[] {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: paragraph,
        },
      ],
    }))
}

export function richTextToParagraphs(nodes: RichTextNode[]): string[] {
  return nodes
    .map(readNodeText)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function richTextToPlainText(nodes: RichTextNode[]): string {
  return richTextToParagraphs(nodes).join('\n\n')
}
