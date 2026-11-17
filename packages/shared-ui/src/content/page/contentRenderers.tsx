import { Fragment, type ReactNode } from 'react'
import { StaticRichText } from '../richText/StaticRichText'
import { TEXT_SCALE_OPTIONS } from '../section/types'
import { cssColor } from './color'
import { CodeView, EmbedView, LinkListView } from './blockRenderers'
import { ContactFormView, ProjectCardView } from './interactiveRenderers'
import { CarouselView, MediaView } from './mediaRenderers'
import type { ContentComponents, ContentKind } from './pageTypes'

export type ContentRenderers = { [K in ContentKind]: (component: NonNullable<ContentComponents[K]>) => ReactNode }

export const CONTENT_RENDERERS: ContentRenderers = {
  text: ({ html, scale, color }) => (
    <StaticRichText
      html={html}
      scale={TEXT_SCALE_OPTIONS.find(o => o.value === scale)?.factor ?? 1}
      color={cssColor(color, 'var(--color-text)')}
    />
  ),
  media: media => <MediaView {...media} />,
  carousel: carousel => <CarouselView {...carousel} />,
  code: code => <CodeView {...code} />,
  embed: embed => <EmbedView {...embed} />,
  linkList: linkList => <LinkListView {...linkList} />,
  projectCard: card => <ProjectCardView {...card} />,
  contactForm: form => <ContactFormView {...form} />,
}

export type ContentFlow = 'text' | 'visual'

export const CONTENT_FLOW: { [K in ContentKind]: ContentFlow } = {
  text: 'text',
  media: 'visual',
  carousel: 'visual',
  code: 'text',
  embed: 'visual',
  linkList: 'text',
  projectCard: 'visual',
  contactForm: 'text',
}

const KINDS = Object.keys(CONTENT_RENDERERS) as ContentKind[]

export function contentFlowOf(components: ContentComponents): ContentFlow | null {
  const kind = KINDS.find(k => components[k])
  return kind ? CONTENT_FLOW[kind] : null
}

export function renderContent(components: ContentComponents): ReactNode {
  return KINDS.map(kind => <Fragment key={kind}>{renderKind(kind, components)}</Fragment>)
}

function renderKind<K extends ContentKind>(kind: K, components: ContentComponents): ReactNode {
  const component = components[kind]
  const render: (value: NonNullable<ContentComponents[K]>) => ReactNode = CONTENT_RENDERERS[kind]
  return component ? render(component) : null
}
