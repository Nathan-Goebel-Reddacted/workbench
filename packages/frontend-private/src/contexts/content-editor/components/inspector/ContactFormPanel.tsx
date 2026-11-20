import type { CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import type { ContactFormComponent } from '@content'
import { ColorChoice } from './ColorChoice'
import type { PanelProps } from './panelProps'
import { fieldStyle, inputStyle, labelStyle, panelStyle, rowStyle } from './panelStyles'
import { useDraft } from './useDraft'

type FieldType = ContactFormComponent['fields'][number]['type']

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Long text' },
]

export function ContactFormPanel({ value, onChange, beginInteraction }: PanelProps<'contactForm'>) {
  const { draft, update } = useDraft<ContactFormComponent>(value, onChange, beginInteraction)
  const setField = (index: number, patch: Partial<ContactFormComponent['fields'][number]>) =>
    update({ ...draft, fields: draft.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) })

  return (
    <div style={panelStyle}>
      <TextField label="Title" value={draft.title} onChange={title => update({ ...draft, title })} />
      <TextField
        label="Button label"
        value={draft.submitLabel}
        onChange={submitLabel => update({ ...draft, submitLabel })}
      />
      <TextField
        label="Confirmation message"
        value={draft.successMessage}
        onChange={successMessage => update({ ...draft, successMessage })}
      />
      <ColorChoice
        label="Text colour"
        value={draft.textColor}
        onChange={textColor => update({ ...draft, textColor })}
      />
      <ColorChoice
        label="Button colour"
        value={draft.buttonColor}
        onChange={buttonColor => update({ ...draft, buttonColor })}
      />

      <span style={labelStyle}>Fields</span>
      {draft.fields.map((field, index) => (
        <div key={index} style={fieldBoxStyle}>
          <input
            style={inputStyle}
            placeholder="Label"
            value={field.label}
            onChange={e => setField(index, { label: e.target.value })}
          />
          <div style={rowStyle}>
            <select
              style={inputStyle}
              value={field.type}
              onChange={e => setField(index, { type: e.target.value as FieldType })}
            >
              {FIELD_TYPES.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label style={checkStyle}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => setField(index, { required: e.target.checked })}
              />
              Required
            </label>
            <Button
              variant="ghost"
              onClick={() => update({ ...draft, fields: draft.fields.filter((_, i) => i !== index) })}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          update({
            ...draft,
            fields: [...draft.fields, { id: '', label: '', type: 'text', required: false }],
          })
        }
      >
        Add a field
      </Button>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input style={inputStyle} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

const fieldBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--color-border)',
}
const checkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
