import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = 'primary', style, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...(disabled ? disabledStyle : undefined),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid transparent',
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

const disabledStyle: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderColor: 'var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    borderColor: 'transparent',
  },
}
