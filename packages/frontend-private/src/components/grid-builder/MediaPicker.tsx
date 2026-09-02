import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import { MindmapView, resolveDocumentKind, resolveUploadUrl } from '@atelier/content-renderer'

// Le backend sert la même arborescence pour /media/images et /media/videos :
// la clé `images` porte les médias du type demandé, quel qu'il soit.
type MediaItem = { id: string; name: string; url: string }
type TicketMedia = { ticketId: string; reference: string; title: string; images: MediaItem[] }
type FeatureMedia = { featureId: string; featureName: string; images: MediaItem[]; tickets: TicketMedia[] }
type ProjectMedia = { projectId: string; projectName: string; images: MediaItem[]; features: FeatureMedia[] }

// 'document' : tout document affichable (image, vidéo, mindmap, PDF) — le mode du
// widget document et du carrousel. Les autres restreignent à un seul type.
export type MediaKind = 'image' | 'video' | 'mindmap' | 'document'

type Props = {
  apiUrl: string
  kind: MediaKind
  selectedUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}

const KIND_CONFIG: Record<MediaKind, { endpoint: string; title: string; empty: string }> = {
  image: {
    endpoint: '/media/images',
    title: 'Choisir une image existante',
    empty: "Aucune image n'est attachée à un projet, une feature ou un ticket.",
  },
  video: {
    endpoint: '/media/videos',
    title: 'Choisir une vidéo existante',
    empty: "Aucune vidéo n'est attachée à un projet, une feature ou un ticket.",
  },
  mindmap: {
    endpoint: '/media/mindmaps',
    title: 'Choisir un mindmap existant',
    empty: "Aucun mindmap n'est attaché à un projet, une feature ou un ticket.",
  },
  document: {
    endpoint: '/media/documents',
    title: 'Choisir un document existant',
    empty: "Aucun document n'est attaché à un projet, une feature ou un ticket.",
  },
}

function countProjectItems(project: ProjectMedia): number {
  return (
    project.images.length +
    project.features.reduce((sum, f) => sum + f.images.length + f.tickets.reduce((s, t) => s + t.images.length, 0), 0)
  )
}

function countFeatureItems(feature: FeatureMedia): number {
  return feature.images.length + feature.tickets.reduce((sum, t) => sum + t.images.length, 0)
}

function allGroupIds(projects: ProjectMedia[]): string[] {
  return projects.flatMap(p => [
    p.projectId,
    ...p.features.flatMap(f => [f.featureId, ...f.tickets.map(t => t.ticketId)]),
  ])
}

