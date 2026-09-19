import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@atelier/shared-ui'
import { createTheme, listAllThemes, setDefaultTheme, updateTheme } from '../api'
import type { Theme, ThemeColors } from '../types'

export function useThemes(onDefaultLoaded: (theme: Theme) => void) {
  const { reload } = useTheme()
  const [themes, setThemes] = useState<Theme[]>([])
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const onLoaded = useRef(onDefaultLoaded)
  onLoaded.current = onDefaultLoaded

  const refresh = useCallback(async () => {
    const catalog = await listAllThemes()
    setThemes(catalog.themes)
    setDefaultId(catalog.defaultId)
    await reload()
    return catalog
  }, [reload])

  useEffect(() => {
    let active = true
    refresh()
      .then(catalog => {
        if (!active) return
        const current = catalog.themes.find(theme => theme.id === catalog.defaultId)
        if (current) onLoaded.current(current)
      })
      .catch(() => {
        if (active) setError('Could not load the themes.')
      })
    return () => {
      active = false
    }
  }, [refresh])

  const attempt = async <T>(action: () => Promise<T>, fallback: string): Promise<T | null> => {
    setError(null)
    try {
      const result = await action()
      await refresh()
      return result
    } catch {
      setError(fallback)
      return null
    }
  }

  const create = async (colors: ThemeColors): Promise<string | null> => {
    const created = await attempt(() => createTheme(colors), 'Could not create the theme.')
    return created?.id ?? null
  }

  const overwrite = (theme: Theme, colors: ThemeColors) =>
    attempt(
      () => updateTheme(theme.id, { name: theme.name, visible: theme.visible, colors }),
      'Could not save the theme.',
    )

  const rename = async (theme: Theme, name: string): Promise<boolean> => {
    if (name === theme.name) return true
    const renamed = await attempt(async () => {
      await updateTheme(theme.id, { name, visible: theme.visible, colors: theme.colors })
      return true
    }, 'Could not rename the theme.')
    return renamed ?? false
  }

  const toggleVisible = (theme: Theme) =>
    attempt(
      () => updateTheme(theme.id, { name: theme.name, visible: !theme.visible, colors: theme.colors }),
      'Could not change the visibility.',
    )

  const setDefault = (theme: Theme) => attempt(() => setDefaultTheme(theme.id), 'Could not set the default theme.')

  return { themes, defaultId, error, create, overwrite, rename, toggleVisible, setDefault }
}
