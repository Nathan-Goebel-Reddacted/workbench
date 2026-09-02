export type VideoSourceKind = 'youtube' | 'vimeo' | 'file' | 'empty'

export type VideoSource = {
  kind: VideoSourceKind
  // URL à passer à <iframe> (youtube/vimeo) ou à <video> (file). Vide si kind === 'empty'.
  src: string
  label: string
}

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']

// Formats que les navigateurs lisent nativement via <video>. Les autres sont
// acceptés à l'upload mais signalés comme potentiellement illisibles.
const PLAYABLE_EXTENSIONS = ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov']

function youtubeId(url: URL): string | null {
  if (url.pathname === '/watch') return url.searchParams.get('v')
  const segments = url.pathname.split('/').filter(Boolean)
  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  if (segments.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0])) return segments[1]
  // youtu.be/<id>
  if (url.hostname.endsWith('youtu.be') && segments.length >= 1) return segments[0]
  return null
}

function vimeoId(url: URL): string | null {
  const segments = url.pathname.split('/').filter(Boolean)
  // player.vimeo.com/video/<id> ou vimeo.com/<id> (éventuellement vimeo.com/<id>/<hash>)
  if (segments[0] === 'video' && segments[1]) return /^\d+$/.test(segments[1]) ? segments[1] : null
  return segments[0] && /^\d+$/.test(segments[0]) ? segments[0] : null
}

export function resolveVideoSource(rawUrl: string): VideoSource {
  const url = rawUrl.trim()
  if (!url) return { kind: 'empty', src: '', label: '' }

  let parsed: URL | null = null
  try {
    parsed = new URL(url, window.location.origin)
  } catch {
    parsed = null
  }

  if (parsed) {
    if (YOUTUBE_HOSTS.includes(parsed.hostname) || parsed.hostname.endsWith('youtu.be')) {
      const id = youtubeId(parsed)
      if (id) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}`, label: 'YouTube' }
    }
    if (VIMEO_HOSTS.includes(parsed.hostname)) {
      const id = vimeoId(parsed)
      if (id) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${id}`, label: 'Vimeo' }
    }
  }

  return { kind: 'file', src: url, label: 'Fichier vidéo' }
}

export function isEmbeddedVideo(source: VideoSource): boolean {
  return source.kind === 'youtube' || source.kind === 'vimeo'
}

// Toutes les extensions vidéo acceptées à l'upload, lisibles ou non.
export const VIDEO_EXTENSIONS = [
  'mp4',
  'm4v',
  'webm',
  'ogv',
  'ogg',
  'mov',
  'mkv',
  'avi',
  'wmv',
  'flv',
  'mpeg',
  'mpg',
  '3gp',
  'ts',
]

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']

function extensionOf(url: string): string {
  const withoutQuery = url.split('?')[0]
  const dotIndex = withoutQuery.lastIndexOf('.')
  return dotIndex === -1 ? '' : withoutQuery.slice(dotIndex + 1).toLowerCase()
}

// Un média du carrousel est identifié par son URL seule : les documents d'un projet
// sont des fichiers, l'extension suffit à choisir entre <img> et <video>.
export function isVideoUrl(url: string): boolean {
  const source = resolveVideoSource(url)
  if (isEmbeddedVideo(source)) return true
  return VIDEO_EXTENSIONS.includes(extensionOf(url))
}

// Vrai quand l'extension du fichier n'est pas lisible nativement par <video>
// (mkv, avi, wmv…) : l'aperçu reste vide, mieux vaut le dire à l'utilisateur.
export function isUnplayableFile(source: VideoSource): boolean {
  if (source.kind !== 'file') return false
  const extension = extensionOf(source.src)
  if (!extension) return false
  return !PLAYABLE_EXTENSIONS.includes(extension)
}
