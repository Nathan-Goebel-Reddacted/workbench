import { Command } from "./command";

export interface ICommandHandler<C extends Command> {
    handle(command: C): Promise<void>;
}
