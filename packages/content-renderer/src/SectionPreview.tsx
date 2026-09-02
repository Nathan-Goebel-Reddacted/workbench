import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import {
  isEmbeddableUrl,
  readBackgroundContent,
  readCodeContent,
  readEmbedContent,
  readImageContent,
  readLinkAreaContent,
  readLinkContent,
  readTextContent,
  type SectionDto,
} from './types'
import { backgroundColorForDepth } from './backgroundStacking'
import { RichTextRenderer } from './RichTextRenderer'
import { ContactForm } from './ContactForm'
import { isEmbeddedVideo, isUnplayableFile, resolveVideoSource } from './videoSource'
import { resolveDocumentKind, resolveUploadUrl } from './documentKind'
import { MindmapView } from './MindmapView'
import type { RenderMode } from './renderMode'

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL ?? 'http://localhost:5173'

type CarouselItem = { url: string; caption?: string }
type ProjectDetail = { id: string; name: string; description: string; documents?: Array<{ url: string }> }

// backgroundDepth n'est fourni que pour les sections de type « fond » : il décide
// de l'alternance fond / surface (voir backgroundStacking.ts).
// mode « public » : aucun placeholder d'administration ne doit sortir sur le site.
type Props = { section: SectionDto; apiUrl: string; backgroundDepth?: number; mode?: RenderMode }

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

function firstImage(documents?: Array<{ url: string }>): string | null {
  const doc = documents?.find(d =>
    IMAGE_EXT.includes(
      d.url
        .slice(d.url.lastIndexOf('.') + 1)
        .toLowerCase()
        .split('?')[0],
    ),
  )
  return doc?.url ?? null
}

