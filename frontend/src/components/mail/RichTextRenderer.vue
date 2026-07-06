<script lang="ts">
import { defineComponent, h, type PropType, type VNode } from 'vue'

import type { RichTextNode } from '../../api/type'
import InlineImageRenderer from './InlineImageRenderer.vue'

type RenderedNode = string | VNode
type RenderedContent = string | VNode | RenderedNode[]

function renderChildren(node: RichTextNode): RenderedNode[] {
  return (node.children || []).map(renderNode)
}

function renderTextContent(node: RichTextNode): RenderedContent {
  const children = renderChildren(node)

  if (children.length > 0) {
    return children
  }

  return node.text || ''
}

function applyTextMarks(node: RichTextNode, content: RenderedContent): VNode {
  let marked: RenderedContent = content

  if (node.underline) {
    marked = h('u', {}, marked)
  }

  if (node.italic) {
    marked = h('em', {}, marked)
  }

  if (node.bold) {
    marked = h('strong', {}, marked)
  }

  return typeof marked === 'string'
    ? h('span', {}, marked)
    : h('span', {}, marked)
}

function renderNode(node: RichTextNode): VNode {
  switch (node.type) {
    case 'paragraph':
      return h('p', { class: 'whitespace-pre-wrap' }, renderTextContent(node))
    case 'text':
      return applyTextMarks(node, node.text || '')
    case 'link':
      return h(
        'a',
        {
          class: [
            'font-medium text-[#185c68] hover:text-[#124b55]',
            node.underline ? 'underline underline-offset-2' : '',
          ],
          href: node.href || '#',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        applyTextMarks(node, renderTextContent(node)),
      )
    case 'image':
      if (!node.resourceId) {
        return h('span')
      }

      return h(InlineImageRenderer, {
        class: 'my-3',
        resourceId: node.resourceId,
      })
    case 'ul':
      return h('ul', { class: 'list-disc space-y-1 pl-5' }, renderChildren(node))
    case 'ol':
      return h('ol', { class: 'list-decimal space-y-1 pl-5' }, renderChildren(node))
    case 'li':
      return h('li', { class: 'whitespace-pre-wrap' }, renderTextContent(node))
    default:
      return applyTextMarks(node, renderTextContent(node))
  }
}

export default defineComponent({
  name: 'RichTextRenderer',
  props: {
    nodes: {
      type: Array as PropType<RichTextNode[]>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'space-y-3 text-sm leading-7 text-slate-700' },
        props.nodes.map(renderNode),
      )
  },
})
</script>
