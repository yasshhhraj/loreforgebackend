import crypto from "crypto";
import bcrypt from 'bcrypt';
import { AuthRepository } from "../repositories/auth.repository";
import { LoginInput, RegisterInput } from "../validations/auth.validation";

export class AuthService {
  private authRepository = new AuthRepository();
  private SALT_ROUNDS = 12;

  async register(input: RegisterInput) {
    const existing = await this.authRepository.findUserByEmailOrUsername(input.email);
    if (existing) throw new Error("Account credentials already taken");

    const passwordHash = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    const user = await this.authRepository.createUser(input, passwordHash);
    
    return { id: user.id, username: user.username, email: user.email };
  }

  async login(input: LoginInput) {
    const user = await this.authRepository.findUserByEmailOrUsername(input.usernameOrEmail);
    if (!user || !user.passwordHash) {
      throw new Error("Invalid username, email, or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) throw new Error("Invalid username, email, or password");

    // Generate session token (unbreakable token string)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 Days valid

    await this.authRepository.createSession(user.id, sessionToken, sessionExpiry);

    return {
      sessionToken,
      expires: sessionExpiry,
      user: { id: user.id, username: user.username, email: user.email }
    };
  }

  async logout(token: string) {
    await this.authRepository.deleteSession(token);
  }
}