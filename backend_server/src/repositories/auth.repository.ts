import { prisma } from "../../lib/prisma";
import { RegisterInput } from "../validations/auth.validation";

export class AuthRepository {
  async findUserByEmailOrUsername(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  async createUser(data: RegisterInput, passwordHash: string) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: passwordHash,
      }
    });
  }

  async createSession(userId: string, sessionToken: string, expires: Date) {
    return prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires,
      }
    });
  }

  async deleteSession(sessionToken: string) {
    return prisma.session.delete({
      where: { sessionToken }
    });
  }
}