import { useEffect, useRef, useState } from 'react'

const SAVE_DELAY_MS = 400

export function useDraft<T>(value: T, onChange: (value: T) => void, beginInteraction: () => () => void) {
  const [draft, setDraft] = useState(value)
  const save = useRef(onChange)
  save.current = onChange
  const pending = useRef<T | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const endInteraction = useRef<(() => void) | null>(null)

  const flush = () => {
    window.clearTimeout(timer.current)
    if (pending.current !== null) save.current(pending.current)
    pending.current = null
    endInteraction.current?.()
    endInteraction.current = null
  }

  useEffect(() => () => flush(), [])

  const update = (next: T) => {
    setDraft(next)
    pending.current = next
    endInteraction.current ??= beginInteraction()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
  }

  return { draft, update }
}
