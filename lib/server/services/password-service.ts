import "server-only";

import bcrypt from "bcryptjs";

export class PasswordService {
  private readonly saltRounds = 12;

  hash(password: string) {
    return bcrypt.hash(password, this.saltRounds);
  }

  verify(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }
}
