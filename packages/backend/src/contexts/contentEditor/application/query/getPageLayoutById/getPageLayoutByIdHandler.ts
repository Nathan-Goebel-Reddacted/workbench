import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetPageLayoutByIdQuery } from "./getPageLayoutByIdQuery";
import { PageLayoutDto } from "./pageLayoutDto";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { PageLayout } from "../../../domain/pageLayoutAggregate";

export class GetPageLayoutByIdHandler implements IQueryHandler<GetPageLayoutByIdQuery, PageLayoutDto | null> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(query: GetPageLayoutByIdQuery): Promise<PageLayoutDto | null> {
        const pageLayout = await this.repository.findById(query.id);
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
