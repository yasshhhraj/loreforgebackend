import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      name: string;
      email: string;
      picture?: string;
      sub: string;
    };
  }
}
