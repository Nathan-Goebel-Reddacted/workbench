import { Command } from '@shared/application/command/command';

export class AddFeatureDocumentCommand implements Command {
    static readonly commandName = 'feature.AddFeatureDocument';
    readonly commandName: string;

    constructor(
        readonly featureId: string,
        readonly documentId: string,
        readonly name: string,
        readonly url: string,
        readonly type: string,
    ) {
        this.commandName = AddFeatureDocumentCommand.commandName;
    }
}
