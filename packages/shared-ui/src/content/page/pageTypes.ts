import type { PageType } from '../section/sectionTypes'
import type { TextScale } from '../section/types'

export type ElementTransform = Readonly<{ x: number; y: number; w: number; h: number }>

export type ColorValue = Readonly<{ theme: string }> | Readonly<{ hex: string }>

export type TextComponent = Readonly<{ html: string; scale: TextScale; color: ColorValue | null }>

export type SurfaceComponent = Readonly<{
  background: ColorValue | null
  borderWidth: number
  borderColor: ColorValue | null
  radius: number
}>

export type ContentComponents = Readonly<{
  text?: TextComponent
}>

export type FacetComponents = Readonly<{
  surface?: SurfaceComponent
}>

export type ElementComponents = ContentComponents & FacetComponents

export type ContentKind = keyof ContentComponents

export type ComponentKind = keyof ElementComponents

export type PageElement = Readonly<{
  id: string
  transform: ElementTransform
  components: ElementComponents
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
