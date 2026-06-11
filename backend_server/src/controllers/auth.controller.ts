import { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "../validations/auth.validation";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedData = RegisterSchema.parse(req.body);
      const result = await this.authService.register(parsedData);
      res.status(201).json({ success: true, user: result });
    } catch (error: any) {      
      res.status(400).json({ success: false, error: error.message || error });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedData = LoginSchema.parse(req.body);
      const { sessionToken, expires, user } = await this.authService.login(parsedData);
      console.log(parsedData);
      
      // Secure cookie insertion to mitigate XSS attacks
      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expires,
        sameSite: "strict",
      });

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      console.log(error);
      res.status(401).json({ success: false, error: error.message || error });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.cookies?.session_token || req.headers.authorization?.split(" ")[1];
      if (token) {
        await this.authService.logout(token);
      }
      res.clearCookie("session_token");
      res.status(200).json({ success: true, message: "Logged out safely" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}