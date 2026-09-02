import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { ComponentPalette } from './ComponentPalette'
import { GridCanvas } from './GridCanvas'
import { LayoutPreview, type PageLayoutDto, type SectionPosition } from '@atelier/content-renderer'
import type { PageType, SectionContent, Widget } from './widgets'

export type { SectionDto, PageLayoutDto, SectionPosition } from '@atelier/content-renderer'

const DEFAULT_W = 4
const DEFAULT_H = 3

type GridBuilderProps = {
  pageType: PageType
  pageRef: string
  apiUrl: string
}

export function GridBuilder({ pageType, pageRef, apiUrl }: GridBuilderProps) {
  const [layout, setLayout] = useState<PageLayoutDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrCreateLayout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/page-layouts/by-ref?pageType=${pageType}&pageRef=${pageRef}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const existing = (await res.json()) as PageLayoutDto | null
      if (existing) {
        setLayout(existing)
        return
      }
      const createRes = await fetch(`${apiUrl}/page-layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pageType, pageRef }),
      })
      if (!createRes.ok) throw new Error(`HTTP ${createRes.status}`)
      const { id } = (await createRes.json()) as { id: string }
      setLayout({ id, pageType, pageRef, sections: [] })
    } catch {
      setError('Impossible de charger la mise en page.')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, pageType, pageRef])

  useEffect(() => {
    loadOrCreateLayout()
  }, [loadOrCreateLayout])

  const handleAddSection = async (widget: Widget) => {
    if (!layout) return
    const maxY = layout.sections.reduce((max, s) => Math.max(max, s.y + s.h), 0)
    const position: SectionPosition = { x: 0, y: maxY, w: DEFAULT_W, h: DEFAULT_H }
    const res = await fetch(`${apiUrl}/page-layouts/${layout.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: widget.type,
        contentRef: widget.defaultContentRef,
        content: widget.defaultContent,
        ...position,
      }),
    })
    if (res.ok || res.status === 204) {
      await loadOrCreateLayout()
    } else {
      setError("Erreur lors de l'ajout du composant.")
    }
  }

  const handleUpdateContent = async (sectionId: string, content: SectionContent, contentRef: string | null) => {
    if (!layout) return
    setLayout(prev =>
      prev
        ? { ...prev, sections: prev.sections.map(s => (s.id === sectionId ? { ...s, content, contentRef } : s)) }
        : prev,
    )
    const res = await fetch(`${apiUrl}/page-layouts/${layout.id}/sections/${sectionId}/content`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, contentRef }),
    })
    if (!res.ok && res.status !== 204) {
      setError('Erreur lors de la mise à jour du contenu.')
      await loadOrCreateLayout()
    }
  }

  const handleMoveSection = async (sectionId: string, position: SectionPosition) => {
    if (!layout) return
    setLayout(prev =>
      prev ? { ...prev, sections: prev.sections.map(s => (s.id === sectionId ? { ...s, ...position } : s)) } : prev,
    )
    const res = await fetch(`${apiUrl}/page-layouts/${layout.id}/sections/${sectionId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(position),
    })
    if (!res.ok && res.status !== 204) {
      setError('Erreur lors du déplacement.')
      await loadOrCreateLayout()
    }
  }

  const handleRemoveSection = async (sectionId: string) => {
    if (!layout) return
    const res = await fetch(`${apiUrl}/page-layouts/${layout.id}/sections/${sectionId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      setLayout(prev => (prev ? { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) } : prev))
    } else {
      setError('Erreur lors de la suppression.')
    }
  }

  if (loading) return <p style={mutedStyle}>Chargement de la mise en page…</p>
  if (error || !layout) return <p style={errorStyle}>{error ?? 'Mise en page introuvable.'}</p>

  return (
    <div style={builderStyle}>
      <ComponentPalette pageType={pageType} onAdd={handleAddSection} />
      <section style={columnStyle}>
        <h2 style={columnTitleStyle}>edition</h2>
        <GridCanvas
          apiUrl={apiUrl}
          sections={layout.sections}
          onMoveSection={handleMoveSection}
          onRemoveSection={handleRemoveSection}
          onUpdateContent={handleUpdateContent}
        />
      </section>
      <section style={columnStyle}>
        <h2 style={columnTitleStyle}>preview</h2>
        <LayoutPreview apiUrl={apiUrl} sections={layout.sections} />
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
