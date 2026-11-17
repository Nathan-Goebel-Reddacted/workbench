import { useState, type CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import type { CarouselItem } from '@content'
import { MediaPicker } from '../MediaPicker'
import type { PanelProps } from './panelProps'
import { fileStyle, inputStyle, panelStyle, rowStyle } from './panelStyles'

export function CarouselPanel({ value, onChange }: PanelProps<'carousel'>) {
  const [picking, setPicking] = useState<number | null>(null)
  const [captions, setCaptions] = useState(value.items.map(item => item.caption))

  const save = (items: CarouselItem[]) => {
    setCaptions(items.map(item => item.caption))
    onChange({ ...value, items })
  }
  const replace = (index: number, item: CarouselItem) => save(value.items.map((it, i) => (i === index ? item : it)))

  const choose = (index: number, url: string) => {
    if (index >= value.items.length) save([...value.items, { url, caption: '' }])
    else replace(index, { ...value.items[index], url })
  }

  return (
    <div style={panelStyle}>
      {value.items.map((item, index) => (
        <div key={index} style={slideStyle}>
          <div style={rowStyle}>
            <span style={fileStyle}>{item.url ?? 'No file chosen'}</span>
            <Button variant="secondary" onClick={() => setPicking(index)}>
              {item.url ? 'Change' : 'Choose'}
            </Button>
            <Button variant="ghost" onClick={() => save(value.items.filter((_, i) => i !== index))}>
              Remove
            </Button>
          </div>
          <input
            style={inputStyle}
            placeholder="Caption"
            value={captions[index] ?? ''}
            onChange={e => setCaptions(prev => prev.map((c, i) => (i === index ? e.target.value : c)))}
            onBlur={() => {
              const caption = captions[index] ?? ''
              if (caption !== item.caption) replace(index, { ...item, caption })
            }}
          />
        </div>
      ))}
      <Button variant="secondary" onClick={() => setPicking(value.items.length)}>
        Add an image
      </Button>
      {picking !== null && (
        <MediaPicker
          kind="document"
          selectedUrl={value.items[picking]?.url ?? ''}
          onSelect={url => {
            setPicking(null)
            choose(picking, url)
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

const slideStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--color-border)',
}
