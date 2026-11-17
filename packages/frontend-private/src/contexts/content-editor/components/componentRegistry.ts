import type { ComponentType } from 'react'
import { CONTENT_RENDERERS, type ComponentKind, type ContentKind, type ContentRenderers } from '@content'
import { LinkPanel } from './inspector/LinkPanel'
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
  text: { label: 'Text', flow: 'text', render: CONTENT_RENDERERS.text, Inspector: TextPanel },
  surface: { label: 'Surface', flow: 'visual', render: null, Inspector: SurfacePanel },
  link: { label: 'Link', flow: 'visual', render: null, Inspector: LinkPanel },
}

export const COMPONENT_KINDS = Object.keys(COMPONENT_REGISTRY) as ComponentKind[]
