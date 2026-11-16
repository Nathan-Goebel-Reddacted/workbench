export { LayoutPreview } from './grid/LayoutPreview'
export { MindmapView } from './mindmap/MindmapView'
export { PageRenderer } from './page/PageRenderer'
export { PAGE_BOTTOM_MARGIN, readingRows, readingOrder, pageHeight, pageScale } from './page/pageGeometry'
export type {
  PageDto,
  PageElement,
  ElementTransform,
  ElementComponents,
  ComponentKind,
  TextComponent,
} from './page/pageTypes'
export { buildRichTextExtensions } from './richText/richTextExtensions'

export { GAP, rowHeightFor, gridHeightFor, sectionBox, growForType } from './grid/gridGeometry'
export { useRowHeight } from './grid/useRowHeight'
export { DRAGGING_Z, computeBackgroundDepths, backgroundColorForDepth, zIndexFor } from './grid/backgroundStacking'
export {
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  resolveVideoSource,
  isEmbeddedVideo,
  isUnplayableFile,
  isVideoUrl,
  type VideoSource,
  type VideoSourceKind,
} from './media/videoSource'
export {
  MINDMAP_SUFFIX,
  isMindmapUrl,
  resolveDocumentKind,
  resolveUploadUrl,
  type DocumentKind,
} from './media/documentKind'
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
} from './mindmap/mindmap'
export { mindmapStroke, mindmapText, mindmapFill } from './mindmap/mindmapTheme'

export type { PageType, SectionType, SectionContent } from './section/sectionTypes'
export type {
  SectionDto,
  SectionPosition,
  PageLayoutDto,
  TextContent,
  TextScale,
  ExternalLink,
  LinkStyle,
  FormField,
  FormFieldType,
  BindingEntity,
  BindingField,
  DataBindingAttrs,
} from './section/types'
export {
  readTextContent,
  TEXT_SCALE_OPTIONS,
  readImageContent,
  readLinkContent,
  LINK_STYLE_OPTIONS,
  EMPTY_EXTERNAL_LINK,
  readBackgroundContent,
  readLinkAreaContent,
  LINK_AREA_TARGET_OPTIONS,
  readCodeContent,
  CODE_LANGUAGE_OPTIONS,
  readEmbedContent,
  isEmbeddableUrl,
  readContactFormContent,
  FORM_FIELD_TYPE_OPTIONS,
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
  BINDING_FIELDS,
  BINDING_ENTITY_LABELS,
} from './section/types'
