import type { PageType } from '../section/sectionTypes'
import type { TextScale } from '../section/types'

export type ElementTransform = Readonly<{ x: number; y: number; w: number; h: number }>

export type TextComponent = Readonly<{ html: string; scale: TextScale }>

export type ElementComponents = Readonly<{
  text?: TextComponent
}>

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
