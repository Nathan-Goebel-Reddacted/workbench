export { MindmapView } from './mindmap/MindmapView'
export { PageRenderer } from './page/PageRenderer'
export { CONTENT_RENDERERS, type ContentRenderers } from './page/contentRenderers'
export { cssColor } from './page/color'
export { linkHref, projectPagePath } from './page/linkHref'
export { clearBindingCache } from './richText/dataBinding'
export { PAGE_BOTTOM_MARGIN, readingRows, readingOrder, pageHeight, pageScale } from './page/pageGeometry'
export type {
  PageDto,
  PageElement,
  ElementTransform,
  ElementComponents,
  ComponentKind,
  ContentKind,
  ColorValue,
  TextComponent,
  SurfaceComponent,
  LinkComponent,
  LinkDestination,
  MediaComponent,
  CarouselComponent,
  CarouselItem,
  ElementIssue,
  CodeComponent,
  EmbedComponent,
  LinkListComponent,
  LinkListItem,
  LinkListStyle,
  ProjectCardComponent,
  ProjectCardSummary,
  ContactFormComponent,
} from './page/pageTypes'
export { buildRichTextExtensions } from './richText/richTextExtensions'

export { GAP, rowHeightFor, gridHeightFor, sectionBox, growForType } from './grid/gridGeometry'
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

export type { PageType } from './section/sectionTypes'
export type { TextScale, BindingEntity, BindingField, DataBindingAttrs, ImageFit, ImagePosition } from './section/types'
export {
  TEXT_SCALE_OPTIONS,
  BINDING_FIELDS,
  BINDING_ENTITY_LABELS,
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
} from './section/types'
