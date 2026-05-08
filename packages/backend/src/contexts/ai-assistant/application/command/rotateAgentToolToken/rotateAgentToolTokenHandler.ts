import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RotateAgentToolTokenCommand } from "./rotateAgentToolTokenCommand";
import { IAgentToolRepository } from "../../../domain/repository/iAgentToolRepository";
import { Token } from "../../../domain/valueObject/token";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RotateAgentToolTokenHandler implements ICommandHandler<RotateAgentToolTokenCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: RotateAgentToolTokenCommand): Promise<void> {
        const agentTool = await this.repository.findById(command.id);
        if (!agentTool) throw new NotFoundError("AgentTool", command.id);
        agentTool.rotateToken(await Token.hash(command.newToken));
        await this.repository.save(agentTool);
    }
}
