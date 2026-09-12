import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@atelier/shared-ui'
import { useCanEdit } from '../contexts/EditPermissionContext'
import { ExportModal } from '../components/io/ExportModal'
import { ImportModal } from '../components/io/ImportModal'

type Entry = {
  label: string
  to?: string
  onClick?: () => void
  disabled?: boolean
  title?: string
}
type Section = { title: string; entries: Entry[] }

export function HomePage() {
  const { user } = useAuth()
  const canEdit = useCanEdit()
  const canViewAdmin = user?.roles.includes('view') ?? false
  const [openModal, setOpenModal] = useState<'import' | 'export' | null>(null)

  const lockedTitle = canEdit ? undefined : 'Rôle edit requis'

  // Les deux entrées ne dépendent pas du même rôle : la section suit ce qui reste à afficher.
  const managementEntries: Entry[] = [
    ...(canViewAdmin ? [{ label: 'User Management', to: '/admin' }] : []),
    ...(canEdit ? [{ label: 'Error Log', to: '/error-log' }] : []),
    ...(canEdit ? [{ label: 'Contact Messages', to: '/contact-messages' }] : []),
  ]

  const sections: Section[] = [
    {
      title: 'Portfolio',
      entries: [
        { label: 'Portfolio Editor', to: '/editor' },
        { label: 'Project', to: '/projects' },
        { label: 'Idea', to: '/ideas' },
        { label: 'CV', to: '/cv' },
      ],
    },
    {
      title: 'Tool',
      entries: [
        { label: 'Theme Editor', to: '/theme-editor' },
        {
          label: 'Import',
          onClick: () => setOpenModal('import'),
          disabled: !canEdit,
          title: lockedTitle,
        },
        {
          label: 'Export',
          onClick: () => setOpenModal('export'),
          disabled: !canEdit,
          title: lockedTitle,
        },
      ],
    },
    ...(managementEntries.length > 0 ? [{ title: 'Management', entries: managementEntries }] : []),
  ]

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Workbench</h1>
      </header>

      {sections.map(section => (
        <section key={section.title} style={sectionStyle}>
          <p style={sectionLabelStyle}>{section.title}</p>
          <div style={entriesStyle}>
            {section.entries.map(entry =>
              entry.to ? (
                <Link key={entry.label} to={entry.to} style={entryStyle}>
                  {entry.label}
                </Link>
              ) : (
                <button
                  key={entry.label}
                  type="button"
                  onClick={entry.onClick}
                  disabled={entry.disabled}
                  title={entry.title}
                  style={entry.disabled ? disabledEntryStyle : entryStyle}
                >
                  {entry.label}
                </button>
              ),
            )}
          </div>
        </section>
      ))}

      {openModal === 'import' && <ImportModal onClose={() => setOpenModal(null)} />}
      {openModal === 'export' && <ExportModal onClose={() => setOpenModal(null)} />}
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }
const headerStyle: CSSProperties = { marginBottom: '1.75rem' }
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const sectionLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}

const entriesStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }
const entryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.625rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  textDecoration: 'none',
  cursor: 'pointer',
}
const disabledEntryStyle: CSSProperties = {
  ...entryStyle,
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
}
