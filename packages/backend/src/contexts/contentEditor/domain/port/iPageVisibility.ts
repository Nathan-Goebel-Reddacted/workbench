import { PageType } from '../valueObject/pageType';
import { PageRef } from '../valueObject/pageRef';

/**
 * Ce que l'éditeur de contenu a le droit de savoir de la page qu'il habille : si elle est
 * publique, et rien d'autre.
 *
 * Il ne lit ni les projets ni le portfolio — il ne saurait d'ailleurs pas ce qui rend l'un
 * ou l'autre visible. Il pose la question, et celui qui détient la page répond.
 */
export interface IPageVisibility {
    /** Faux si la page est masquée, et faux aussi si elle n'existe pas. */
    isPublic(pageType: PageType, pageRef: PageRef): Promise<boolean>;
}
