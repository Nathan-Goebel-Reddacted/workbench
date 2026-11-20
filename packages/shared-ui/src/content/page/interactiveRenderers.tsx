import { createContext, useContext } from 'react'
import { ContactForm } from './ContactForm'
import { cssColor } from './color'
import type { ContactFormComponent } from './pageTypes'

export const EditingContext = createContext(false)

export function ContactFormView(form: ContactFormComponent) {
  const editing = useContext(EditingContext)
  return (
    <ContactForm
      form={form}
      editing={editing}
      colors={{
        text: cssColor(form.textColor, 'var(--color-text)'),
        button: cssColor(form.buttonColor, 'var(--color-primary)'),
      }}
    />
  )
}
