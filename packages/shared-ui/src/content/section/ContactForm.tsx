import { useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { readContactFormContent, type FormField } from './types'
import type { RenderMode } from './renderMode'

type Props = {
  content: Record<string, unknown>
  apiUrl: string
  mode: RenderMode
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Seul widget interactif du catalogue. Dans l'éditeur (`mode === 'edit'`) le formulaire est un
 * aperçu inerte : sans cela, chaque essai dans le Design Lab enverrait un vrai mail.
 */
export function ContactForm({ content, apiUrl, mode }: Props) {
  const { title, fields, submitLabel, successMessage } = readContactFormContent(content)
  const isEditing = mode === 'edit'

  // Horodatage du rendu : le backend rejette les soumissions trop rapides pour être humaines.
  const renderedAt = useRef(Date.now())
  const [values, setValues] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const setValue = (id: string, value: string) => setValues(prev => ({ ...prev, [id]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isEditing || status === 'sending') return

    setStatus('sending')
    try {
      const res = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields.map(field => ({
            label: field.label,
            value: values[field.id] ?? '',
            type: field.type,
          })),
          _hp: honeypot,
          renderedAt: renderedAt.current,
        }),
      })
      setStatus(res.ok ? 'sent' : 'error')
      // Le formulaire reste affiché après l'envoi : on vide les champs pour qu'un second
      // message parte de zéro plutôt que de repartir du précédent.
      if (res.ok) setValues({})
    } catch {
      setStatus('error')
    }
  }

  return (
    <form style={containerStyle} onSubmit={handleSubmit}>
      {title !== '' && <h3 style={titleStyle}>{title}</h3>}

      {status === 'sent' && <p style={successStyle}>{successMessage}</p>}

      {fields.map(field => (
        <Field
          key={field.id}
          field={field}
          value={values[field.id] ?? ''}
          onChange={value => setValue(field.id, value)}
        />
      ))}

      {/* Piège à robots : hors écran plutôt que masqué, pour rester invisible aux humains
          sans être trivialement détectable. */}
      <input
        type="text"
        name="_hp"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        style={honeypotStyle}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <button type="submit" style={buttonStyle} disabled={isEditing || status === 'sending'}>
        {status === 'sending' ? 'Envoi…' : submitLabel}
      </button>

      {status === 'error' && <p style={errorStyle}>L'envoi a échoué. Merci de réessayer dans un instant.</p>}
      {isEditing && <p style={hintStyle}>Aperçu — l'envoi est désactivé dans l'éditeur.</p>}
    </form>
  )
}

function Field({ field, value, onChange }: { field: FormField; value: string; onChange: (value: string) => void }) {
  const shared = {
    value,
    required: field.required,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    style: inputStyle,
  }

  return (
    <label style={labelStyle}>
      <span style={labelTextStyle}>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
      {field.type === 'textarea' ? (
        <textarea {...shared} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
      ) : (
        <input {...shared} type={field.type === 'email' ? 'email' : 'text'} />
      )}
    </label>
  )
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.125rem',
  color: 'var(--color-text)',
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const labelTextStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
}

const inputStyle: CSSProperties = {
  padding: '0.5rem 0.625rem',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const buttonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-bg)',
  fontSize: '0.875rem',
  cursor: 'pointer',
}

const honeypotStyle: CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  opacity: 0,
}

// Bandeau de confirmation : posé au-dessus d'un formulaire qui reste affiché, il doit se
// distinguer des champs sans introduire de couleur en dur (bordure d'accentuation).
const successStyle: CSSProperties = {
  margin: 0,
  padding: '0.625rem 0.75rem',
  fontSize: '0.9375rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-primary)',
  borderRadius: '4px',
}

const errorStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
}

const hintStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
}
