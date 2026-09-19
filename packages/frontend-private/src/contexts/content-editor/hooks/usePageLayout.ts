import { useCallback, useEffect, useState } from 'react'
import type { PageLayoutDto, SectionPosition } from '@atelier/content-renderer'
import { errorDetailOr } from '../../../shared/api/errors'
import { addSection, ensurePageLayout, moveSection, removeSection, updateSectionContent } from '../api'
import type { PageType, SectionContent, SectionType } from '../widgets'

export function usePageLayout(pageType: PageType, pageRef: string) {
  const [layout, setLayout] = useState<PageLayoutDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLayout(await ensurePageLayout(pageType, pageRef))
    } catch {
      setError('Could not load the layout.')
    } finally {
      setLoading(false)
    }
  }, [pageType, pageRef])

  useEffect(() => {
    load()
  }, [load])

  const add = async (type: SectionType): Promise<void> => {
    if (!layout) return
    try {
      await addSection(layout.id, { type })
      await load()
    } catch {
      setError('Could not add the component.')
    }
  }

  const updateContent = async (sectionId: string, content: SectionContent): Promise<void> => {
    if (!layout) return
    setLayout(prev =>
      prev ? { ...prev, sections: prev.sections.map(s => (s.id === sectionId ? { ...s, content } : s)) } : prev,
    )
    try {
      setError(null)
      await updateSectionContent(layout.id, sectionId, content)
      setLayout(await ensurePageLayout(pageType, pageRef))
    } catch (err) {
      setError(errorDetailOr(err, 'Could not update the content.'))
      await load()
    }
  }

  const move = async (sectionId: string, position: SectionPosition): Promise<void> => {
    if (!layout) return
    setLayout(prev =>
      prev ? { ...prev, sections: prev.sections.map(s => (s.id === sectionId ? { ...s, ...position } : s)) } : prev,
    )
    try {
      await moveSection(layout.id, sectionId, position)
    } catch {
      setError('Could not move the section.')
      await load()
    }
  }

  const remove = async (sectionId: string): Promise<void> => {
    if (!layout) return
    try {
      await removeSection(layout.id, sectionId)
      setLayout(prev => (prev ? { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) } : prev))
    } catch {
      setError('Could not delete.')
    }
  }

  return { layout, loading, error, add, updateContent, move, remove }
}
