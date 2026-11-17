import type { CSSProperties } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { resolveUploadUrl } from '../media/documentKind'
import { cssColor } from './color'
import type { CodeComponent, EmbedComponent, LinkListComponent } from './pageTypes'

export function CodeView({ code, language, wrap }: CodeComponent) {
  if (code.trim() === '') return null
  return (
    <div style={codeBlockStyle}>
      {language && <span style={codeLanguageStyle}>{language}</span>}
      <pre style={{ ...codePreStyle, whiteSpace: wrap ? 'pre-wrap' : 'pre' }}>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  )
}

export function EmbedView({ url, title }: EmbedComponent) {
  if (!url) return null
  return (
    <iframe
      src={url}
      title={title || 'Embedded page'}
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      allowFullScreen
      style={embedStyle}
    />
  )
}

export function LinkListView({ links, style, color, fill }: LinkListComponent) {
  const apiUrl = useApiUrl()
  const shown = links.filter(link => link.url)
  if (shown.length === 0) return null

  const text = cssColor(color, style === 'link' ? 'var(--color-primary)' : 'var(--color-text)')
  const itemStyle: CSSProperties =
    style === 'link'
      ? { ...linkItemStyle, color: text }
      : {
          ...linkButtonStyle,
          borderColor: style === 'solid' ? cssColor(fill, 'var(--color-text)') : text,
          backgroundColor: style === 'solid' ? cssColor(fill, 'var(--color-text)') : 'transparent',
          color: style === 'solid' ? cssColor(color, 'var(--color-surface)') : text,
        }

  return (
    <div style={style === 'link' ? linkListStyle : linkRowStyle}>
      {shown.map((link, index) => (
        <a
          key={index}
          href={resolveUploadUrl(link.url ?? '', apiUrl)}
          target={link.newTab ? '_blank' : undefined}
          rel={link.newTab ? 'noopener noreferrer' : undefined}
          style={itemStyle}
        >
          {link.logo && <img src={resolveUploadUrl(link.logo, apiUrl)} alt="" style={logoStyle} />}
          <span style={labelStyle}>{link.label || link.url}</span>
        </a>
      ))}
    </div>
  )
}

const codeBlockStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  overflow: 'auto',
  padding: '0.75rem 1rem',
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
const embedStyle: CSSProperties = { display: 'block', width: '100%', height: '100%', border: 'none' }
const linkListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.25rem',
  height: '100%',
  overflowY: 'auto',
}
const linkRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  alignContent: 'flex-start',
  gap: '0.75rem',
  height: '100%',
}
const linkItemStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  maxWidth: '100%',
  fontSize: '0.875rem',
  textDecoration: 'none',
}
const linkButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  maxWidth: '100%',
  minHeight: '44px',
  padding: '0 1.25rem',
  borderRadius: '8px',
  border: '1px solid',
  fontSize: '0.9375rem',
  fontWeight: 600,
  boxSizing: 'border-box',
  textDecoration: 'none',
}
const logoStyle: CSSProperties = { width: '16px', height: '16px', flexShrink: 0, objectFit: 'contain' }
const labelStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
