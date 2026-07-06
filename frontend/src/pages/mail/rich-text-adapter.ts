import type { RichTextNode } from '../../api/type'

export type TiptapJsonNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  content?: TiptapJsonNode[]
}

function inlineImageSrc(resourceId: string) {
  return `/api/files/${encodeURIComponent(resourceId)}/download`
}

function textMarks(node: RichTextNode) {
  const marks: NonNullable<TiptapJsonNode['marks']> = []

  if (node.bold) marks.push({ type: 'bold' })
  if (node.italic) marks.push({ type: 'italic' })
  if (node.underline) marks.push({ type: 'underline' })

  return marks
}

function mergeMarks(
  marks: NonNullable<TiptapJsonNode['marks']>,
  extraMarks: NonNullable<TiptapJsonNode['marks']>,
) {
  return [...marks, ...extraMarks]
}

function textToTiptapInlineNodes(
  text: string,
  marks: NonNullable<TiptapJsonNode['marks']>,
) {
  return text.split('\n').flatMap((part, index) => {
    const nodes: TiptapJsonNode[] = []

    if (index > 0) {
      nodes.push({ type: 'hardBreak' })
    }

    if (part) {
      const tiptapNode: TiptapJsonNode = {
        type: 'text',
        text: part,
      }

      if (marks.length > 0) {
        tiptapNode.marks = marks
      }

      nodes.push(tiptapNode)
    }

    return nodes
  })
}

function richInlineToTiptap(
  node: RichTextNode,
  inheritedMarks: NonNullable<TiptapJsonNode['marks']> = [],
): TiptapJsonNode[] {
  if (node.type === 'image') {
    if (!node.resourceId) {
      return []
    }

    return [
      {
        type: 'image',
        attrs: {
          src: inlineImageSrc(node.resourceId),
          resourceId: node.resourceId,
        },
      },
    ]
  }

  if (node.type === 'link') {
    const href = node.href || ''
    const linkMarks = href ? [{ type: 'link', attrs: { href } }] : []
    const marks = mergeMarks(
      mergeMarks(inheritedMarks, textMarks(node)),
      linkMarks,
    )

    if (node.children?.length) {
      return node.children.flatMap((child) => richInlineToTiptap(child, marks))
    }

    return node.text ? textToTiptapInlineNodes(node.text, marks) : []
  }

  if (node.children?.length) {
    const marks = mergeMarks(inheritedMarks, textMarks(node))

    return node.children.flatMap((child) => richInlineToTiptap(child, marks))
  }

  if (!node.text) {
    return []
  }

  const marks = mergeMarks(inheritedMarks, textMarks(node))
  return textToTiptapInlineNodes(node.text, marks)
}

function richBlockToTiptap(node: RichTextNode): TiptapJsonNode | null {
  if (node.type === 'ul' || node.type === 'ol') {
    return {
      type: node.type === 'ul' ? 'bulletList' : 'orderedList',
      content: (node.children || [])
        .map(richBlockToTiptap)
        .filter((child): child is TiptapJsonNode => Boolean(child)),
    }
  }

  if (node.type === 'li') {
    return {
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: (node.children || []).flatMap((child) =>
            richInlineToTiptap(child),
          ),
        },
      ],
    }
  }

  return {
    type: 'paragraph',
    content: (node.children || [node]).flatMap((child) =>
      richInlineToTiptap(child),
    ),
  }
}

export function richTextToTiptapDoc(nodes: RichTextNode[]): TiptapJsonNode {
  const content = nodes
    .map(richBlockToTiptap)
    .filter((node): node is TiptapJsonNode => Boolean(node))

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  }
}

function markFlags(marks: TiptapJsonNode['marks']) {
  return {
    bold: Boolean(marks?.some((mark) => mark.type === 'bold')),
    italic: Boolean(marks?.some((mark) => mark.type === 'italic')),
    underline: Boolean(marks?.some((mark) => mark.type === 'underline')),
  }
}

function textNodeFromTiptap(node: TiptapJsonNode): RichTextNode | null {
  if (node.type === 'hardBreak') {
    return { type: 'text', text: '\n' }
  }

  if (node.type === 'image') {
    const resourceId =
      typeof node.attrs?.resourceId === 'string' ? node.attrs.resourceId : ''

    return resourceId ? { type: 'image', resourceId } : null
  }

  if (node.type !== 'text' || !node.text) {
    return null
  }

  const linkMark = node.marks?.find((mark) => mark.type === 'link')
  const flags = markFlags(node.marks)
  const textNode: RichTextNode = {
    type: 'text',
    text: node.text,
  }

  if (flags.bold) textNode.bold = true
  if (flags.italic) textNode.italic = true
  if (flags.underline) textNode.underline = true

  if (!linkMark) {
    return textNode
  }

  return {
    type: 'link',
    href:
      typeof linkMark.attrs?.href === 'string' ? linkMark.attrs.href : '',
    children: [textNode],
  }
}

function inlineNodesFromTiptap(nodes: TiptapJsonNode[] = []) {
  return nodes
    .map(textNodeFromTiptap)
    .filter((node): node is RichTextNode => Boolean(node))
}

function listItemChildrenFromTiptap(node: TiptapJsonNode) {
  return (node.content || []).flatMap((child) => {
    if (child.type === 'paragraph') {
      return inlineNodesFromTiptap(child.content)
    }

    return richNodesFromTiptap([child])
  })
}

function richNodesFromTiptap(nodes: TiptapJsonNode[] = []): RichTextNode[] {
  return nodes
    .map((node): RichTextNode | null => {
      if (node.type === 'paragraph') {
        const children = inlineNodesFromTiptap(node.content)

        return children.length > 0 ? { type: 'paragraph', children } : null
      }

      if (node.type === 'bulletList' || node.type === 'orderedList') {
        const children = (node.content || [])
          .map((child): RichTextNode | null => {
            if (child.type !== 'listItem') {
              return null
            }

            const itemChildren = listItemChildrenFromTiptap(child)

            return itemChildren.length > 0
              ? { type: 'li', children: itemChildren }
              : null
          })
          .filter((child): child is RichTextNode => Boolean(child))

        return children.length > 0
          ? {
              type: node.type === 'bulletList' ? 'ul' : 'ol',
              children,
            }
          : null
      }

      return textNodeFromTiptap(node)
    })
    .filter((node): node is RichTextNode => Boolean(node))
}

function hasMeaningfulContent(node: RichTextNode): boolean {
  if (node.type === 'image' && node.resourceId) {
    return true
  }

  if (node.text?.trim()) {
    return true
  }

  return Boolean(node.children?.some(hasMeaningfulContent))
}

export function tiptapDocToRichText(doc: TiptapJsonNode): RichTextNode[] {
  return richNodesFromTiptap(doc.content)
}

export function isRichTextEmpty(nodes: RichTextNode[]) {
  return !nodes.some(hasMeaningfulContent)
}
