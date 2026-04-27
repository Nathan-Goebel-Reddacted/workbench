import { UUID } from "crypto";
import { UserIdRequiredException } from "../exception/userIdRequired";

export class UserId {
  constructor(private readonly value: UUID) {
    if (!value) {
      throw new UserIdRequiredException();
    }
  }

  getValue() {
    return this.value;
  }
}