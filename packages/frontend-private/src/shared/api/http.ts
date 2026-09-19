import { API_URL } from '../config'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string | null,
  ) {
    super(detail ?? `HTTP ${status}`)
    this.name = 'HttpError'
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  contentType?: string
}

async function errorDetail(response: Response): Promise<string | null> {
  const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
  return body?.message ?? body?.error ?? null
}

function encode(body: unknown, contentType?: string): Pick<RequestInit, 'body' | 'headers'> {
  if (body === undefined) return {}
  if (contentType) return { body: body as BodyInit, headers: { 'Content-Type': contentType } }
  if (body instanceof FormData) return { body }
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
}

export async function request(
  path: string,
  { method = 'GET', body, signal, contentType }: RequestOptions,
): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    signal,
    ...encode(body, contentType),
  })
  if (!response.ok) throw new HttpError(response.status, await errorDetail(response))
  return response
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await request(path, { signal })
  return (await response.json()) as T
}

export async function sendJson<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await request(path, options)
  return (await response.json()) as T
}

export async function send(path: string, options: RequestOptions): Promise<void> {
  await request(path, options)
}
