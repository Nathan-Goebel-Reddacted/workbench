import { uploadUrl } from '../config'
import { HttpError, send, sendJson } from './http'

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { url } = await sendJson<{ url: string }>('/uploads', { method: 'POST', body: form })
  return url
}

export function rewriteUpload(url: string, content: unknown): Promise<void> {
  const filename = url.slice(url.lastIndexOf('/') + 1)
  return send(`/uploads/${filename}`, { method: 'PUT', body: content })
}

export async function readUpload<T>(url: string): Promise<T> {
  const response = await fetch(uploadUrl(url), { credentials: 'include' })
  if (!response.ok) throw new HttpError(response.status, null)
  return (await response.json()) as T
}
