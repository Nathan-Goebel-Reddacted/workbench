import { Fragment, useContext, type ReactNode } from 'react'
import { StaticRichText } from '../richText/StaticRichText'
import { cssColor } from './color'
import { CodeView, EmbedView } from './blockRenderers'
import { ContactFormView } from './interactiveRenderers'
import { MediaView } from './mediaRenderers'
import type { ContentComponents, ContentKind, TextComponent } from './pageTypes'
import { RenderScreenContext, fontFamilyOf } from './typography'

export type ContentRenderers = { [K in ContentKind]: (component: NonNullable<ContentComponents[K]>) => ReactNode }

export const CONTENT_RENDERERS: ContentRenderers = {
  text: text => <TextView {...text} />,
  media: media => <MediaView {...media} />,
  code: code => <CodeView {...code} />,
  embed: embed => <EmbedView {...embed} />,
  contactForm: form => <ContactFormView {...form} />,
}

export type ContentFlow = 'text' | 'visual'

export const CONTENT_FLOW: { [K in ContentKind]: ContentFlow } = {
  text: 'text',
  media: 'visual',
  code: 'text',
  embed: 'visual',
  contactForm: 'text',
}

const KINDS = Object.keys(CONTENT_RENDERERS) as ContentKind[]

export function renderContent(components: ContentComponents): ReactNode {
  return KINDS.map(kind => <Fragment key={kind}>{renderKind(kind, components)}</Fragment>)
}

function renderKind<K extends ContentKind>(kind: K, components: ContentComponents): ReactNode {
  const component = components[kind]
  const render: (value: NonNullable<ContentComponents[K]>) => ReactNode = CONTENT_RENDERERS[kind]
  return component ? render(component) : null
}

function TextView({ html, font, fontSize, uppercase, letterSpacing, color }: TextComponent) {
  const screen = useContext(RenderScreenContext)
  return (
    <StaticRichText
      html={html}
      style={{
        color: cssColor(color, 'var(--color-text)'),
        fontFamily: fontFamilyOf(font),
        fontSize: `${fontSize[screen]}px`,
        textTransform: uppercase ? 'uppercase' : undefined,
        letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
      }}
    />
  )
}
