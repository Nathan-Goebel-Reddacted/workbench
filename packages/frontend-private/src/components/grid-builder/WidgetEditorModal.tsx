import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../pages/project-detail/FileUpload'
import { MediaPicker } from './MediaPicker'
import { DropZone } from './DropZone'
import { TextWidgetEditor } from './TextWidgetEditor'
import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  isEmbeddedVideo,
  isUnplayableFile,
  resolveVideoSource,
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
  readBackgroundContent,
  readCodeContent,
  readContactFormContent,
  readEmbedContent,
  readImageContent,
  readLinkAreaContent,
  readLinkContent,
  readTextContent,
  CODE_LANGUAGE_OPTIONS,
  isEmbeddableUrl,
  LINK_AREA_TARGET_OPTIONS,
  FORM_FIELD_TYPE_OPTIONS,
  resolveDocumentKind,
  resolveUploadUrl,
  MindmapView,
  type DocumentKind,
  type ExternalLink,
  type FormField,
  type FormFieldType,
  type SectionDto,
  type TextContent,
} from '@atelier/content-renderer'
import type { SectionContent } from './widgets'

type CarouselItem = { url: string; caption: string }
type ProjectSummary = { id: string; name: string }

// Les extensions (IMAGE_EXTENSIONS / VIDEO_EXTENSIONS) servent de repli au drop :
// file.type est souvent vide pour les conteneurs exotiques.
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

// Les extensions sont listées en plus du type MIME : selon l'OS, le sélecteur de
// fichier masque .mkv ou .avi si seul `video/*` est demandé.
const toAccept = (mimes: string[], extensions: string[]) => [...mimes, ...extensions.map(e => `.${e}`)].join(',')

const IMAGE_ACCEPT = toAccept(['image/*'], IMAGE_EXTENSIONS)

// Le widget document accepte en plus le PDF et le mindmap (un .json au suffixe
// conventionnel `.mindmap.json`).
const DOCUMENT_EXTENSIONS = [...MEDIA_EXTENSIONS, 'pdf', 'json']
const DOCUMENT_ACCEPT = toAccept(['image/*', 'video/*', 'application/pdf', 'application/json'], DOCUMENT_EXTENSIONS)

type Props = {
  section: SectionDto
  apiUrl: string
  onSave: (content: SectionContent, contentRef: string | null) => void
  onClose: () => void
}

