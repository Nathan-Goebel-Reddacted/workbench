import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyMindmap, readMindmap, type Mindmap } from '@content'
import { readUpload, rewriteUpload } from '../api/uploads'
import type { Document, MindmapDocumentStore } from '../domain/document'

export function useMindmapFile(
  store: MindmapDocumentStore,
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
        onCreated?.(await store.createMindmap(name, current.current))
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
