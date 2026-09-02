// Modale d'édition d'un mindmap, dans ses deux modes.
//
//  - création : le mindmap n'existe nulle part. On POST le JSON sur /uploads, qui lui
//    attribue son nom définitif, puis on attache le Document à la ressource porteuse.
//  - édition : le fichier existe. On le réécrit en place (PUT /uploads/:filename) sans
//    toucher au Document — l'URL et l'id restent stables, donc les sections de layout
//    qui pointent dessus continuent de fonctionner.
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import { MINDMAP_SUFFIX, emptyMindmap, readMindmap, resolveUploadUrl, type Mindmap } from '@atelier/content-renderer'
import { MindmapEditor } from './MindmapEditor'

type Props = {
  apiUrl: string
  /** Chemin de la ressource porteuse, sans l'API_URL — ex. `/projects/{id}`. Création uniquement. */
  resourcePath: string
  /** Fourni en mode édition : le mindmap à rouvrir. */
  document?: { id: string; name: string; url: string }
  onClose: () => void
  /** Appelé après une création réussie, pour que l'appelant ajoute le document à sa liste. */
  onCreated?: (document: { id: string; name: string; url: string; type: string }) => void
}

export function MindmapModal({ apiUrl, resourcePath, document: existing, onClose, onCreated }: Props) {
  const isEdition = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? 'Mindmap')
  const [loaded, setLoaded] = useState<Mindmap | null>(isEdition ? null : emptyMindmap())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le mindmap courant vit dans une ref : l'éditeur en émet un à chaque frappe, et
  // repasser par un state ferait re-rendre le canevas à chaque caractère.
  const current = useRef<Mindmap>(emptyMindmap())
  const handleChange = useCallback((mindmap: Mindmap) => {
    current.current = mindmap
  }, [])

  useEffect(() => {
    if (!existing) return

    let cancelled = false
    fetch(resolveUploadUrl(existing.url, apiUrl), { credentials: 'include' })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(json => {
        if (cancelled) return
        const mindmap = readMindmap(json)
        current.current = mindmap
        setLoaded(mindmap)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossible de charger ce mindmap.')
        setLoaded(emptyMindmap())
      })

    return () => {
      cancelled = true
    }
  }, [apiUrl, existing])

  const save = async () => {
    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      if (existing) {
        await rewrite(apiUrl, existing.url, current.current)
      } else {
        const url = await upload(apiUrl, name.trim(), current.current)
        const created = await attach(apiUrl, resourcePath, name.trim(), url)
        onCreated?.(created)
      }
      onClose()
    } catch {
      setError(existing ? "Erreur lors de l'enregistrement." : 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <input
            style={nameInputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom du mindmap"
            // En édition, le nom vit sur le Document : le renommer demanderait de
            // recréer le document, ce que cette modale ne fait pas.
            disabled={isEdition}
          />
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={bodyStyle}>
          {loaded === null ? (
            <p style={mutedStyle}>Chargement…</p>
          ) : (
            <MindmapEditor initial={loaded} onChange={handleChange} />
          )}
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={save} disabled={saving || loaded === null}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>,
    window.document.body,
  )
}

// Le nom du fichier est sans importance — le serveur le remplace par un UUID — mais
// son suffixe, lui, est ce qui fera reconnaître un mindmap partout ensuite.
async function upload(apiUrl: string, name: string, mindmap: Mindmap): Promise<string> {
  const blob = new Blob([JSON.stringify(mindmap)], { type: 'application/json' })
  const form = new FormData()
  form.append('file', blob, `${slug(name)}${MINDMAP_SUFFIX}`)

  const response = await fetch(`${apiUrl}/uploads`, { method: 'POST', credentials: 'include', body: form })
  if (!response.ok) throw new Error(String(response.status))

  // Comme FileUpload : le chemin est persisté relatif, et l'origine résolue au rendu.
  const { url } = (await response.json()) as { url: string }
  return url
}

async function rewrite(apiUrl: string, url: string, mindmap: Mindmap): Promise<void> {
  const filename = url.slice(url.lastIndexOf('/') + 1)
  const response = await fetch(`${apiUrl}/uploads/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(mindmap),
  })
  if (!response.ok) throw new Error(String(response.status))
}

async function attach(apiUrl: string, resourcePath: string, name: string, url: string) {
  const document = { name, url, type: 'mindmap' }
  const response = await fetch(`${apiUrl}${resourcePath}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(document),
  })
  if (!response.ok && response.status !== 204) throw new Error(String(response.status))

  // La route ne renvoie pas le document créé : l'identifiant local ne sert qu'à la
  // liste affichée, il sera remplacé au prochain chargement de la page.
  return { id: crypto.randomUUID(), ...document }
}

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mindmap'
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'var(--color-bg)',
  opacity: 0.98,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
}
const modalStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '1100px',
  height: '100%',
  maxHeight: '90vh',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1rem',
  gap: '0.75rem',
  boxSizing: 'border-box',
}
const headerStyle: CSSProperties = { display: 'flex', gap: '0.75rem', alignItems: 'center' }
const nameInputStyle: CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  fontSize: '0.95rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
const bodyStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex' }
const footerStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }
const errorStyle: CSSProperties = { fontSize: '0.85rem', color: 'var(--color-primary)', margin: 0 }
const mutedStyle: CSSProperties = { fontSize: '0.85rem', color: 'var(--color-text-muted)' }
