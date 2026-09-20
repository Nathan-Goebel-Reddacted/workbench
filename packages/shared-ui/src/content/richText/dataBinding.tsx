import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useEffect, useState, type CSSProperties } from 'react'
import type { BindingEntity, BindingField, DataBindingAttrs } from './types'

type DataBindingOptions = { apiUrl: string }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dataBinding: {
      insertDataBinding: (attrs: DataBindingAttrs) => ReturnType
    }
  }
}

// --- Résolution de la valeur live (cache de promesses par entité) ---
type EntityData = Record<string, unknown>
const entityCache = new Map<string, Promise<EntityData | null>>()

function entityPath(entity: BindingEntity, id: string): string {
  if (entity === 'project') return `projects/${id}`
  if (entity === 'feature') return `features/${id}`
  return `tickets/${id}`
}

function fetchEntity(apiUrl: string, entity: BindingEntity, id: string): Promise<EntityData | null> {
  const key = `${entity}:${id}`
  let promise = entityCache.get(key)
  if (!promise) {
    promise = fetch(`${apiUrl}/${entityPath(entity, id)}`, { credentials: 'include' })
      .then(res => (res.ok ? (res.json() as Promise<EntityData>) : null))
      .catch(() => null)
    entityCache.set(key, promise)
  }
  return promise
}

function useBindingValue(apiUrl: string, entity: BindingEntity, id: string, field: BindingField) {
  const [state, setState] = useState<{ value: string; loading: boolean; error: boolean }>({
    value: '',
    loading: true,
    error: false,
  })

  useEffect(() => {
    let alive = true
    setState({ value: '', loading: true, error: false })
    fetchEntity(apiUrl, entity, id).then(data => {
      if (!alive) return
      if (!data) {
        setState({ value: '', loading: false, error: true })
        return
      }
      const raw = data[field]
      const value = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
      setState({ value, loading: false, error: false })
    })
    return () => {
      alive = false
    }
  }, [apiUrl, entity, id, field])

  return state
}

// --- NodeView React : affiche la valeur live, non éditable, mais formatable (marques) ---
function DataBindingView(props: NodeViewProps) {
  const { entity, id, field } = props.node.attrs as DataBindingAttrs
  const { apiUrl } = props.extension.options as DataBindingOptions
  const editable = props.editor.isEditable
  const { value, loading, error } = useBindingValue(apiUrl, entity, id, field)

  const label = loading ? '…' : error ? '⚠' : value || '(vide)'

  return (
    <NodeViewWrapper
      as="span"
      className="data-binding"
      data-entity={entity}
      data-field={field}
      contentEditable={false}
      style={editable ? chipStyle : undefined}
    >
      {label}
    </NodeViewWrapper>
  )
}

const chipStyle: CSSProperties = {
  display: 'inline',
  padding: '0 0.2rem',
  borderRadius: '3px',
  backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
  boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-primary) 35%, transparent)',
  cursor: 'default',
}

// --- Nœud TipTap : inline, atomique (texte figé), accepte toutes les marques ---
export const DataBinding = Node.create<DataBindingOptions>({
  name: 'dataBinding',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  marks: '_',

  addOptions() {
    return { apiUrl: '' }
  },

  addAttributes() {
    return {
      entity: {
        default: null,
        parseHTML: el => el.getAttribute('data-entity'),
        renderHTML: attrs => ({ 'data-entity': attrs.entity }),
      },
      id: {
        default: null,
        parseHTML: el => el.getAttribute('data-id'),
        renderHTML: attrs => ({ 'data-id': attrs.id }),
      },
      field: {
        default: null,
        parseHTML: el => el.getAttribute('data-field'),
        renderHTML: attrs => ({ 'data-field': attrs.field }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-binding]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-binding': '' }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataBindingView)
  },

  addCommands() {
    return {
      insertDataBinding:
        attrs =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})
