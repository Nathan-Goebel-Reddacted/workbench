import type { CSSProperties } from 'react'
import { useShowPopup } from '@atelier/shared-ui'
import { useSiteAccess } from '../hooks/useSiteAccess'

export function SiteAccessSwitch({ style }: { style: CSSProperties }) {
  const { open, toggle } = useSiteAccess()
  const showPopup = useShowPopup()
  const enabled = open !== null

  const onToggle = async () => {
    if (!(await toggle())) showPopup('Could not change the public site access.')
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={open === true}
      disabled={!enabled}
      onClick={onToggle}
      title={open ? 'The public site is open' : 'The public site is closed'}
      style={{ ...style, gap: '0.75rem', cursor: enabled ? 'pointer' : 'not-allowed' }}
    >
      Public site
      <span
        style={{
          ...trackStyle,
          backgroundColor: open ? 'var(--color-primary)' : 'var(--color-border)',
          opacity: enabled ? 1 : 0.5,
        }}
      >
        <span style={{ ...thumbStyle, transform: open ? 'translateX(14px)' : 'translateX(2px)' }} />
      </span>
    </button>
  )
}

const trackStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
  width: '30px',
  height: '18px',
  borderRadius: '9px',
  transition: 'background-color 0.2s',
}

const thumbStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  left: 0,
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-surface)',
  transition: 'transform 0.2s',
}
