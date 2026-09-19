import type { CSSProperties } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { mindmapFill, mindmapStroke, mindmapText } from '@atelier/content-renderer'
import type { MindmapNodeData } from './serialize'

type MindmapEditApi = { setText: (id: string, text: string) => void }

const EditContext = createContext<MindmapEditApi | null>(null)
export const MindmapEditProvider = EditContext.Provider

function baseStyle(data: MindmapNodeData, dashed: boolean): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.4rem 0.6rem',
    fontSize: `${data.fontSize}px`,
    fontWeight: data.bold ? 700 : 400,
    textAlign: 'center',
    wordBreak: 'break-word',
    backgroundColor: mindmapFill(data.color, data.fill),
    color: mindmapText(data.color),
    border: `2px ${dashed ? 'dashed' : 'solid'} ${mindmapStroke(data.color)}`,
    borderRadius: '8px',
  }
}

const handleStyle: CSSProperties = {
  width: 8,
  height: 8,
  backgroundColor: 'var(--color-primary)',
  border: '1px solid var(--color-surface)',
}

function Label({ id, data, placeholder }: { id: string; data: MindmapNodeData; placeholder: string }) {
  const api = useContext(EditContext)
  const [draft, setDraft] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (draft !== null) input.current?.select()
  }, [draft])

  const commit = () => {
    if (draft !== null) api?.setText(id, draft)
    setDraft(null)
  }

  if (draft !== null) {
    return (
      <input
        ref={input}
        className="nodrag"
        style={inputStyle}
        value={draft}
        autoFocus
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setDraft(null)
          }
          event.stopPropagation()
        }}
      />
    )
  }

  return (
    <span
      style={labelStyle}
      onDoubleClick={event => {
        event.stopPropagation()
        setDraft(data.text ?? '')
      }}
    >
      {data.text || placeholder}
    </span>
  )
}

export function MindNode({ id, data, selected }: NodeProps) {
  const nodeData = data as MindmapNodeData
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={36}
        lineStyle={resizerLineStyle}
        handleStyle={resizerHandleStyle}
      />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div style={baseStyle(nodeData, false)}>
        <Label id={id} data={nodeData} placeholder="Node" />
      </div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </>
  )
}

export function FreeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as MindmapNodeData
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={36}
        lineStyle={resizerLineStyle}
        handleStyle={resizerHandleStyle}
      />
      <div style={baseStyle(nodeData, true)}>
        <Label id={id} data={nodeData} placeholder="Note" />
      </div>
    </>
  )
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as MindmapNodeData
  const border = mindmapStroke(nodeData.color)
  const shape = nodeData.shape ?? 'rectangle'

  const style: CSSProperties = (() => {
    if (shape === 'ellipse') return { ...baseStyle(nodeData, false), borderRadius: '50%' }
    if (shape === 'arrow') {
      return {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        borderTop: `2px solid ${border}`,
        transform: `rotate(${nodeData.rotation ?? 0}deg)`,
      }
    }
    return baseStyle(nodeData, false)
  })()

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={24}
        lineStyle={resizerLineStyle}
        handleStyle={resizerHandleStyle}
      />
      <div style={style}>
        {shape === 'arrow' ? <ArrowHead color={border} /> : <Label id={id} data={nodeData} placeholder="" />}
      </div>
    </>
  )
}

function ArrowHead({ color }: { color: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        right: -1,
        top: -6,
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `10px solid ${color}`,
      }}
    />
  )
}

const labelStyle: CSSProperties = { cursor: 'text', width: '100%' }
const inputStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  padding: 0,
  textAlign: 'center',
  backgroundColor: 'transparent',
  color: 'inherit',
  font: 'inherit',
}
const resizerLineStyle: CSSProperties = { borderColor: 'var(--color-primary)' }
const resizerHandleStyle: CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  border: '1px solid var(--color-surface)',
}

export const MINDMAP_NODE_TYPES = {
  mind: MindNode,
  free: FreeNode,
  shape: ShapeNode,
}
