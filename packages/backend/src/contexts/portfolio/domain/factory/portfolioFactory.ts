import { Portfolio } from "../portfolioAggregate";
import { PortfolioId } from "../value-objects/portfolioId";
import { UserId } from "../value-objects/userId";
import { Description } from "../value-objects/description";
import { Link } from "../value-objects/link";
import type { UUID } from "crypto";

type LinkInput = { url: string; displayText: string; logo: string };

export class PortfolioFactory {
    create(id: string, userId: string, description: string, links: LinkInput[] = []): Portfolio {
        return new Portfolio(
            new PortfolioId(id),
            new UserId(userId as UUID),
            new Description(description),
            links.map(l => new Link(l.url, l.displayText, l.logo)),
        );
    }
}
