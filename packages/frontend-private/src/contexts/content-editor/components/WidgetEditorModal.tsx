import type { CSSProperties } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../../shared/components/FileUpload'
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
  MindmapView,
  type DocumentKind,
  type ExternalLink,
  type FormField,
  type FormFieldType,
  type SectionDto,
  type TextContent,
} from '@content'
import type { SectionContent } from '../widgets'
import { useBindableProjects } from '../hooks/useBindables'
import { API_URL, uploadUrl } from '../../../shared/config'

type CarouselItem = { url: string; caption: string }

const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

const toAccept = (mimes: string[], extensions: string[]) => [...mimes, ...extensions.map(e => `.${e}`)].join(',')

const IMAGE_ACCEPT = toAccept(['image/*'], IMAGE_EXTENSIONS)

const DOCUMENT_EXTENSIONS = [...MEDIA_EXTENSIONS, 'pdf', 'json']
const DOCUMENT_ACCEPT = toAccept(['image/*', 'video/*', 'application/pdf', 'application/json'], DOCUMENT_EXTENSIONS)

type Props = {
  section: SectionDto
  onSave: (content: SectionContent) => void
  onClose: () => void
}

export function WidgetEditorModal({ section, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<SectionContent>({ ...section.content })

  const set = (key: string, value: unknown) => setDraft(prev => ({ ...prev, [key]: value }))

  const isText = section.type === 'text'

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose} onPointerDown={e => e.stopPropagation()}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Edit — {section.type}</span>
          <button style={closeStyle} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          {isText ? (
            <TextWidgetEditor
              value={readTextContent(draft)}
              onChange={(next: TextContent) => setDraft(next as SectionContent)}
            />
          ) : (
            <Editor type={section.type} saved={section.content} draft={draft} set={set} />
          )}
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

type EditorProps = {
  type: string
  saved: SectionContent
  draft: SectionContent
  set: (key: string, value: unknown) => void
}

function Editor({ type, saved, draft, set }: EditorProps) {
  if (type === 'document') {
    return <DocumentEditor draft={draft} set={set} />
  }

  if (type === 'carousel') {
    return <CarouselEditor draft={draft} set={set} />
  }

  if (type === 'link') {
    return <LinkEditor draft={draft} set={set} />
  }

  if (type === 'background') {
    return <BackgroundEditor draft={draft} set={set} />
  }

  if (type === 'projectCard') {
    return <ProjectCardEditor draft={draft} set={set} />
  }

  if (type === 'linkArea') {
    return <LinkAreaEditor draft={draft} set={set} />
  }

  if (type === 'contactForm') {
    return <ContactFormEditor saved={saved} draft={draft} set={set} />
  }

  if (type === 'code') {
    return <CodeEditor draft={draft} set={set} />
  }

  if (type === 'embed') {
    return <EmbedEditor draft={draft} set={set} />
  }

  return <p style={mutedStyle}>No editor available for this component type.</p>
}

function DocumentEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { url, alt, fit, position, radius } = readImageContent(draft)
  const [picking, setPicking] = useState(false)
  const kind = resolveDocumentKind(url)

  return (
    <>
      <div style={fieldStyle}>
        <span style={labelStyle}>Document URL</span>
        <DropZone
          mimePrefixes={['image/', 'video/', 'application/pdf', 'application/json']}
          extensions={DOCUMENT_EXTENSIONS}
          hint="Drop an image, a video, a PDF or a mindmap, or paste a YouTube / Vimeo link."
          onUploaded={next => set('url', next)}
        >
          <div style={rowStyle}>
            <input
              style={inputStyle}
              value={url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://… (file, YouTube or Vimeo)"
            />
            <FileUpload accept={DOCUMENT_ACCEPT} label="📁" onUploaded={next => set('url', next)} />
            <Button variant="secondary" onClick={() => setPicking(true)}>
              📄 Library
            </Button>
          </div>
        </DropZone>
      </div>

      {picking && (
        <MediaPicker
          kind="document"
          selectedUrl={url}
          onSelect={next => set('url', next)}
          onClose={() => setPicking(false)}
        />
      )}

      {(kind === 'image' || kind === 'pdf') && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Alt text</span>
          <input style={inputStyle} value={alt} onChange={e => set('alt', e.target.value)} />
        </label>
      )}

      {kind === 'image' && (
        <div style={rowStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Fit</span>
            <select style={inputStyle} value={fit} onChange={e => set('fit', e.target.value)}>
              {IMAGE_FIT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Framing</span>
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

      {kind !== 'video' && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Corner radius — {radius}px</span>
          <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
        </label>
      )}

      {url && <DocumentPreview url={url} kind={kind} alt={alt} fit={fit} position={position} radius={radius} />}
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
}: {
  url: string
  kind: DocumentKind
  alt: string
  fit: string
  position: string
  radius: number
}) {
  const resolved = uploadUrl(url)
  const source = resolveVideoSource(resolved)

  if (kind === 'unknown') {
    return (
      <div style={fieldStyle}>
        <span style={warningStyle}>
          This link matches no known format (image, video, PDF or mindmap). The component will stay empty on the page.
        </span>
      </div>
    )
  }

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>Preview{kind === 'video' ? ` — ${source.label}` : ''}</span>
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
        {kind === 'mindmap' && <MindmapView url={resolved} apiUrl={API_URL} />}
        {kind === 'pdf' && (
          <iframe
            src={resolved}
            title={alt || 'PDF preview'}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
        {kind === 'video' &&
          (isEmbeddedVideo(source) ? (
            <iframe
              src={source.src}
              title="Video preview"
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
          Browsers do not play this format natively — the preview may stay empty. Prefer MP4 (H.264) or WebM.
        </span>
      )}
    </div>
  )
}

function CarouselEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const items = (draft.items as CarouselItem[]) ?? []
  const update = (next: CarouselItem[]) => set('items', next)
  const append = (url: string) => update([...items, { url, caption: '' }])
  const [picking, setPicking] = useState(false)

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>Carousel documents — images, videos, PDFs and mindmaps</span>

      {items.map((item, i) => (
        <div key={i} style={rowStyle}>
          <CarouselThumb url={item.url} />
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
            placeholder="Caption"
          />
          <Button variant="ghost" onClick={() => update(items.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}

      <DropZone
        mimePrefixes={['image/', 'video/', 'application/pdf', 'application/json']}
        extensions={DOCUMENT_EXTENSIONS}
        hint="Drop an image, a video, a PDF or a mindmap to add it to the carousel."
        onUploaded={append}
      >
        <div style={rowStyle}>
          <FileUpload accept={DOCUMENT_ACCEPT} label="📁 Add a document" onUploaded={append} />
          <Button variant="secondary" onClick={() => setPicking(true)}>
            🗂️ Library
          </Button>
          <Button variant="secondary" onClick={() => update([...items, { url: '', caption: '' }])}>
            + Empty row
          </Button>
        </div>
      </DropZone>

      {picking && <MediaPicker kind="document" selectedUrl="" onSelect={append} onClose={() => setPicking(false)} />}
    </div>
  )
}

function CarouselThumb({ url }: { url: string }) {
  if (!url) return <span style={carouselThumbEmptyStyle}>—</span>

  const resolved = uploadUrl(url)
  const kind = resolveDocumentKind(resolved)
  if (kind === 'video') {
    if (isEmbeddedVideo(resolveVideoSource(resolved))) return <span style={carouselThumbEmptyStyle}>▶</span>
    return <video src={resolved} style={carouselThumbStyle} muted preload="metadata" />
  }
  if (kind === 'mindmap')
    return (
      <div style={carouselThumbStyle}>
        <MindmapView url={resolved} apiUrl={API_URL} padding={8} />
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
          placeholder="Paste your code snippet here."
        />
      </label>

      <div style={rowStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Language</span>
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
            <span style={labelStyle}>Wrap lines</span>
          </span>
        </label>
      </div>

      <p style={mutedStyle}>
        The code is shown as is, without syntax highlighting or execution. The language is only a label.
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
        <span style={labelStyle}>URL to embed</span>
        <input style={inputStyle} value={url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
      </label>

      {invalid && <p style={mutedStyle}>Only http(s) addresses can be embedded.</p>}

      <label style={fieldStyle}>
        <span style={labelStyle}>Title (accessibility)</span>
        <input style={inputStyle} value={title} onChange={e => set('title', e.target.value)} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Corner radius — {radius}px</span>
        <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
      </label>

      <p style={mutedStyle}>
        Not every site allows being shown inside a third-party page: if the block stays empty, the service refuses
        embedding. Use its dedicated embed URL when it offers one.
      </p>
    </>
  )
}

function BackgroundEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { radius, border } = readBackgroundContent(draft)

  return (
    <>
      <p style={mutedStyle}>
        The colour cannot be set: the background takes the surface colour when laid on the page background, and the
        background colour when laid on another background that fully contains it.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Corner radius — {radius}px</span>
        <input type="range" min={0} max={64} value={radius} onChange={e => set('radius', Number(e.target.value))} />
      </label>

      <label style={{ ...rowStyle, alignItems: 'center' }}>
        <input type="checkbox" checked={border} onChange={e => set('border', e.target.checked)} />
        <span style={labelStyle}>Show a border</span>
      </label>
    </>
  )
}

function LinkEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { externalLinks } = readLinkContent(draft)
  const update = (next: ExternalLink[]) => set('externalLinks', next)
  const patch = (index: number, changes: Partial<ExternalLink>) =>
    update(externalLinks.map((link, i) => (i === index ? { ...link, ...changes } : link)))

  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>External links</span>

      {externalLinks.length === 0 && <span style={mutedStyle}>No external link. Add one below.</span>}

      {externalLinks.map((link, i) => (
        <div key={i} style={rowStyle}>
          {link.logo ? (
            <img src={uploadUrl(link.logo)} alt="" style={linkLogoStyle} />
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
            placeholder="Displayed label"
          />
          <FileUpload accept={IMAGE_ACCEPT} label="📁" onUploaded={logo => patch(i, { logo })} />
          <Button variant="ghost" onClick={() => update(externalLinks.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}

      <div style={rowStyle}>
        <Button variant="secondary" onClick={() => update([...externalLinks, { url: '', displayText: '', logo: '' }])}>
          + Add a link
        </Button>
      </div>
    </div>
  )
}

function ProjectCardEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  return (
    <ProjectSelect
      value={(draft.projectId as string) ?? ''}
      label="Project to show"
      onChange={next => set('projectId', next)}
    />
  )
}

function ProjectSelect({ value, label, onChange }: { value: string; label: string; onChange: (id: string) => void }) {
  const { projects, loading } = useBindableProjects()

  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {loading ? (
        <span style={mutedStyle}>Loading projects…</span>
      ) : (
        <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Choose a project —</option>
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

function LinkAreaEditor({ draft, set }: { draft: SectionContent; set: (k: string, v: unknown) => void }) {
  const { target, url, projectId, newTab } = readLinkAreaContent(draft)

  return (
    <>
      <p style={mutedStyle}>
        Invisible area: it sits under the other components and makes all its free surface clickable. Lay it under a
        background or an image to make them clickable.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Target</span>
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
            <span style={labelStyle}>Open in a new tab</span>
          </label>
        </>
      ) : (
        <ProjectSelect value={projectId} label="Project to open" onChange={next => set('projectId', next)} />
      )}
    </>
  )
}

function ContactFormEditor({
  saved,
  draft,
  set,
}: {
  saved: SectionContent
  draft: SectionContent
  set: (k: string, v: unknown) => void
}) {
  const { title, fields, submitLabel, successMessage } = readContactFormContent(draft)
  const savedIds = new Set(readContactFormContent(saved).fields.map(field => field.id))

  const update = (next: FormField[]) =>
    set(
      'fields',
      next.map(field => (savedIds.has(field.id) ? field : { ...field, id: '' })),
    )
  const patch = (index: number, changes: Partial<FormField>) =>
    update(fields.map((field, i) => (i === index ? { ...field, ...changes } : field)))

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
        Messages reach the address configured on the server (<code>CONTACT_MAIL_TO</code>): it is never exposed on the
        public page.
      </p>

      <label style={fieldStyle}>
        <span style={labelStyle}>Displayed title</span>
        <input
          style={inputStyle}
          value={title}
          onChange={e => set('title', e.target.value)}
          placeholder="Me contacter"
        />
      </label>

      <div style={fieldStyle}>
        <span style={labelStyle}>Form fields</span>

        {fields.map((field, i) => (
          <div key={field.id} style={rowStyle}>
            <input
              style={inputStyle}
              value={field.label}
              onChange={e => patch(i, { label: e.target.value })}
              placeholder="Field label"
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
              <span style={labelStyle}>Required</span>
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
            onClick={() => update([...fields, { id: '', label: '', type: 'text', required: false }])}
          >
            + Add a field
          </Button>
        </div>
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Button label</span>
        <input style={inputStyle} value={submitLabel} onChange={e => set('submitLabel', e.target.value)} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Confirmation message</span>
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
