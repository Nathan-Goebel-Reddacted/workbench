import { PageLayout } from '../../domain/pageLayoutAggregate';
import { GRID_COLUMNS } from '../../domain/valueObject/gridPosition';
import { PageLayoutDto } from './getPageLayoutById/pageLayoutDto';

export function toPageLayoutDto(pageLayout: PageLayout): PageLayoutDto {
    return {
        id: pageLayout.getId().getValue(),
        pageType: pageLayout.getPageType(),
        pageRef: pageLayout.getPageRef().getValue(),
        allowedSectionTypes: pageLayout.allowedSectionTypes(),
        gridColumns: GRID_COLUMNS,
        sections: pageLayout.getSections().map(s => ({
            id: s.getId().getValue(),
            type: s.getType(),
            content: s.getContent().toRecord(),
            x: s.getPosition().getX(),
            y: s.getPosition().getY(),
            w: s.getPosition().getW(),
            h: s.getPosition().getH(),
        })),
    };
}
