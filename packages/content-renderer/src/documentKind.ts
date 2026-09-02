// Résolution du type de rendu d'un document à partir de sa seule URL. Le widget
// `document` unifie image, vidéo, PDF et mindmap : c'est ici que se décide laquelle
// des quatre formes de rendu s'applique. Source de vérité unique, partagée par le
// rendu (SectionPreview) et par l'édition (aperçus du frontend privé).
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, resolveVideoSource, isEmbeddedVideo } from './videoSource'

export type DocumentKind = 'image' | 'video' | 'pdf' | 'mindmap' | 'empty' | 'unknown'

// Suffixe complet, et non extension : un mindmap est un `.json` que seule cette
// convention de nommage distingue d'un autre JSON.
export const MINDMAP_SUFFIX = '.mindmap.json'

function extensionOf(url: string): string {
  const withoutQuery = url.split('?')[0]
  const dotIndex = withoutQuery.lastIndexOf('.')
  return dotIndex === -1 ? '' : withoutQuery.slice(dotIndex + 1).toLowerCase()
}

// Les médias sont enregistrés en chemin relatif (`/uploads/<nom>`) : l'origine de l'API
// n'est jamais persistée, sinon un changement de domaine invaliderait toute la base. Elle
// est donc ajoutée ici, au rendu. Une URL déjà absolue — un lien externe, ou une ligne
// antérieure à la migration — traverse inchangée.
export function resolveUploadUrl(url: string, apiUrl?: string): string {
  const trimmed = url.trim()
  if (!apiUrl || !trimmed.startsWith('/')) return trimmed
  return `${apiUrl}${trimmed}`
}

export function isMindmapUrl(url: string): boolean {
  return url.trim().split('?')[0].toLowerCase().endsWith(MINDMAP_SUFFIX)
}

// L'ordre des tests est significatif :
//   1. les embeds (YouTube, Vimeo) n'ont pas d'extension — les tester en dernier
//      les ferait tomber en 'unknown' ;
//   2. le mindmap avant le PDF et les images, car son extension réelle est 'json'.
export function resolveDocumentKind(rawUrl: string): DocumentKind {
  const url = rawUrl.trim()
  if (!url) return 'empty'

  if (isEmbeddedVideo(resolveVideoSource(url))) return 'video'
  if (isMindmapUrl(url)) return 'mindmap'

  const extension = extensionOf(url)
  if (extension === 'pdf') return 'pdf'
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image'
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video'

  return 'unknown'
}
