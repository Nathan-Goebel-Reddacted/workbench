import type { PageType } from '../section/sectionTypes'
import type { BindingEntity, FormField, ImageFit, ImagePosition } from '../section/types'

export type ElementTransform = Readonly<{ x: number; y: number; w: number; h: number }>

export type ColorValue = Readonly<{ theme: string }> | Readonly<{ hex: string }>

export type TextFont = 'heading' | 'body'

export type TextComponent = Readonly<{
  html: string
  font: TextFont
  fontSize: Readonly<Record<ScreenSize, number>>
  uppercase: boolean
  letterSpacing: number
  color: ColorValue | null
}>

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

export type MediaFileRef = Readonly<{ url: string | null; alt: string }>

export type MediaComponent = Readonly<{
  files: readonly MediaFileRef[]
  fit: ImageFit
  position: ImagePosition
}>

export type CodeComponent = Readonly<{ code: string; language: string; wrap: boolean }>

export type EmbedComponent = Readonly<{ url: string | null; title: string }>

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
  code?: CodeComponent
  embed?: EmbedComponent
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
  | Readonly<{ kind: 'missingBinding'; entity: BindingEntity; id: string }>

export type ScreenSize = 'desktop' | 'tablet' | 'mobile'

export type ElementPlacement = Readonly<{ transform: ElementTransform; hidden: boolean }>

export type ElementLayout = Readonly<Record<ScreenSize, ElementPlacement>>

export type ScreenSpec = Readonly<{ width: number; maxHeight: number; minViewport: number }>

export type PageElementDto = Readonly<{
  id: string
  layout: ElementLayout
  components: ElementComponents
  issues?: readonly ElementIssue[]
}>

export type PageDto = Readonly<{
  id: string
  pageType: PageType
  pageRef: string
  version: number
  screens: Readonly<Record<ScreenSize, ScreenSpec>>
  hasContent: boolean
  elements: readonly PageElementDto[]
}>

export type PageElement = PageElementDto & Readonly<{ transform: ElementTransform; hidden: boolean }>

export type ScreenPage = Readonly<
  Omit<PageDto, 'elements'> & { screen: ScreenSize; referenceWidth: number; elements: readonly PageElement[] }
>
