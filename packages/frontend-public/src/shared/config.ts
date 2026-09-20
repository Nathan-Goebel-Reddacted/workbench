import { resolveUploadUrl } from '@content'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function uploadUrl(url: string): string {
  return resolveUploadUrl(url, API_URL)
}