export function SectionPreview({ section, apiUrl, backgroundDepth = 0, mode = 'edit' }: Props) {
  const { type, content, contentRef } = section

  // Aplat décoratif : aucun contenu, la couleur vient de la profondeur d'empilement.
  if (type === 'background') {
    const { radius, border } = readBackgroundContent(content)
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: backgroundColorForDepth(backgroundDepth),
          borderRadius: `${radius}px`,
          border: border ? '1px solid var(--color-border)' : 'none',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  // Le widget texte unifié encode sa source dans content (traité avant le fallback contentRef).
  if (type === 'text') {
    return <TextPreview content={content} apiUrl={apiUrl} mode={mode} />
  }

  // Le widget lien reste lié aux liens du projet, mais porte en plus ses liens
  // externes : traité avant le fallback contentRef.
  if (type === 'link') {
    return <LinkPreview content={content} apiUrl={apiUrl} mode={mode} />
  }

  // Le formulaire porte tout son contenu : traité avant le fallback contentRef.
  if (type === 'contactForm') {
    return <ContactForm content={content} apiUrl={apiUrl} mode={mode} />
  }

  // Zone cliquable : aucun contenu visible, elle n'existe que pour recevoir les clics
  // de sa surface libre (voir sa couche de z-index dans backgroundStacking.ts).
  if (type === 'linkArea') {
    return <LinkAreaPreview content={content} mode={mode} />
  }

  // Bloc de code : tout son contenu est dans le content, comme le texte.
  if (type === 'code') {
    return <CodePreview content={content} mode={mode} />
  }

  // Iframe tierce : idem, et l'URL est filtrée avant rendu.
  if (type === 'embed') {
    return <EmbedPreview content={content} mode={mode} />
  }

  // Composant lié à une donnée existante : le contenu réel vit ailleurs (portfolio/projet).
  // Tant que la résolution n'est pas implémentée, l'identifiant brut sert de repère à
  // l'éditeur — il n'a rien à faire sur le site public.
  if (contentRef) {
    return mode === 'public' ? null : <span style={refStyle}>{contentRef}</span>
  }

  // Widget document : image, vidéo, PDF et mindmap partagent un seul type de section,
  // la forme du rendu se déduisant de l'URL. Les réglages d'ajustement (fit, position,
  // radius) ne concernent que l'image, les autres formes les ignorent.
  if (type === 'document') {
    const { url: storedUrl, alt, fit, position, radius } = readImageContent(content)
    if (!storedUrl) return <Empty label="Aucun document" mode={mode} />

    // Les médias sont persistés en chemin relatif : l'origine de l'API n'est connue qu'ici.
    const url = resolveUploadUrl(storedUrl, apiUrl)
    const kind = resolveDocumentKind(url)

    if (kind === 'image') {
      return (
        <img
          src={url}
          alt={alt}
          style={{ ...mediaStyle, objectFit: fit, objectPosition: position, borderRadius: `${radius}px` }}
        />
      )
    }

    if (kind === 'mindmap') {
      return (
        <div style={{ ...mediaStyle, borderRadius: `${radius}px`, overflow: 'hidden' }}>
          {/* Dans l'éditeur, le glisser appartient au capteur dnd-kit de la grille :
              le mindmap n'y garde que le zoom à la molette. */}
          <MindmapView url={url} apiUrl={apiUrl} pannable={mode === 'public'} />
        </div>
      )
    }

    if (kind === 'pdf') {
      // Même raison que pour l'embed vidéo : sans pointerEvents none, l'iframe
      // avalerait le drag dnd-kit de la grille.
      return (
        <iframe
          src={url}
          title={alt || 'Document PDF'}
          style={{ ...mediaStyle, border: 'none', borderRadius: `${radius}px`, pointerEvents: 'none' }}
        />
      )
    }

    if (kind === 'video') {
      const source = resolveVideoSource(url)
      if (isEmbeddedVideo(source)) {
        // pointerEvents: none — l'iframe capterait sinon le drag dnd-kit de la grille.
        return (
          <iframe
            src={source.src}
            title={source.label}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ ...mediaStyle, border: 'none', pointerEvents: 'none' }}
          />
        )
      }
      if (isUnplayableFile(source)) return <Empty label="Format non lisible par le navigateur" mode={mode} />
      return <video src={source.src} style={mediaStyle} muted preload="metadata" />
    }

    return <Empty label="Format de document non reconnu" mode={mode} />
  }

  if (type === 'carousel') {
    const items = Array.isArray(content.items) ? (content.items as CarouselItem[]) : []
    const withUrl = items.filter(it => it.url)
    if (withUrl.length === 0) return <Empty label="Carrousel vide" mode={mode} />
    return (
      <div style={carouselStyle}>
        {withUrl.map((it, i) => (
          <CarouselSlide
            key={i}
            url={resolveUploadUrl(it.url, apiUrl)}
            caption={it.caption ?? ''}
            mode={mode}
            apiUrl={apiUrl}
          />
        ))}
      </div>
    )
  }

  if (type === 'projectCard') {
    const projectId = typeof content.projectId === 'string' ? content.projectId : ''
    return projectId ? (
      <ProjectCard projectId={projectId} apiUrl={apiUrl} mode={mode} />
    ) : (
      <Empty label="Aucun projet sélectionné" mode={mode} />
    )
  }

  return <Empty mode={mode} />
}

// Le code n'est jamais exécuté ni coloré : il est rendu tel quel. Le langage sert
// d'étiquette et alimente la classe `language-*`, utile si une coloration est
// branchée un jour sans toucher aux données déjà saisies.
function CodePreview({ content, mode }: { content: SectionDto['content']; mode: RenderMode }) {
  const { code, language, wrap } = readCodeContent(content)

  if (code.trim() === '') return <Empty label="Aucun code" mode={mode} />

  return (
    <div style={codeBlockStyle}>
      {language && <span style={codeLanguageStyle}>{language}</span>}
      <pre style={{ ...codePreStyle, whiteSpace: wrap ? 'pre-wrap' : 'pre' }}>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  )
}

// L'iframe est sandboxée : le contenu tiers ne peut ni naviguer le parent, ni
// déclencher un téléchargement. Comme pour le PDF et la vidéo, pointerEvents est
// coupé dans l'éditeur, sinon l'iframe avalerait le drag dnd-kit de la grille.
function EmbedPreview({ content, mode }: { content: SectionDto['content']; mode: RenderMode }) {
  const { url, title, radius } = readEmbedContent(content)

  if (url.trim() === '') return <Empty label="Aucune URL à intégrer" mode={mode} />
  if (!isEmbeddableUrl(url)) return <Empty label="URL non intégrable" mode={mode} />

  return (
    <iframe
      src={url}
      title={title || 'Contenu intégré'}
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      allowFullScreen
      style={{
        ...mediaStyle,
        border: 'none',
        borderRadius: `${radius}px`,
        pointerEvents: mode === 'public' ? 'auto' : 'none',
      }}
    />
  )
}

