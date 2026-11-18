import type { CSSProperties } from 'react'
import type { CodeComponent, EmbedComponent } from './pageTypes'

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
