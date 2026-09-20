import type { CSSProperties } from 'react'
import { ComponentPalette } from './ComponentPalette'
import { GridCanvas } from './GridCanvas'
import { LayoutPreview } from '@content'
import type { PageType } from '../widgets'
import { usePageLayout } from '../hooks/usePageLayout'
import { API_URL } from '../../../shared/config'

type GridBuilderProps = {
  pageType: PageType
  pageRef: string
}

export function GridBuilder({ pageType, pageRef }: GridBuilderProps) {
  const { layout, loading, error, add, updateContent, move, remove } = usePageLayout(pageType, pageRef)

  if (loading) return <p style={mutedStyle}>Loading layout…</p>
  if (error || !layout) return <p style={errorStyle}>{error ?? 'Layout not found.'}</p>

  return (
    <div style={builderStyle}>
      <ComponentPalette allowedTypes={layout.allowedSectionTypes} onAdd={add} />
      <section style={columnStyle}>
        <h2 style={columnTitleStyle}>edition</h2>
        <GridCanvas
          sections={layout.sections}
          gridColumns={layout.gridColumns}
          onMoveSection={move}
          onRemoveSection={remove}
          onUpdateContent={updateContent}
        />
      </section>
      <section style={columnStyle}>
        <h2 style={columnTitleStyle}>preview</h2>
        <LayoutPreview apiUrl={API_URL} sections={layout.sections} />
      </section>
    </div>
  )
}

const builderStyle: CSSProperties = { display: 'flex', gap: '1rem', alignItems: 'stretch', flex: 1, minHeight: 0 }
const columnStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}
const columnTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  textAlign: 'center',
}
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)' }
