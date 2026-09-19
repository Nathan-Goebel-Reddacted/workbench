import { useCallback, useEffect, useRef, useState } from 'react'
import { MINDMAP_SUFFIX, emptyMindmap, readMindmap, type Mindmap } from '@atelier/content-renderer'
import { readUpload, rewriteUpload, uploadFile } from '../api/uploads'
import type { Document, DocumentStore } from '../domain/document'

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mindmap'
  )
}

export function useMindmapFile(
  store: DocumentStore,
  existing: Document | undefined,
  onCreated?: (document: Document) => void,
) {
  const [loaded, setLoaded] = useState<Mindmap | null>(existing ? null : emptyMindmap())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = useRef<Mindmap>(emptyMindmap())
  const track = useCallback((mindmap: Mindmap) => {
    current.current = mindmap
  }, [])

  useEffect(() => {
    if (!existing) return

    let cancelled = false
    readUpload<unknown>(existing.url)
      .then(json => {
        if (cancelled) return
        const mindmap = readMindmap(json)
        current.current = mindmap
        setLoaded(mindmap)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load this mindmap.')
        setLoaded(emptyMindmap())
      })

    return () => {
      cancelled = true
    }
  }, [existing])

  const save = async (name: string): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      if (existing) {
        await rewriteUpload(existing.url, current.current)
      } else {
        const blob = new Blob([JSON.stringify(current.current)], { type: 'application/json' })
        const url = await uploadFile(blob, `${slug(name)}${MINDMAP_SUFFIX}`)
        onCreated?.(await store.attach({ name, url }))
      }
      return true
    } catch {
      setError(existing ? 'Could not save.' : 'Could not create.')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { loaded, saving, error, track, save }
}