// Galerie des médias déjà attachés aux projets / features / tickets.
// Le backend ne renvoie que les branches qui portent au moins un média :
// aucun filtrage supplémentaire n'est nécessaire ici.
export function MediaPicker({ apiUrl, kind, selectedUrl, onSelect, onClose }: Props) {
  const config = KIND_CONFIG[kind]
  const [projects, setProjects] = useState<ProjectMedia[] | null>(null)
  // Groupes ouverts, tous niveaux confondus (les identifiants sont des UUID, pas de collision).
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiUrl}${config.endpoint}`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<ProjectMedia[]>) : []))
      .then(data => {
        setProjects(data)
        // Tout replié sauf le premier projet : la liste reste courte à l'ouverture
        // sans obliger à un clic quand il n'y a qu'un projet.
        setOpenIds(new Set(data.length > 0 ? [data[0].projectId] : []))
      })
      .catch(err => {
        if (err.name !== 'AbortError') setProjects([])
      })
    return () => controller.abort()
  }, [apiUrl, config.endpoint])

  const toggle = (id: string) =>
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const choose = (url: string) => {
    onSelect(url)
    onClose()
  }

  const ids = projects ? allGroupIds(projects) : []
  const allOpen = ids.length > 0 && ids.every(id => openIds.has(id))

  return createPortal(
    <div style={overlayStyle} onClick={onClose} onPointerDown={e => e.stopPropagation()}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>{config.title}</span>
          <div style={headerActionsStyle}>
            {ids.length > 0 && (
              <button style={linkButtonStyle} onClick={() => setOpenIds(allOpen ? new Set() : new Set(ids))}>
                {allOpen ? 'Tout replier' : 'Tout déplier'}
              </button>
            )}
            <button style={closeStyle} onClick={onClose} title="Fermer">
              ✕
            </button>
          </div>
        </div>

        <div style={bodyStyle}>
          {projects === null && <p style={mutedStyle}>Chargement…</p>}
          {projects?.length === 0 && <p style={mutedStyle}>{config.empty}</p>}
          {projects?.map(project => (
            <div key={project.projectId} style={groupStyle}>
              <GroupHeader
                label={`📁 ${project.projectName}`}
                count={countProjectItems(project)}
                open={openIds.has(project.projectId)}
                onToggle={() => toggle(project.projectId)}
                style={projectLabelStyle}
              />

              {openIds.has(project.projectId) && (
                <>
                  <Thumbnails items={project.images} selectedUrl={selectedUrl} onChoose={choose} apiUrl={apiUrl} />

                  {project.features.map(feature => (
                    <div key={feature.featureId} style={nestedStyle}>
                      <GroupHeader
                        label={`⚙ ${feature.featureName}`}
                        count={countFeatureItems(feature)}
                        open={openIds.has(feature.featureId)}
                        onToggle={() => toggle(feature.featureId)}
                        style={featureLabelStyle}
                      />

                      {openIds.has(feature.featureId) && (
                        <>
                          <Thumbnails
                            items={feature.images}
                            selectedUrl={selectedUrl}
                            onChoose={choose}
                            apiUrl={apiUrl}
                          />

                          {feature.tickets.map(ticket => (
                            <div key={ticket.ticketId} style={nestedStyle}>
                              <GroupHeader
                                label={`🎫 ${ticket.reference} — ${ticket.title}`}
                                count={ticket.images.length}
                                open={openIds.has(ticket.ticketId)}
                                onToggle={() => toggle(ticket.ticketId)}
                                style={ticketLabelStyle}
                              />
                              {openIds.has(ticket.ticketId) && (
                                <Thumbnails
                                  items={ticket.images}
                                  selectedUrl={selectedUrl}
                                  onChoose={choose}
                                  apiUrl={apiUrl}
                                />
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

type GroupHeaderProps = {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  style: CSSProperties
}

function GroupHeader({ label, count, open, onToggle, style }: GroupHeaderProps) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} style={{ ...groupHeaderStyle, ...style }}>
      <span style={chevronStyle}>{open ? '▾' : '▸'}</span>
      <span style={groupLabelTextStyle}>{label}</span>
      <span style={countStyle}>{count}</span>
    </button>
  )
}

type ThumbnailsProps = {
  apiUrl: string
  items: MediaItem[]
  selectedUrl: string
  onChoose: (url: string) => void
}

// La vignette se décide par l'URL du média, pas par le type demandé : en mode
// « all » la liste mélange images, vidéos et mindmaps.
function Thumbnails({ items, selectedUrl, onChoose, apiUrl }: ThumbnailsProps) {
  if (items.length === 0) return null
  return (
    <div style={gridStyle}>
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          title={item.name}
          onClick={() => onChoose(item.url)}
          style={item.url === selectedUrl ? { ...thumbButtonStyle, ...thumbSelectedStyle } : thumbButtonStyle}
        >
          <Thumbnail item={item} apiUrl={apiUrl} />
          <span style={thumbNameStyle}>{item.name}</span>
        </button>
      ))}
    </div>
  )
}

function Thumbnail({ item, apiUrl }: { item: MediaItem; apiUrl: string }) {
  // Les médias sont stockés en chemin relatif : l'origine est ajoutée à l'affichage.
  const url = resolveUploadUrl(item.url, apiUrl)
  const kind = resolveDocumentKind(url)

  // Le mindmap se dessine depuis son JSON, comme partout ailleurs.
  if (kind === 'mindmap')
    return (
      <div style={thumbMediaStyle}>
        <MindmapView url={url} apiUrl={apiUrl} padding={8} />
      </div>
    )

  // preload="metadata" suffit à afficher la première image sans charger la vidéo.
  if (kind === 'video') return <video src={url} style={thumbMediaStyle} muted preload="metadata" />

  if (kind === 'pdf') return <div style={thumbFallbackStyle}>📄</div>

  return <img src={url} alt={item.name} style={thumbMediaStyle} />
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1100,
  backdropFilter: 'brightness(0.45) blur(2px)',
  WebkitBackdropFilter: 'brightness(0.45) blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}
const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  overflow: 'hidden',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.25rem',
  borderBottom: '1px solid var(--color-border)',
}
const titleStyle: CSSProperties = { fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }
const headerActionsStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem' }
const linkButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  color: 'var(--color-primary)',
  padding: 0,
}
const closeStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
}
const bodyStyle: CSSProperties = {
  padding: '1.25rem',
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
}
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  padding: '1rem 1.25rem',
  borderTop: '1px solid var(--color-border)',
}
const groupStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' }
const nestedStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginLeft: '1rem',
  paddingLeft: '0.75rem',
  borderLeft: '1px solid var(--color-border)',
}
const groupHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '0.15rem 0',
  cursor: 'pointer',
  textAlign: 'left',
}
const chevronStyle: CSSProperties = { fontSize: '0.7rem', color: 'var(--color-text-muted)', width: '0.75rem' }
const groupLabelTextStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const countStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  padding: '0.05rem 0.4rem',
  border: '1px solid var(--color-border)',
  borderRadius: '999px',
}
const projectLabelStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }
const featureLabelStyle: CSSProperties = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }
const ticketLabelStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '0.5rem',
}
const thumbButtonStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0.25rem',
  backgroundColor: 'var(--color-bg)',
  cursor: 'pointer',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  textAlign: 'left',
}
const thumbSelectedStyle: CSSProperties = {
  borderColor: 'var(--color-primary)',
  boxShadow: '0 0 0 1px var(--color-primary)',
}
const thumbMediaStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover',
  borderRadius: '4px',
  backgroundColor: 'var(--color-surface)',
}
// Le PDF n'a pas de vignette rendable sans lecteur : une icône tient lieu d'aperçu.
const thumbFallbackStyle: CSSProperties = {
  ...thumbMediaStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
}
const thumbNameStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--color-text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const mutedStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)' }
