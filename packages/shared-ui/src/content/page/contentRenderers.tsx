import { Fragment, type ReactNode } from 'react'
import { StaticRichText } from '../richText/StaticRichText'
import { TEXT_SCALE_OPTIONS } from '../section/types'
import { cssColor } from './color'
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
}

const KINDS = Object.keys(CONTENT_RENDERERS) as ContentKind[]

export function renderContent(components: ContentComponents): ReactNode {
  return KINDS.map(kind => {
    const component = components[kind]
    return component ? <Fragment key={kind}>{CONTENT_RENDERERS[kind](component)}</Fragment> : null
  })
}
