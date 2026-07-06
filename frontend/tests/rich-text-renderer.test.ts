import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RichTextRenderer from '../src/components/mail/RichTextRenderer.vue'
import type { RichTextNode } from '../src/api/type'

const mocks = vi.hoisted(() => ({
  createObjectUrl: vi.fn(),
}))

vi.mock('../src/api/file', () => ({
  default: {
    createObjectUrl: mocks.createObjectUrl,
  },
}))

describe('RichTextRenderer', () => {
  beforeEach(() => {
    mocks.createObjectUrl.mockReset()
    mocks.createObjectUrl.mockResolvedValue('blob:inline-image')
  })

  it('renders rich text marks, links, lists, and inline images from RichTextNode', async () => {
    const nodes: RichTextNode[] = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Please read ' },
          {
            type: 'link',
            text: 'the guide',
            href: 'https://example.test/guide',
            underline: true,
          },
          { type: 'text', text: ' carefully', bold: true },
        ],
      },
      {
        type: 'ul',
        children: [
          {
            type: 'li',
            children: [{ type: 'text', text: 'Submit report', italic: true }],
          },
          {
            type: 'li',
            children: [{ type: 'text', text: 'Review appendix' }],
          },
        ],
      },
      {
        type: 'paragraph',
        children: [{ type: 'image', resourceId: 'file_image' }],
      },
    ]

    const wrapper = mount(RichTextRenderer, {
      props: { nodes },
    })
    await flushPromises()

    expect(wrapper.get('p').text()).toContain('Please read the guide carefully')
    expect(wrapper.get('a').attributes()).toMatchObject({
      href: 'https://example.test/guide',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
    expect(wrapper.find('strong').text()).toBe('carefully')
    expect(wrapper.find('em').text()).toBe('Submit report')
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.findAll('li')[0].text()).toContain('Submit report')
    expect(wrapper.findAll('li')[1].text()).toContain('Review appendix')
    expect(mocks.createObjectUrl).toHaveBeenCalledWith('file_image')
    expect(wrapper.get('img').attributes('src')).toBe('blob:inline-image')
  })

  it('keeps line breaks visible inside list items', () => {
    const wrapper = mount(RichTextRenderer, {
      props: {
        nodes: [
          {
            type: 'ul',
            children: [
              {
                type: 'li',
                children: [{ type: 'text', text: 'Line one\nLine two' }],
              },
            ],
          },
        ] satisfies RichTextNode[],
      },
    })

    expect(wrapper.get('li').classes()).toContain('whitespace-pre-wrap')
  })
})
