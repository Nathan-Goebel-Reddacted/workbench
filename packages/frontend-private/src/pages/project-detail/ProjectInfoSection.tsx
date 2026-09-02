import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../../contexts/EditPermissionContext'

type Category = 'personal' | 'professional' | 'academic'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personnel' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'academic', label: 'Scolaire' },
]

type Props = {
  projectId: string
  initialName: string
  initialDescription: string
  initialCategory: string
  apiUrl: string
}

export function ProjectInfoSection({ projectId, initialName, initialDescription, initialCategory, apiUrl }: Props) {
  const canEdit = useCanEdit()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [category, setCategory] = useState<Category>(initialCategory as Category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), description: description.trim(), category }),
      })
      if (res.ok || res.status === 204) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError('Erreur lors de la sauvegarde.')
      }
    } catch {
      setError('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section style={sectionStyle}>
      <p style={labelStyle}>Info</p>
      {error && <p style={errorStyle}>{error}</p>}
      <div style={fieldStyle}>
        <label style={fieldLabelStyle}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          readOnly={!canEdit}
          style={{ ...inputStyle, cursor: canEdit ? 'text' : 'default' }}
        />
      </div>
      <div style={fieldStyle}>
        <label style={fieldLabelStyle}>Catégorie</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as Category)}
          disabled={!canEdit}
          style={{ ...inputStyle, cursor: canEdit ? 'pointer' : 'default' }}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={fieldLabelStyle}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          readOnly={!canEdit}
          style={{ ...inputStyle, resize: canEdit ? 'vertical' : 'none', cursor: canEdit ? 'text' : 'default' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
        {saved && <span style={savedStyle}>Saved</span>}
        <Button variant="primary" onClick={handleSave} disabled={!canEdit || saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const fieldStyle: CSSProperties = { marginBottom: '0.75rem' }
const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  marginBottom: '0.25rem',
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
  boxSizing: 'border-box',
}
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }
const savedStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
