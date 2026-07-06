import type { RichTextNode } from '../../api/type'
import {
  richTextToTiptapDoc,
  type TiptapJsonNode,
} from './rich-text-adapter'

export type RichTextEditorSyncInput = {
  currentEditorDoc: TiptapJsonNode
  lastEmittedRichTextJson: string
  nextNodes: RichTextNode[]
}

export function shouldApplyExternalRichTextUpdate({
  currentEditorDoc,
  lastEmittedRichTextJson,
  nextNodes,
}: RichTextEditorSyncInput) {
  const nextRichTextJson = JSON.stringify(nextNodes)

  if (nextRichTextJson === lastEmittedRichTextJson) {
    return false
  }

  return JSON.stringify(currentEditorDoc) !== JSON.stringify(richTextToTiptapDoc(nextNodes))
}
