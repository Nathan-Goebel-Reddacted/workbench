import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { IPortfolioRepository } from '@contexts/portfolio/domain/repository/iPortfolioRepository';
import { ProjectId } from '@contexts/project/domain/valueObject/projectId';
import { PortfolioId } from '@contexts/portfolio/domain/valueObject/portfolioId';
import { IPageVisibility } from '../../domain/port/iPageVisibility';
import { PageType } from '../../domain/valueObject/pageType';
import { PageRef } from '../../domain/valueObject/pageRef';

/**
 * Traduit « cette page est-elle publique ? » dans le vocabulaire de chaque porteur.
 *
 * Un projet porte son propre drapeau de visibilité. Le portfolio n'en a pas : il est public
 * dès lors qu'il existe — c'est la page d'accueil du site.
 */
export class PageVisibility implements IPageVisibility {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly portfolios: IPortfolioRepository,
    ) {}

    async isPublic(pageType: PageType, pageRef: PageRef): Promise<boolean> {
        switch (pageType) {
            case PageType.PROJECT: {
                const project = await this.projects.findById(new ProjectId(pageRef.getValue()));
                return project !== null && project.isVisible();
            }
            case PageType.PORTFOLIO: {
                const portfolio = await this.portfolios.findById(new PortfolioId(pageRef.getValue()));
                return portfolio !== null;
            }
        }
    }
}
