<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'

import fileApi from '../../api/file'
import type { RichTextNode } from '../../api/type'
import {
  richTextToTiptapDoc,
  tiptapDocToRichText,
  type TiptapJsonNode,
} from '../../pages/mail/rich-text-adapter'
import { shouldApplyExternalRichTextUpdate } from '../../pages/mail/rich-text-editor-sync'

const props = withDefaults(
  defineProps<{
    modelValue: RichTextNode[]
    placeholder?: string
  }>(),
  {
    placeholder: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [nodes: RichTextNode[]]
}>()

const imageInputRef = ref<HTMLInputElement | null>(null)
const imageErrorMessage = ref('')
const lastEmittedRichTextJson = ref('')

const InlineImage = Image.extend({
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      resourceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-resource-id'),
        renderHTML: (attributes) =>
          attributes.resourceId
            ? { 'data-resource-id': String(attributes.resourceId) }
            : {},
      },
    }
  },
})

const editor = useEditor({
  content: richTextToTiptapDoc(props.modelValue),
  extensions: [
    StarterKit.configure({
      blockquote: false,
      code: false,
      codeBlock: false,
      heading: false,
      horizontalRule: false,
      link: false,
      strike: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      autolink: false,
      openOnClick: false,
    }),
    InlineImage.configure({
      inline: true,
      allowBase64: false,
    }),
  ],
  editorProps: {
    attributes: {
      class:
        'min-h-44 px-3 py-2 text-sm leading-7 text-slate-900 outline-none',
      'data-placeholder': props.placeholder,
      'data-test': 'rich-editor-content',
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    const nextNodes = tiptapDocToRichText(currentEditor.getJSON() as TiptapJsonNode)

    lastEmittedRichTextJson.value = JSON.stringify(nextNodes)
    emit('update:modelValue', nextNodes)
  },
})

const hasEditor = computed(() => Boolean(editor.value))
const bubbleMenuEditor = computed(
  () => editor.value as NonNullable<typeof editor.value>,
)

watch(
  () => props.modelValue,
  (nodes) => {
    if (!editor.value) {
      return
    }

    if (
      !shouldApplyExternalRichTextUpdate({
        currentEditorDoc: editor.value.getJSON() as TiptapJsonNode,
        lastEmittedRichTextJson: lastEmittedRichTextJson.value,
        nextNodes: nodes,
      })
    ) {
      return
    }

    const nextDoc = richTextToTiptapDoc(nodes)

    editor.value.commands.setContent(nextDoc, { emitUpdate: false })
  },
  { deep: true },
)

function isActive(name: string) {
  return editor.value?.isActive(name) || false
}

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function toggleUnderline() {
  editor.value?.chain().focus().toggleUnderline().run()
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}

function setLink() {
  const currentHref = editor.value?.getAttributes('link').href || ''
  const href = window.prompt('输入链接地址', currentHref)

  if (href === null) {
    return
  }

  if (!href.trim()) {
    editor.value?.chain().focus().unsetLink().run()
    return
  }

  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: href.trim() })
    .run()
}

function clearMarks() {
  editor.value?.chain().focus().unsetAllMarks().run()
}

function openImagePicker() {
  imageInputRef.value?.click()
}

function resolveExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

function validateInlineImage(file: File) {
  const extension = resolveExtension(file)

  if (!['png', 'jpg', 'jpeg'].includes(extension)) {
    return '正文图片只支持 png、jpg、jpeg'
  }

  if (file.type && !['image/png', 'image/jpeg'].includes(file.type)) {
    return '正文图片只支持 png、jpg、jpeg'
  }

  return ''
}

