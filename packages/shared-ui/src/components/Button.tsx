import type { ComponentProps, CSSProperties } from 'react'
import { Button as BaseButton, type ButtonVariant } from '@-reddacted-/react-ui'

type ButtonProps = ComponentProps<typeof BaseButton>

const variantLook: Record<ButtonVariant, CSSProperties> = {
  solid: { backgroundColor: 'var(--rui-btn-color)', borderColor: 'var(--rui-btn-color)' },
  outline: { backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
}

export function Button({ variant = 'solid', color, style, ...props }: ButtonProps) {
  return (
    <BaseButton
      {...props}
      variant={variant}
      color={color ?? (variant === 'ghost' ? '--color-text-muted' : undefined)}
      style={{ ...variantLook[variant], ...style }}
    />
  )
}
