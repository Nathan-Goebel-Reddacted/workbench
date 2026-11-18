import { useCallback, useEffect, useRef, useState } from 'react'
import { useShowPopup } from '@atelier/shared-ui'
import {
  clearBindingCache,
  type ComponentKind,
  type ElementTransform,
  type PageElementDto,
  type ScreenSize,
} from '@content'
import { errorDetailOr } from '../../../shared/api/errors'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import {
  addElement,
  deleteElement,
  duplicateElement,
  ensurePage,
  hideElement,
  moveElement,
  readPage,
  regenerateLayout,
  removeComponent,
  reorderElement,
  setComponent,
} from '../api'
import type { Page, ReorderDirection } from '../types'
import type { PageType } from '../widgets'

type Status = 'loading' | 'ready' | 'error'

export function usePage(pageType: PageType, pageRef: string) {
  const canEdit = useCanEdit()
  const showPopup = useShowPopup()
  const [page, setPage] = useState<Page | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [revision, setRevision] = useState(0)
  const interactions = useRef(0)

  const load = useCallback(
    async (refresh = false) => {
      try {
        const next = canEdit ? await ensurePage(pageType, pageRef) : await readPage(pageType, pageRef)
        if (refresh) {
          clearBindingCache()
          setRevision(r => r + 1)
        }
        setPage(next)
        setStatus('ready')
      } catch (error) {
        setStatus(current => (current === 'ready' ? current : 'error'))
        showPopup(errorDetailOr(error, 'Could not load the page.'))
      }
    },
    [canEdit, pageType, pageRef, showPopup],
  )

  useEffect(() => {
    setStatus('loading')
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => {
      if (interactions.current === 0) void load(true)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const beginInteraction = useCallback(() => {
    interactions.current += 1
    let ended = false
    return () => {
      if (ended) return
      ended = true
      interactions.current -= 1
    }
  }, [])

  const patchElement = (elementId: string, patch: (element: PageElementDto) => PageElementDto) =>
    setPage(prev => (prev ? { ...prev, elements: prev.elements.map(e => (e.id === elementId ? patch(e) : e)) } : prev))

  const run = async (operation: () => Promise<unknown>, failure: string) => {
    try {
      await operation()
    } catch (error) {
      showPopup(errorDetailOr(error, failure))
    }
    await load()
  }

  const pageId = page?.id ?? ''

  const add = (screen: ScreenSize, visibleTop: number) =>
    run(() => addElement(pageId, screen, visibleTop), 'Could not add the element.')

  const hide = (elementId: string, screen: ScreenSize, hidden: boolean) => {
    patchElement(elementId, element => ({
      ...element,
      layout: { ...element.layout, [screen]: { ...element.layout[screen], hidden } },
    }))
    return run(() => hideElement(pageId, elementId, screen, hidden), 'Could not hide the element.')
  }

  const regenerate = (screen: ScreenSize) =>
    run(() => regenerateLayout(pageId, screen), 'Could not regenerate the layout.')

  const move = (elementId: string, screen: ScreenSize, transform: ElementTransform) => {
    patchElement(elementId, element => ({
      ...element,
      layout: { ...element.layout, [screen]: { ...element.layout[screen], transform } },
    }))
    return run(() => moveElement(pageId, elementId, screen, transform), 'Could not move the element.')
  }

  const reorder = (elementId: string, direction: ReorderDirection) =>
    run(() => reorderElement(pageId, elementId, direction), 'Could not reorder the element.')

  const duplicate = async (elementId: string): Promise<string | null> => {
    let copy: string | null = null
    await run(async () => {
      copy = (await duplicateElement(pageId, elementId)).id
    }, 'Could not duplicate the element.')
    return copy
  }

  const set = (elementId: string, kind: ComponentKind, value: object) =>
    run(() => setComponent(pageId, elementId, kind, value), 'Could not save the component.')

  const unset = (elementId: string, kind: ComponentKind) =>
    run(() => removeComponent(pageId, elementId, kind), 'Could not remove the component.')

  const remove = (elementId: string) => run(() => deleteElement(pageId, elementId), 'Could not delete the element.')

  return {
    page,
    status,
    revision,
    canEdit,
    beginInteraction,
    add,
    move,
    hide,
    regenerate,
    reorder,
    duplicate,
    set,
    unset,
    remove,
  }
}
