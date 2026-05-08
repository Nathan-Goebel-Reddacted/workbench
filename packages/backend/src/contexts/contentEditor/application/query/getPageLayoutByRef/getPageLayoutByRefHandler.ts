import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetPageLayoutByRefQuery } from "./getPageLayoutByRefQuery";
import { PageLayoutDto } from "../getPageLayoutById/pageLayoutDto";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { PageLayout } from "../../../domain/pageLayoutAggregate";

export class GetPageLayoutByRefHandler implements IQueryHandler<GetPageLayoutByRefQuery, PageLayoutDto | null> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(query: GetPageLayoutByRefQuery): Promise<PageLayoutDto | null> {
        const pageLayout = await this.repository.findByRef(query.pageType, query.pageRef);
        if (!pageLayout) return null;
        return this.toDto(pageLayout);
    }

    private toDto(pageLayout: PageLayout): PageLayoutDto {
        return {
            id: pageLayout.getId().getValue(),
            pageType: pageLayout.getPageType(),
            pageRef: pageLayout.getPageRef().getValue(),
            sections: pageLayout.getSections().map(s => ({
                id: s.getId().getValue(),
                type: s.getType(),
                contentRef: s.getContentRef().getValue(),
                column: s.getPosition().getColumn(),
                order: s.getPosition().getOrder(),
            })),
        };
    }
}
