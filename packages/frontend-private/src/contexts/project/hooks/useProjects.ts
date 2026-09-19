import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr, isAbort } from '../../../shared/api/http'
import { createProject, listProjects, setProjectVisibility } from '../api'
import type { Category } from '../../../shared/domain/category'
import type { ProjectSummary } from '../types'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await listProjects(signal))
    } catch (err: unknown) {
      if (!isAbort(err)) setError('Could not load the projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    reload(controller.signal)
    return () => controller.abort()
  }, [reload])

  const create = async (name: string, category?: Category): Promise<boolean> => {
    setCreating(true)
    setCreateError(null)
    try {
      await createProject(name, category)
      await reload()
      return true
    } catch (err) {
      setCreateError(errorDetailOr(err, 'Could not create.'))
      return false
    } finally {
      setCreating(false)
    }
  }

  const toggleVisibility = async (project: ProjectSummary): Promise<void> => {
    const visible = !project.visible
    setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, visible } : p)))
    try {
      await setProjectVisibility(project.id, visible)
    } catch {
      setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, visible: project.visible } : p)))
    }
  }

  return { projects, loading, error, createError, creating, create, toggleVisibility }
}
