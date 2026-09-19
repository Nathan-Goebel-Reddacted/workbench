import { getJson, send } from '../../shared/api/http'
import type { Decision } from '../../shared/domain/decision'
import type { AccessRequest, Provider } from './types'
import { API_URL } from '../../shared/config'

export async function listProviders(): Promise<Provider[]> {
  const { providers } = await getJson<{ providers: Provider[] }>('/auth/providers')
  return providers
}

export function providerLoginUrl(provider: Provider): string {
  return `${API_URL}/auth/${provider}`
}

export async function listAllowedEmails(): Promise<string[]> {
  const { emails } = await getJson<{ emails: string[] }>('/auth/allowed-emails')
  return emails
}

export function allowEmail(email: string): Promise<void> {
  return send('/auth/allowed-emails', { method: 'POST', body: { email } })
}

export function disallowEmail(email: string): Promise<void> {
  return send(`/auth/allowed-emails/${encodeURIComponent(email)}`, { method: 'DELETE' })
}

export async function listPendingAccessRequests(): Promise<AccessRequest[]> {
  const { requests } = await getJson<{ requests: AccessRequest[] }>('/auth/access-requests?status=pending')
  return requests
}

export function decideAccessRequest(email: string, decision: Decision): Promise<void> {
  return send(`/auth/access-requests/${encodeURIComponent(email)}/${decision}`, { method: 'POST' })
}
