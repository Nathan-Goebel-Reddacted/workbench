// Rendu d'un layout composé dans l'Editor. Partagé par l'aperçu de l'éditeur
// (frontend-private) et les pages publiques (frontend-public) : une seule
// implémentation de la géométrie et du rendu des widgets, donc un rendu identique
// des deux côtés. Les styles du texte riche vivent dans ./richText.css, à importer
// séparément par l'application hôte.

export { LayoutPreview } from './LayoutPreview'
export type { RenderMode } from './renderMode'
export { SectionPreview } from './SectionPreview'
export { MindmapView } from './MindmapView'
export { RichTextRenderer } from './RichTextRenderer'
export { ContactForm } from './ContactForm'
export { buildRichTextExtensions } from './richTextExtensions'

export {
  COLS,
  GAP,
  colToPercent,
  widthPercent,
  REFERENCE_WIDTH,
  REFERENCE_ROW_HEIGHT,
  CELL_RATIO,
  rowHeightFor,
  gridHeightFor,
  WIDGET_INSET,
  BACKGROUND_OUTSET,
  sectionBox,
  growForType,
} from './gridGeometry'
export { useRowHeight } from './useRowHeight'
export {
  BACKGROUND_TYPE,
  LINK_AREA_TYPE,
  WIDGET_Z,
  LINK_AREA_Z,
  DRAGGING_Z,
  computeBackgroundDepths,
  backgroundColorForDepth,
  zIndexFor,
} from './backgroundStacking'
export {
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  resolveVideoSource,
  isEmbeddedVideo,
  isUnplayableFile,
  isVideoUrl,
  type VideoSource,
  type VideoSourceKind,
} from './videoSource'
export { MINDMAP_SUFFIX, isMindmapUrl, resolveDocumentKind, resolveUploadUrl, type DocumentKind } from './documentKind'
export {
  MINDMAP_VERSION,
  MINDMAP_COLORS,
  MINDMAP_FILLS,
  MINDMAP_EDGE_PATHS,
  MINDMAP_EDGE_STROKES,
  MINDMAP_NODE_WIDTH,
  MINDMAP_NODE_HEIGHT,
  MINDMAP_FONT_SIZE,
  MINDMAP_FONT_MIN,
  MINDMAP_FONT_MAX,
  emptyMindmap,
  readMindmap,
  nodeWidth,
  nodeHeight,
  nodeFontSize,
  type Mindmap,
  type MindmapNode,
  type MindmapEdge,
  type MindmapNodeKind,
  type MindmapShape,
  type MindmapColor,
  type MindmapFill,
  type MindmapEdgePath,
  type MindmapEdgeStroke,
} from './mindmap'
export { mindmapStroke, mindmapText, mindmapFill } from './mindmapTheme'

export type { PageType, SectionType, SectionContent } from './sectionTypes'
export type {
  SectionDto,
  SectionPosition,
  PageLayoutDto,
  TextContent,
  ImageContent,
  ImageFit,
  ImagePosition,
  BackgroundContent,
  LinkAreaContent,
  LinkAreaTarget,
  ExternalLink,
  CodeContent,
  EmbedContent,
  ContactFormContent,
  FormField,
  FormFieldType,
  BindingEntity,
  BindingField,
  ProjectField,
  FeatureField,
  TicketField,
  DataBindingAttrs,
} from './types'
export {
  readTextContent,
  readImageContent,
  readLinkContent,
  readBackgroundContent,
  readLinkAreaContent,
  LINK_AREA_TARGET_OPTIONS,
  readCodeContent,
  CODE_LANGUAGE_OPTIONS,
  readEmbedContent,
  isEmbeddableUrl,
  readContactFormContent,
  DEFAULT_FORM_FIELDS,
  FORM_FIELD_TYPE_OPTIONS,
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
  BINDING_FIELDS,
  BINDING_ENTITY_LABELS,
} from './types'
