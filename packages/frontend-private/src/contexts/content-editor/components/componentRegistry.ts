import type { ComponentType } from 'react'
import { CONTENT_RENDERERS, type ComponentKind, type ContentRenderers } from '@content'
import { TextPanel } from './inspector/TextPanel'
import type { PanelProps } from './inspector/panelProps'

type RegistryEntry<K extends ComponentKind> = {
  label: string
  flow: 'text' | 'visual'
  render: ContentRenderers[K]
  Inspector: ComponentType<PanelProps<K>>
}

export const COMPONENT_REGISTRY: { [K in ComponentKind]: RegistryEntry<K> } = {
  text: { label: 'Text', flow: 'text', render: CONTENT_RENDERERS.text, Inspector: TextPanel },
}

export const COMPONENT_KINDS = Object.keys(COMPONENT_REGISTRY) as ComponentKind[]