export function WidgetEditorModal({ section, apiUrl, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<SectionContent>({ ...section.content })

  const set = (key: string, value: unknown) => setDraft(prev => ({ ...prev, [key]: value }))

  const isText = section.type === 'text'
  // Le widget lien garde son contentRef (les liens du projet) tout en étant éditable :
  // les liens externes saisis ici s'ajoutent aux liens hérités.
  const isLink = section.type === 'link'
  const readOnlyRef = !isText && !isLink && !!section.contentRef

  const handleSave = () => {
    onSave(draft, isText ? null : section.contentRef)
    onClose()
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose} onPointerDown={e => e.stopPropagation()}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Éditer — {section.type}</span>
          <button style={closeStyle} onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          {isText ? (
            <TextWidgetEditor
              value={readTextContent(draft)}
              onChange={(next: TextContent) => setDraft(next as SectionContent)}
              apiUrl={apiUrl}
            />
          ) : readOnlyRef ? (
            <p style={mutedStyle}>
              Ce composant est lié à une donnée existante : <code>{section.contentRef}</code>. Son contenu est géré
              ailleurs.
            </p>
          ) : (
            <>
              <Editor type={section.type} draft={draft} set={set} apiUrl={apiUrl} />
            </>
          )}
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={readOnlyRef}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

type EditorProps = {
  type: string
  draft: SectionContent
  set: (key: string, value: unknown) => void
  apiUrl: string
}

function Editor({ type, draft, set, apiUrl }: EditorProps) {
  if (type === 'document') {
    return <DocumentEditor draft={draft} set={set} apiUrl={apiUrl} />
  }

  if (type === 'carousel') {
    return <CarouselEditor draft={draft} set={set} apiUrl={apiUrl} />
  }

  if (type === 'link') {
    return <LinkEditor draft={draft} set={set} apiUrl={apiUrl} />
  }

  if (type === 'background') {
    return <BackgroundEditor draft={draft} set={set} />
  }

  if (type === 'projectCard') {
    return <ProjectCardEditor draft={draft} set={set} apiUrl={apiUrl} />
  }

  if (type === 'linkArea') {
    return <LinkAreaEditor draft={draft} set={set} apiUrl={apiUrl} />
  }

  if (type === 'contactForm') {
    return <ContactFormEditor draft={draft} set={set} />
  }

  if (type === 'code') {
    return <CodeEditor draft={draft} set={set} />
  }

  if (type === 'embed') {
    return <EmbedEditor draft={draft} set={set} />
  }

  return <p style={mutedStyle}>Aucun éditeur disponible pour ce type de composant.</p>
}

// Éditeur du widget document unifié. Une seule URL, dont le type résolu commande les
// réglages proposés : l'ajustement et le cadrage n'ont de sens que pour une image, et
// l'aperçu prend la forme correspondante.
function DocumentEditor({
  draft,
  set,
  apiUrl,
}: {
  draft: SectionContent
  set: (k: string, v: unknown) => void
  apiUrl: string
}) {
  const { url, alt, fit, position, radius } = readImageContent(draft)
  const [picking, setPicking] = useState(false)
  const kind = resolveDocumentKind(url)

  return (
    <>
      <div style={fieldStyle}>
        <span style={labelStyle}>URL du document</span>
        <DropZone
          apiUrl={apiUrl}
          mimePrefixes={['image/', 'video/', 'application/pdf', 'application/json']}
          extensions={DOCUMENT_EXTENSIONS}
          hint="Glissez une image, une vidéo, un PDF ou un mindmap, ou collez un lien YouTube / Vimeo."
          onUploaded={next => set('url', next)}
        >
          <div style={rowStyle}>
            <input
              style={inputStyle}
              value={url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://… (fichier, YouTube ou Vimeo)"
            />
            <FileUpload apiUrl={apiUrl} accept={DOCUMENT_ACCEPT} label="📁" onUploaded={next => set('url', next)} />
            <Button variant="secondary" onClick={() => setPicking(true)}>
              📄 Bibliothèque
            </Button>
          </div>
        </DropZone>
      </div>

      {picking && (
        <MediaPicker
          apiUrl={apiUrl}
          kind="document"
          selectedUrl={url}
          onSelect={next => set('url', next)}
          onClose={() => setPicking(false)}
        />
      )}

      {/* Le texte alternatif sert d'alt à l'image et de titre à l'iframe du PDF. */}
      {(kind === 'image' || kind === 'pdf') && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Texte alternatif</span>
          <input style={inputStyle} value={alt} onChange={e => set('alt', e.target.value)} />
        </label>
      )}

      {kind === 'image' && (
        <div style={rowStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Ajustement</span>
            <select style={inputStyle} value={fit} onChange={e => set('fit', e.target.value)}>
              {IMAGE_FIT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Cadrage</span>
            <select
              style={inputStyle}
              value={position}
              disabled={fit === 'fill'}
              onChange={e => set('position', e.target.value)}
            >
              {IMAGE_POSITION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* L'arrondi s'applique aussi au PDF et au mindmap ; la vidéo n'en tient pas compte. */}
      {kind !== 'video' && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Arrondi des coins — {radius}px</span>
          <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
        </label>
      )}

      {url && (
        <DocumentPreview
          url={url}
          kind={kind}
          alt={alt}
          fit={fit}
          position={position}
          radius={radius}
          apiUrl={apiUrl}
        />
      )}
    </>
  )
}

function DocumentPreview({
  url,
  kind,
  alt,
  fit,
  position,
  radius,
  apiUrl,
}: {
  url: string
  kind: DocumentKind
  alt: string
  fit: string
  position: string
  radius: number
  apiUrl: string
}) {
  // Résolu ici seulement : le champ d'édition, lui, doit continuer d'afficher et de
  // réenregistrer le chemin relatif tel qu'il est stocké.
  const resolved = resolveUploadUrl(url, apiUrl)
  const source = resolveVideoSource(resolved)

  if (kind === 'unknown') {
    return (
      <div style={fieldStyle}>
        <span style={warningStyle}>
          Ce lien ne correspond à aucun format reconnu (image, vidéo, PDF ou mindmap). Le composant restera vide sur la
          page.
        </span>
      </div>
    )
  }

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>Aperçu{kind === 'video' ? ` — ${source.label}` : ''}</span>
      <div style={imagePreviewBoxStyle}>
        {kind === 'image' && (
          <img
            src={resolved}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: fit as CSSProperties['objectFit'],
              objectPosition: position,
              borderRadius: `${radius}px`,
            }}
          />
        )}
        {kind === 'mindmap' && <MindmapView url={resolved} apiUrl={apiUrl} />}
        {kind === 'pdf' && (
          <iframe
            src={resolved}
            title={alt || 'Aperçu du PDF'}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
        {kind === 'video' &&
          (isEmbeddedVideo(source) ? (
            <iframe
              src={source.src}
              title="Aperçu de la vidéo"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <video src={source.src} controls preload="metadata" style={{ width: '100%', height: '100%' }} />
          ))}
      </div>
      {kind === 'video' && isUnplayableFile(source) && (
        <span style={warningStyle}>
          Ce format n'est pas lu nativement par les navigateurs — l'aperçu peut rester vide. Préférez du MP4 (H.264) ou
          du WebM.
        </span>
      )}
    </div>
  )
}

function CarouselEditor({
  draft,
  set,
  apiUrl,
}: {
  draft: SectionContent
  set: (k: string, v: unknown) => void
  apiUrl: string
}) {
  const items = (draft.items as CarouselItem[]) ?? []
  const update = (next: CarouselItem[]) => set('items', next)
  const append = (url: string) => update([...items, { url, caption: '' }])
  const [picking, setPicking] = useState(false)

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>Documents du carrousel — images, vidéos, PDF et mindmaps</span>

      {items.map((item, i) => (
        <div key={i} style={rowStyle}>
          <CarouselThumb url={item.url} apiUrl={apiUrl} />
          <input
            style={inputStyle}
            value={item.url}
            onChange={e => update(items.map((it, j) => (j === i ? { ...it, url: e.target.value } : it)))}
            placeholder="URL"
          />
          <input
            style={inputStyle}
            value={item.caption}
            onChange={e => update(items.map((it, j) => (j === i ? { ...it, caption: e.target.value } : it)))}
            placeholder="Légende"
          />
          <Button variant="ghost" onClick={() => update(items.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}

      <DropZone
        apiUrl={apiUrl}
        mimePrefixes={['image/', 'video/', 'application/pdf', 'application/json']}
        extensions={DOCUMENT_EXTENSIONS}
        hint="Glissez une image, une vidéo, un PDF ou un mindmap pour l'ajouter au carrousel."
        onUploaded={append}
      >
        <div style={rowStyle}>
          <FileUpload apiUrl={apiUrl} accept={DOCUMENT_ACCEPT} label="📁 Ajouter un document" onUploaded={append} />
          <Button variant="secondary" onClick={() => setPicking(true)}>
            🗂️ Bibliothèque
          </Button>
          <Button variant="secondary" onClick={() => update([...items, { url: '', caption: '' }])}>
            + Ligne vide
          </Button>
        </div>
      </DropZone>

      {picking && (
        <MediaPicker
          apiUrl={apiUrl}
          kind="document"
          selectedUrl=""
          onSelect={append}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}

// Vignette de rappel devant chaque ligne : sans elle, une liste d'URL uploadées
// (des UUID) est illisible.
function CarouselThumb({ url, apiUrl }: { url: string; apiUrl: string }) {
  if (!url) return <span style={carouselThumbEmptyStyle}>—</span>

  const resolved = resolveUploadUrl(url, apiUrl)
  const kind = resolveDocumentKind(resolved)
  if (kind === 'video') {
    if (isEmbeddedVideo(resolveVideoSource(resolved))) return <span style={carouselThumbEmptyStyle}>▶</span>
    return <video src={resolved} style={carouselThumbStyle} muted preload="metadata" />
  }
  if (kind === 'mindmap')
    return (
      <div style={carouselThumbStyle}>
        <MindmapView url={resolved} apiUrl={apiUrl} padding={8} />
      </div>
    )
  if (kind === 'pdf') return <span style={carouselThumbEmptyStyle}>📄</span>
  if (kind === 'unknown') return <span style={carouselThumbEmptyStyle}>?</span>
  return <img src={resolved} alt="" style={carouselThumbStyle} />
}

function CodeEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { code, language, wrap } = readCodeContent(draft)

  return (
    <>
      <label style={fieldStyle}>
        <span style={labelStyle}>Code</span>
        <textarea
          style={codeAreaStyle}
          value={code}
          onChange={e => set('code', e.target.value)}
          spellCheck={false}
          placeholder="Collez votre extrait de code ici."
        />
      </label>

      <div style={rowStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Langage</span>
          <select style={inputStyle} value={language} onChange={e => set('language', e.target.value)}>
            {CODE_LANGUAGE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...fieldStyle, justifyContent: 'flex-end' }}>
          <span style={{ ...rowStyle, alignItems: 'center' }}>
            <input type="checkbox" checked={wrap} onChange={e => set('wrap', e.target.checked)} />
            <span style={labelStyle}>Revenir à la ligne</span>
          </span>
        </label>
      </div>

      <p style={mutedStyle}>
        Le code est affiché tel quel, sans coloration syntaxique ni exécution. Le langage n'est qu'une étiquette.
      </p>
    </>
  )
}

function EmbedEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { url, title, radius } = readEmbedContent(draft)
  const invalid = url.trim() !== '' && !isEmbeddableUrl(url)

  return (
    <>
      <label style={fieldStyle}>
        <span style={labelStyle}>URL à intégrer</span>
        <input style={inputStyle} value={url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
      </label>

      {invalid && <p style={mutedStyle}>Seules les adresses http(s) peuvent être intégrées.</p>}

      <label style={fieldStyle}>
        <span style={labelStyle}>Titre (accessibilité)</span>
        <input style={inputStyle} value={title} onChange={e => set('title', e.target.value)} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Arrondi des coins — {radius}px</span>
        <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
      </label>

      <p style={mutedStyle}>
        Tous les sites n'autorisent pas leur affichage dans une page tierce : si le bloc reste vide, c'est que le
        service refuse l'intégration. Utilisez son URL d'embed dédiée quand il en propose une.
      </p>
    </>
  )
}

function BackgroundEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { radius, border } = readBackgroundContent(draft)

  return (
    <>
      <p style={mutedStyle}>
        La couleur n'est pas réglable : le fond prend la surface quand il est posé sur le fond de page, et le fond quand
        il est posé sur un autre fond qui le contient entièrement.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Arrondi des coins — {radius}px</span>
        <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
      </label>

      <label style={{ ...rowStyle, alignItems: 'center' }}>
        <input type="checkbox" checked={border} onChange={e => set('border', e.target.checked)} />
        <span style={labelStyle}>Afficher une bordure</span>
      </label>
    </>
  )
}

function LinkEditor({
  draft,
  set,
  apiUrl,
}: {
  draft: SectionContent
  set: (k: string, v: unknown) => void
  apiUrl: string
}) {
  const { externalLinks } = readLinkContent(draft)
  const update = (next: ExternalLink[]) => set('externalLinks', next)
  const patch = (index: number, changes: Partial<ExternalLink>) =>
    update(externalLinks.map((link, i) => (i === index ? { ...link, ...changes } : link)))

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>Liens externes</span>

      {externalLinks.length === 0 && <span style={mutedStyle}>Aucun lien externe. Ajoutez-en un ci-dessous.</span>}

      {externalLinks.map((link, i) => (
        <div key={i} style={rowStyle}>
          {link.logo ? (
            <img src={resolveUploadUrl(link.logo, apiUrl)} alt="" style={linkLogoStyle} />
          ) : (
            <span style={linkLogoEmptyStyle}>🔗</span>
          )}
          <input
            style={inputStyle}
            value={link.url}
            onChange={e => patch(i, { url: e.target.value })}
            placeholder="https://…"
          />
          <input
            style={inputStyle}
            value={link.displayText}
            onChange={e => patch(i, { displayText: e.target.value })}
            placeholder="Libellé affiché"
          />
          <FileUpload apiUrl={apiUrl} accept={IMAGE_ACCEPT} label="📁" onUploaded={logo => patch(i, { logo })} />
          <Button variant="ghost" onClick={() => update(externalLinks.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}

      <div style={rowStyle}>
        <Button variant="secondary" onClick={() => update([...externalLinks, { url: '', displayText: '', logo: '' }])}>
          + Ajouter un lien
        </Button>
      </div>
    </div>
  )
}

function ProjectCardEditor({
  draft,
  set,
  apiUrl,
}: {
  draft: SectionContent
  set: (k: string, v: unknown) => void
  apiUrl: string
}) {
  return (
    <ProjectSelect
      value={(draft.projectId as string) ?? ''}
      apiUrl={apiUrl}
      label="Projet à afficher"
      onChange={next => set('projectId', next)}
    />
  )
}

// Partagé par le bloc projet et la zone cliquable : les deux désignent un projet existant.
function ProjectSelect({
  value,
  apiUrl,
  label,
  onChange,
}: {
  value: string
  apiUrl: string
  label: string
  onChange: (id: string) => void
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiUrl}/projects`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<ProjectSummary[]>) : []))
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false)
      })
    return () => controller.abort()
  }, [apiUrl])

  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {loading ? (
        <span style={mutedStyle}>Chargement des projets…</span>
      ) : (
        <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Choisir un projet —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </label>
  )
}

// La zone n'a aucun réglage d'apparence : elle est transparente par construction. Seule
// sa cible se choisit — une URL externe ou la page d'un projet.
function LinkAreaEditor({
  draft,
  set,
  apiUrl,
}: {
  draft: SectionContent
  set: (k: string, v: unknown) => void
  apiUrl: string
}) {
  const { target, url, projectId, newTab } = readLinkAreaContent(draft)

  return (
    <>
      <p style={mutedStyle}>
        Zone invisible : elle se place sous les autres composants et rend cliquable toute sa surface libre. Posez-la
        sous un fond ou une image pour les rendre cliquables.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Cible</span>
        <select style={inputStyle} value={target} onChange={e => set('target', e.target.value)}>
          {LINK_AREA_TARGET_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {target === 'url' ? (
        <>
          <label style={fieldStyle}>
            <span style={labelStyle}>URL</span>
            <input style={inputStyle} value={url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
          </label>

          <label style={{ ...rowStyle, alignItems: 'center' }}>
            <input type="checkbox" checked={newTab} onChange={e => set('newTab', e.target.checked)} />
            <span style={labelStyle}>Ouvrir dans un nouvel onglet</span>
          </label>
        </>
      ) : (
        <ProjectSelect
          value={projectId}
          apiUrl={apiUrl}
          label="Projet à ouvrir"
          onChange={next => set('projectId', next)}
        />
      )}
    </>
  )
}

function ContactFormEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { title, fields, submitLabel, successMessage } = readContactFormContent(draft)

  const update = (next: FormField[]) => set('fields', next)
  const patch = (index: number, changes: Partial<FormField>) =>
    update(fields.map((field, i) => (i === index ? { ...field, ...changes } : field)))

  // Réordonnancement à la main : deux boutons suffisent ici, la liste reste courte.
  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  return (
    <>
      <p style={mutedStyle}>
        Les messages arrivent sur l'adresse configurée côté serveur (<code>CONTACT_MAIL_TO</code>) : elle n'est jamais
        exposée sur la page publique.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Titre affiché</span>
        <input
          style={inputStyle}
          value={title}
          onChange={e => set('title', e.target.value)}
          placeholder="Me contacter"
        />
      </label>

      <div style={fieldStyle}>
        <span style={labelStyle}>Champs du formulaire</span>

        {fields.map((field, i) => (
          <div key={field.id} style={rowStyle}>
            <input
              style={inputStyle}
              value={field.label}
              onChange={e => patch(i, { label: e.target.value })}
              placeholder="Libellé du champ"
            />
            <select
              style={inputStyle}
              value={field.type}
              onChange={e => patch(i, { type: e.target.value as FormFieldType })}
            >
              {FORM_FIELD_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label style={{ ...rowStyle, alignItems: 'center', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => patch(i, { required: e.target.checked })}
              />
              <span style={labelStyle}>Obligatoire</span>
            </label>
            <Button variant="ghost" onClick={() => move(i, -1)}>
              ↑
            </Button>
            <Button variant="ghost" onClick={() => move(i, 1)}>
              ↓
            </Button>
            <Button variant="ghost" onClick={() => update(fields.filter((_, j) => j !== i))}>
              ✕
            </Button>
          </div>
        ))}

        <div style={rowStyle}>
          <Button
            variant="secondary"
            onClick={() => update([...fields, { id: crypto.randomUUID(), label: '', type: 'text', required: false }])}
          >
            + Ajouter un champ
          </Button>
        </div>
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Libellé du bouton</span>
        <input style={inputStyle} value={submitLabel} onChange={e => set('submitLabel', e.target.value)} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Message de confirmation</span>
        <input style={inputStyle} value={successMessage} onChange={e => set('successMessage', e.target.value)} />
      </label>
    </>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backdropFilter: 'brightness(0.45) blur(2px)',
  WebkitBackdropFilter: 'brightness(0.45) blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}
const modalStyle: CSSProperties = {
  width: '90vw',
  maxWidth: '90vw',
  height: '90vh',
  maxHeight: '90vh',
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
  gap: '1rem',
}
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  padding: '1rem 1.25rem',
  borderTop: '1px solid var(--color-border)',
}
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const rowStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }
const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: '120px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
const codeAreaStyle: CSSProperties = {
  width: '100%',
  minHeight: '220px',
  resize: 'vertical',
  boxSizing: 'border-box',
  padding: '0.5rem 0.75rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
  whiteSpace: 'pre',
  overflowWrap: 'normal',
  overflowX: 'auto',
}
// Boîte de ratio fixe : reproduit le cadre du widget dans la grille pour que
// l'aperçu montre l'effet réel de l'ajustement et du cadrage.
const imagePreviewBoxStyle: CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  aspectRatio: '16 / 9',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  overflow: 'hidden',
}
const mutedStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)' }
const warningStyle: CSSProperties = { fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }
const carouselThumbStyle: CSSProperties = {
  width: '48px',
  height: '32px',
  flexShrink: 0,
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
}
const linkLogoStyle: CSSProperties = {
  width: '24px',
  height: '24px',
  flexShrink: 0,
  objectFit: 'contain',
  borderRadius: '4px',
}
const linkLogoEmptyStyle: CSSProperties = {
  ...linkLogoStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
}
const carouselThumbEmptyStyle: CSSProperties = {
  ...carouselThumbStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
}
