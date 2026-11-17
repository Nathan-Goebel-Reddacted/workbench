import type { PageType } from '../section/sectionTypes'
import type { FormField, ImageFit, ImagePosition, TextScale } from '../section/types'

export type ElementTransform = Readonly<{ x: number; y: number; w: number; h: number }>

export type ColorValue = Readonly<{ theme: string }> | Readonly<{ hex: string }>

export type TextComponent = Readonly<{ html: string; scale: TextScale; color: ColorValue | null }>

export type SurfaceComponent = Readonly<{
  background: ColorValue | null
  borderWidth: number
  borderColor: ColorValue | null
  radius: number
}>

export type LinkDestination =
  | Readonly<{ kind: 'page'; projectId: string }>
  | Readonly<{ kind: 'external'; url: string }>
  | Readonly<{ kind: 'none' }>

export type LinkComponent = Readonly<{
  url: string | null
  projectId: string | null
  newTab: boolean
  destination?: LinkDestination | null
}>

export type MediaComponent = Readonly<{
  url: string | null
  alt: string
  fit: ImageFit
  position: ImagePosition
}>

export type CarouselItem = Readonly<{ url: string | null; caption: string }>

export type CarouselComponent = Readonly<{ items: readonly CarouselItem[] }>

export type CodeComponent = Readonly<{ code: string; language: string; wrap: boolean }>

export type EmbedComponent = Readonly<{ url: string | null; title: string }>

export type LinkListStyle = 'link' | 'solid' | 'outline'

export type LinkListItem = Readonly<{ url: string | null; label: string; logo: string | null; newTab: boolean }>

export type LinkListComponent = Readonly<{
  links: readonly LinkListItem[]
  style: LinkListStyle
  color: ColorValue | null
  fill: ColorValue | null
}>

export type ProjectCardSummary = Readonly<{
  name: string
  description: string
  image: string | null
  destination: LinkDestination
}>

export type ProjectCardComponent = Readonly<{
  projectId: string | null
  project?: ProjectCardSummary | null
}>

export type ContactFormComponent = Readonly<{
  title: string
  fields: readonly FormField[]
  submitLabel: string
  successMessage: string
  textColor: ColorValue | null
  buttonColor: ColorValue | null
}>

export type ContentComponents = Readonly<{
  text?: TextComponent
  media?: MediaComponent
  carousel?: CarouselComponent
  code?: CodeComponent
  embed?: EmbedComponent
  linkList?: LinkListComponent
  projectCard?: ProjectCardComponent
  contactForm?: ContactFormComponent
}>

export type FacetComponents = Readonly<{
  surface?: SurfaceComponent
  link?: LinkComponent
}>

export type ElementComponents = ContentComponents & FacetComponents

export type ContentKind = keyof ContentComponents

export type ComponentKind = keyof ElementComponents

export type ElementIssue =
  | Readonly<{ kind: 'missingFile'; url: string }>
  | Readonly<{ kind: 'projectUnavailable'; projectId: string }>

export type PageElement = Readonly<{
  id: string
  transform: ElementTransform
  components: ElementComponents
  issues?: readonly ElementIssue[]
}>

export type PageDto = Readonly<{
  id: string
  pageType: PageType
  pageRef: string
  version: number
  referenceWidth: number
  hasContent: boolean
  elements: readonly PageElement[]
}>
