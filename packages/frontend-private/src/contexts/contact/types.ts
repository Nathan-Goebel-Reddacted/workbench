export type ContactMessage = {
  id: string
  fields: { label: string; value: string }[]
  senderEmail: string | null
  submittedAt: string
  mailSent: boolean
}
