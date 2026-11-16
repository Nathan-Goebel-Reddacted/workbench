import { useMemo, type CSSProperties } from 'react'
import { generateJSON } from '@tiptap/core'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { buildRichTextExtensions } from './richTextExtensions'
import { resolveUploadPaths } from './uploadPaths'
import { useBindingLabel } from './dataBinding'
import type { DataBindingAttrs } from '../section/types'

type Props = { html: string; scale?: number }

function LiveBinding({ apiUrl, attrs }: { apiUrl: string; attrs: DataBindingAttrs }) {
  const label = useBindingLabel(apiUrl, attrs)
  return (
    <span className="data-binding" data-entity={attrs.entity} data-field={attrs.field}>
      {label}
    </span>
  )
}

export function StaticRichText({ html, scale = 1 }: Props) {
  const apiUrl = useApiUrl()

  const rendered = useMemo(() => {
    const extensions = buildRichTextExtensions(apiUrl)
    return renderToReactElement({
      extensions,
      content: generateJSON(resolveUploadPaths(html, apiUrl), extensions),
      options: {
        nodeMapping: {
          dataBinding: ({ node }) => <LiveBinding apiUrl={apiUrl} attrs={node.attrs as DataBindingAttrs} />,
        },
      },
    })
  }, [html, apiUrl])

  return (
    <div className="rich-text-content" style={{ ...contentStyle, '--text-scale': scale } as CSSProperties}>
      {rendered}
    </div>
  )
}

const contentStyle: CSSProperties = {
  fontSize: 'calc(0.8125rem * var(--text-scale, 1))',
  color: 'var(--color-text)',
  height: '100%',
  overflow: 'hidden',
}
