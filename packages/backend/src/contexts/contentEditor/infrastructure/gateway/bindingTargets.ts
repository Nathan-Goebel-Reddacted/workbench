import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { ProjectId } from '@contexts/project/domain/valueObject/projectId';
import { IFeatureRepository } from '@contexts/feature/domain/repository/iFeatureRepository';
import { FeatureId } from '@contexts/feature/domain/valueObject/featureId';
import { ITicketRepository } from '@contexts/ticket/domain/repository/iTicketRepository';
import { TicketId } from '@contexts/ticket/domain/valueObject/ticketId';
import { BindingEntity, BindingRef, bindingKey } from '../../domain/component/bindings';
import { IBindingTargets } from '../../domain/port/iBindingTargets';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BindingTargets implements IBindingTargets {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly features: IFeatureRepository,
        private readonly tickets: ITicketRepository,
    ) {}

    async missing(refs: readonly BindingRef[]): Promise<ReadonlySet<string>> {
        const distinct = [...new Map(refs.map(ref => [bindingKey(ref), ref])).values()];
        const found = await Promise.all(distinct.map(ref => this.exists(ref.entity, ref.id)));
        return new Set(distinct.filter((_ref, index) => !found[index]).map(bindingKey));
    }

    private async exists(entity: BindingEntity, id: string): Promise<boolean> {
        if (!UUID.test(id)) return false;
        if (entity === 'project') return (await this.projects.findById(new ProjectId(id))) !== null;
        if (entity === 'feature') return (await this.features.findById(new FeatureId(id))) !== null;
        return (await this.tickets.findById(new TicketId(id))) !== null;
    }
}
