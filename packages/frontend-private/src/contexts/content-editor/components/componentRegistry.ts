import type { ComponentType } from 'react'
import { CONTENT_FLOW, CONTENT_RENDERERS, type ComponentKind, type ContentKind, type ContentRenderers } from '@content'
import { CarouselPanel } from './inspector/CarouselPanel'
import { CodePanel } from './inspector/CodePanel'
import { ContactFormPanel } from './inspector/ContactFormPanel'
import { ProjectCardPanel } from './inspector/ProjectCardPanel'
import { EmbedPanel } from './inspector/EmbedPanel'
import { LinkListPanel } from './inspector/LinkListPanel'
import { LinkPanel } from './inspector/LinkPanel'
import { MediaPanel } from './inspector/MediaPanel'
import { SurfacePanel } from './inspector/SurfacePanel'
import { TextPanel } from './inspector/TextPanel'
import type { PanelProps } from './inspector/panelProps'

type RegistryEntry<K extends ComponentKind> = {
  label: string
  flow: 'text' | 'visual'
  render: K extends ContentKind ? ContentRenderers[K] : null
  Inspector: ComponentType<PanelProps<K>>
}

export const COMPONENT_REGISTRY: { [K in ComponentKind]: RegistryEntry<K> } = {
  text: { label: 'Text', flow: CONTENT_FLOW.text, render: CONTENT_RENDERERS.text, Inspector: TextPanel },
  media: { label: 'Media', flow: CONTENT_FLOW.media, render: CONTENT_RENDERERS.media, Inspector: MediaPanel },
  carousel: {
    label: 'Carousel',
    flow: CONTENT_FLOW.carousel,
    render: CONTENT_RENDERERS.carousel,
    Inspector: CarouselPanel,
  },
  code: { label: 'Code', flow: CONTENT_FLOW.code, render: CONTENT_RENDERERS.code, Inspector: CodePanel },
  embed: { label: 'Embed', flow: CONTENT_FLOW.embed, render: CONTENT_RENDERERS.embed, Inspector: EmbedPanel },
  linkList: {
    label: 'Link list',
    flow: CONTENT_FLOW.linkList,
    render: CONTENT_RENDERERS.linkList,
    Inspector: LinkListPanel,
  },
  projectCard: {
    label: 'Project card',
    flow: CONTENT_FLOW.projectCard,
    render: CONTENT_RENDERERS.projectCard,
    Inspector: ProjectCardPanel,
  },
  contactForm: {
    label: 'Contact form',
    flow: CONTENT_FLOW.contactForm,
    render: CONTENT_RENDERERS.contactForm,
    Inspector: ContactFormPanel,
  },
  surface: { label: 'Surface', flow: 'visual', render: null, Inspector: SurfacePanel },
  link: { label: 'Link', flow: 'visual', render: null, Inspector: LinkPanel },
}

export const COMPONENT_KINDS = Object.keys(COMPONENT_REGISTRY) as ComponentKind[]
