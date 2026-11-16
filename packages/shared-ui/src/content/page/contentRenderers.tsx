import { Fragment, type ReactNode } from 'react'
import { StaticRichText } from '../richText/StaticRichText'
import { TEXT_SCALE_OPTIONS } from '../section/types'
import type { ComponentKind, ElementComponents } from './pageTypes'

type ContentRenderers = { [K in ComponentKind]: (component: NonNullable<ElementComponents[K]>) => ReactNode }

const CONTENT_RENDERERS: ContentRenderers = {
  text: ({ html, scale }) => (
    <StaticRichText html={html} scale={TEXT_SCALE_OPTIONS.find(o => o.value === scale)?.factor ?? 1} />
  ),
}

const KINDS = Object.keys(CONTENT_RENDERERS) as ComponentKind[]

export function renderContent(components: ElementComponents): ReactNode {
  return KINDS.map(kind => {
    const component = components[kind]
    return component ? <Fragment key={kind}>{CONTENT_RENDERERS[kind](component)}</Fragment> : null
  })
}
