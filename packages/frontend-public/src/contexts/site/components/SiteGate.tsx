import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { SITE_CLOSED_MESSAGE, useShowPopup } from '@atelier/shared-ui'
import { useSiteAccess } from '../hooks/useSiteAccess'

export function SiteGate({ children }: { children: ReactNode }) {
  const { access, status } = useSiteAccess()
  const showPopup = useShowPopup()
  const closed = status === 'error' || (status === 'ready' && !access?.served)

  useEffect(() => {
    if (closed) showPopup(SITE_CLOSED_MESSAGE)
  }, [closed, showPopup])

  if (status === 'loading' || closed || !access) return null

  return (
    <>
      {!access.open && <p style={bannerStyle}>Site fermé au public — visible car vous êtes connecté.</p>}
      {children}
    </>
  )
}

const bannerStyle: CSSProperties = {
  margin: 0,
  padding: '0.5rem 1rem',
  textAlign: 'center',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
}
