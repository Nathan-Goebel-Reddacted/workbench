export type Provider = 'github' | 'google'

export type AccessRequest = {
  email: string
  displayName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