async function insertInlineImage(file: File) {
  imageErrorMessage.value = ''

  const validationError = validateInlineImage(file)

  if (validationError) {
    imageErrorMessage.value = validationError
    return
  }

  const data = await fileApi.upload(file)
  const currentNodes = editor.value
    ? tiptapDocToRichText(editor.value.getJSON() as TiptapJsonNode)
    : props.modelValue
  const nextNodes: RichTextNode[] = [
    ...currentNodes,
    {
      type: 'paragraph',
      children: [{ type: 'image', resourceId: data.fileId }],
    },
  ]

  editor.value?.commands.setContent(richTextToTiptapDoc(nextNodes), {
    emitUpdate: false,
  })
  lastEmittedRichTextJson.value = JSON.stringify(nextNodes)
  emit('update:modelValue', nextNodes)
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  void insertInlineImage(file).finally(() => {
    input.value = ''
  })
}

function showContextFormatMenu(event: MouseEvent) {
  const currentEditor = editor.value

  if (!currentEditor || currentEditor.state.selection.empty) {
    return
  }

  event.preventDefault()
  currentEditor.commands.setMeta('richTextBubbleMenu', 'show')
}
</script>

<template>
  <section class="rounded-md border border-slate-200 bg-white">
    <div
      data-test="rich-editor-toolbar"
      class="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-2"
    >
      <button
        data-test="rich-editor-bold"
        type="button"
        class="format-button font-bold"
        :class="{ 'is-active': isActive('bold') }"
        @click="toggleBold"
      >
        B
      </button>
      <button
        data-test="rich-editor-italic"
        type="button"
        class="format-button italic"
        :class="{ 'is-active': isActive('italic') }"
        @click="toggleItalic"
      >
        I
      </button>
      <button
        data-test="rich-editor-underline"
        type="button"
        class="format-button underline underline-offset-2"
        :class="{ 'is-active': isActive('underline') }"
        @click="toggleUnderline"
      >
        U
      </button>
      <button
        data-test="rich-editor-link"
        type="button"
        class="format-button"
        :class="{ 'is-active': isActive('link') }"
        @click="setLink"
      >
        链接
      </button>
      <button
        data-test="rich-editor-bullet-list"
        type="button"
        class="format-button"
        :class="{ 'is-active': isActive('bulletList') }"
        @click="toggleBulletList"
      >
        •
      </button>
      <button
        data-test="rich-editor-ordered-list"
        type="button"
        class="format-button"
        :class="{ 'is-active': isActive('orderedList') }"
        @click="toggleOrderedList"
      >
        1.
      </button>
      <button
        data-test="rich-editor-image"
        type="button"
        class="format-button"
        @click="openImagePicker"
      >
        图片
      </button>
      <input
        ref="imageInputRef"
        data-test="rich-editor-image-input"
        type="file"
        class="sr-only"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        @change="handleImageChange"
      />
    </div>

    <div data-test="rich-editor-bubble-menu">
      <BubbleMenu
        v-if="hasEditor"
        data-test="rich-editor-bubble-menu"
        :editor="bubbleMenuEditor"
        plugin-key="richTextBubbleMenu"
      >
      <div class="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
        <button type="button" class="format-button font-bold" @click="toggleBold">
          B
        </button>
        <button type="button" class="format-button italic" @click="toggleItalic">
          I
        </button>
        <button
          type="button"
          class="format-button underline underline-offset-2"
          @click="toggleUnderline"
        >
          U
        </button>
        <button type="button" class="format-button" @click="setLink">
          链接
        </button>
        <button type="button" class="format-button" @click="clearMarks">
          清除
        </button>
      </div>
      </BubbleMenu>
    </div>

    <div @contextmenu="showContextFormatMenu">
      <EditorContent :editor="editor" />
    </div>

    <p v-if="imageErrorMessage" class="border-t border-slate-100 px-3 py-2 text-sm text-red-600">
      {{ imageErrorMessage }}
    </p>
  </section>
</template>

<style scoped>
.format-button {
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  padding: 0 0.5rem;
  font-size: 0.8125rem;
  line-height: 2rem;
  color: #334155;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.format-button:hover,
.format-button.is-active {
  background: #e4f2f3;
  color: #124b55;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
}

:deep(.ProseMirror ul) {
  list-style: disc;
  padding-left: 1.25rem;
}

:deep(.ProseMirror ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}

:deep(.ProseMirror img) {
  max-width: min(100%, 560px);
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}
</style>