// Les liens hérités du projet ne sont pas encore résolus ici (le pageRef n'est pas
// disponible dans la grille) : seuls les liens externes saisis sont rendus.
function LinkPreview({ content, apiUrl, mode }: { content: SectionDto['content']; apiUrl: string; mode: RenderMode }) {
  const { externalLinks } = readLinkContent(content)
  const withUrl = externalLinks.filter(link => link.url)

  if (withUrl.length === 0) return <Empty label="Aucun lien" mode={mode} />

  return (
    <div style={linkListStyle}>
      {withUrl.map((link, i) =>
        // Dans l'éditeur les liens restent inertes ; sur le site ils sont cliquables.
        mode === 'public' ? (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            style={{ ...linkItemStyle, textDecoration: 'none' }}
          >
            {link.logo && <img src={resolveUploadUrl(link.logo, apiUrl)} alt="" style={linkLogoStyle} />}
            <span style={linkTextStyle}>{link.displayText || link.url}</span>
          </a>
        ) : (
          <span key={i} style={linkItemStyle}>
            {link.logo && <img src={resolveUploadUrl(link.logo, apiUrl)} alt="" style={linkLogoStyle} />}
            <span style={linkTextStyle}>{link.displayText || link.url}</span>
          </span>
        ),
      )}
    </div>
  )
}

// La zone est transparente : en public elle ne se signale qu'au survol (curseur), en
// édition elle a besoin d'un contour pour rester repérable et attrapable au drag.
function LinkAreaPreview({ content, mode }: { content: SectionDto['content']; mode: RenderMode }) {
  const { target, url, projectId, newTab } = readLinkAreaContent(content)
  const isPublic = mode === 'public'

  if (!isPublic) {
    const label =
      target === 'project' ? (projectId ? `Projet ${projectId}` : 'Aucun projet sélectionné') : url || 'Aucun lien'
    return (
      <div style={linkAreaEditStyle}>
        <span style={linkAreaLabelStyle}>🔗 {label}</span>
      </div>
    )
  }

  // Sans cible, la zone ne rend rien : un <a> sans href avalerait les clics pour rien.
  if (target === 'project') {
    if (!projectId) return null
    return <a href={`/projects/${projectId}`} aria-label="Ouvrir le projet" style={linkAreaPublicStyle} />
  }

  if (!url) return null
  return (
    <a
      href={url}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      aria-label="Ouvrir le lien"
      style={linkAreaPublicStyle}
    />
  )
}

// Une slide accueille n'importe quel document : elle choisit son rendu d'après l'URL,
// avec la même résolution que le widget document (resolveDocumentKind).
function CarouselSlide({
  url,
  caption,
  mode,
  apiUrl,
}: {
  url: string
  caption: string
  mode: RenderMode
  apiUrl: string
}) {
  const kind = resolveDocumentKind(url)

  if (kind === 'video') {
    const source = resolveVideoSource(url)
    if (isEmbeddedVideo(source)) {
      return (
        <iframe
          src={source.src}
          title={caption || source.label}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // width: 'auto' ne dimensionne pas une iframe (contrairement à img/video) :
          // le ratio 16/9 lui donne une largeur.
          style={{
            ...carouselImgStyle,
            width: undefined,
            aspectRatio: '16 / 9',
            border: 'none',
            pointerEvents: 'none',
          }}
        />
      )
    }
    if (isUnplayableFile(source)) return <span style={carouselFallbackStyle}>🎬</span>
    return <video src={url} style={carouselImgStyle} muted preload="metadata" />
  }

  if (kind === 'mindmap') {
    return (
      <div style={{ ...carouselImgStyle, width: undefined, aspectRatio: '4 / 3' }}>
        <MindmapView url={url} apiUrl={apiUrl} pannable={mode === 'public'} />
      </div>
    )
  }

  if (kind === 'pdf') {
    // pointerEvents: none — sinon l'iframe capte le drag dnd-kit de la grille.
    return (
      <iframe
        src={url}
        title={caption || 'Document PDF'}
        style={{ ...carouselImgStyle, width: undefined, aspectRatio: '3 / 4', border: 'none', pointerEvents: 'none' }}
      />
    )
  }

  if (kind === 'empty' || kind === 'unknown') {
    return <span style={carouselFallbackStyle}>📄</span>
  }

  return <img src={url} alt={caption} style={carouselImgStyle} />
}

