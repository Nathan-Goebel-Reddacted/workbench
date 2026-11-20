import { BindingRef } from '../component/bindings';

export interface IBindingTargets {
    missing(refs: readonly BindingRef[]): Promise<ReadonlySet<string>>;
}
