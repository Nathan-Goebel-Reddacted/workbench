import { ScreenSize } from '../../domain/valueObject/screenSize';
import { BindingEntity } from '../../domain/component/bindings';

export type ElementIssue =
    | Readonly<{ kind: 'missingFile'; url: string }>
    | Readonly<{ kind: 'projectUnavailable'; projectId: string }>
    | Readonly<{ kind: 'missingBinding'; entity: BindingEntity; id: string }>;

export type TransformDto = Readonly<{ x: number; y: number; w: number; h: number }>;

export type PlacementDto = Readonly<{ transform: TransformDto; hidden: boolean }>;

export type ScreenDto = Readonly<{ width: number; maxHeight: number; minViewport: number }>;

export type ElementDto = Readonly<{
    id: string;
    layout: Readonly<Record<ScreenSize, PlacementDto>>;
    components: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    issues: readonly ElementIssue[];
}>;

export type PageDto = Readonly<{
    id: string;
    pageType: string;
    pageRef: string;
    version: number;
    screens: Readonly<Record<ScreenSize, ScreenDto>>;
    hasContent: boolean;
    elements: readonly ElementDto[];
}>;