function TextPreview({ content, apiUrl, mode }: { content: SectionDto['content']; apiUrl: string; mode: RenderMode }) {
  const { html } = readTextContent(content)
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>') return <Empty mode={mode} />
  return <RichTextRenderer html={html} apiUrl={apiUrl} />
}

function ProjectCard({ projectId, apiUrl, mode }: { projectId: string; apiUrl: string; mode: RenderMode }) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiUrl}/projects/${projectId}`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<ProjectDetail>) : Promise.reject(new Error('not found'))))
      .then(setProject)
      .catch(err => {
        if (err.name !== 'AbortError') setNotFound(true)
      })
    return () => controller.abort()
  }, [apiUrl, projectId])

  if (notFound) return <Empty label="Projet introuvable" mode={mode} />
  if (!project) return <Empty label="Chargement…" mode={mode} />

  const storedImage = firstImage(project.documents)
  const image = storedImage ? resolveUploadUrl(storedImage, apiUrl) : null

  // Sur le site public la fiche projet est une page du même domaine : lien relatif,
  // même onglet. Depuis l'éditeur elle vit sur l'autre frontend : URL absolue, nouvel onglet.
  const isPublic = mode === 'public'

  return (
    <a
      href={isPublic ? `/projects/${project.id}` : `${PUBLIC_URL}/projects/${project.id}`}
      target={isPublic ? undefined : '_blank'}
      rel={isPublic ? undefined : 'noreferrer'}
      style={cardLinkStyle}
      onPointerDown={e => e.stopPropagation()}
    >
      {image && <img src={image} alt="" style={cardImageStyle} />}
      <span style={cardTitleStyle}>{project.name}</span>
      {project.description && <span style={cardDescStyle}>{project.description}</span>}
    </a>
  )
}

// Les états vides sont des repères d'édition : sur le site public, une section sans
// contenu ne rend rien du tout plutôt que d'exposer un message d'administration.
function Empty({ label = 'Vide — cliquer sur ✎ pour éditer', mode }: { label?: string; mode: RenderMode }) {
  if (mode === 'public') return null
  return <span style={emptyStyle}>{label}</span>
}

const refStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const mediaStyle: CSSProperties = {
  width: '100%',
  flex: 1,
  minHeight: 0,
  objectFit: 'cover',
  borderRadius: '4px',
}
const codeBlockStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  overflow: 'auto',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
}
const codeLanguageStyle: CSSProperties = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.75rem',
  fontSize: '0.6875rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  pointerEvents: 'none',
}
const codePreStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  wordBreak: 'break-word',
}
const carouselStyle: CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  overflowX: 'auto',
  flex: 1,
  minHeight: 0,
}
const carouselImgStyle: CSSProperties = {
  height: '100%',
  width: 'auto',
  objectFit: 'cover',
  borderRadius: '4px',
  flexShrink: 0,
}
const linkListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  alignItems: 'flex-start',
}
const linkItemStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  maxWidth: '100%',
  fontSize: '0.75rem',
  color: 'var(--color-primary)',
}
const linkLogoStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  flexShrink: 0,
  objectFit: 'contain',
}
const linkTextStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const carouselFallbackStyle: CSSProperties = {
  height: '100%',
  aspectRatio: '16 / 9',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
}
const cardLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  flex: 1,
  minHeight: 0,
  textDecoration: 'none',
  color: 'var(--color-text)',
}
const cardImageStyle: CSSProperties = {
  width: '100%',
  flex: 1,
  minHeight: 0,
  objectFit: 'cover',
  borderRadius: '4px',
}
const cardTitleStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const cardDescStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const linkAreaPublicStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'block',
  cursor: 'pointer',
}
const linkAreaEditStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'flex-start',
  border: '1px dashed var(--color-primary)',
  borderRadius: '4px',
  padding: '0.25rem',
  boxSizing: 'border-box',
}
const linkAreaLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-surface)',
  borderRadius: '4px',
  padding: '0 0.25rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
}
const emptyStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }
