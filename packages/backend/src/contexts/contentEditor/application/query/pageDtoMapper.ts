import { Page } from '../../domain/pageAggregate';
import { REFERENCE_WIDTH } from '../../domain/valueObject/transform';
import { PageDto } from './pageDto';

export function toPageDto(page: Page): PageDto {
    return {
        id: page.getId().getValue(),
        pageType: page.getPageType(),
        pageRef: page.getPageRef().getValue(),
        version: page.getVersion(),
        referenceWidth: REFERENCE_WIDTH,
        elements: page.getElements().map(element => {
            const t = element.getTransform();
            return {
                id: element.getId().getValue(),
                transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() },
                components: element.getComponents(),
            };
        }),
    };
}
