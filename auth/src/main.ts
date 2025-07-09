/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as path from 'path';
import session from 'express-session';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'jsonwebtoken';
import * as fs from 'fs';

const PRIVATE_KEY = fs.readFileSync('private.key', 'utf8');
// const PUBLIC_KEY = fs.readFileSync('public.key', 'utf8');

const app = express();
const client = new OAuth2Client(process.env.client_id);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use((req, res, next) => {
  const user = req.session.user;
  if (req.path === '/api/auth/google') return next();
  if (!user) res.status(401).send('unauthorized');
  else next();
});

app.post('/api/auth/google', async (req, res) => {
  const { idtoken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: idtoken,
      audience: process.env.client_id,
    });

    const payload = ticket.getPayload();
    if (payload) {
      req.session.user = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        sub: payload.sub,
      };

      const token = sign(req.session.user, PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: '1h',
      });

      res.json({ msg: 'login success', token });
    } else {
      console.log(' login failed');
      res.status(401).send('login failed');
    }
  } catch (err) {
    console.log(' login failed', err);
    res.status(401).send('login failed');
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log(`logout user ${req.session.user.name}`);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.send('logout success');
  });
});

app.get('/api/me', (req, res) => {
  res.json(req.session.user);
});
app.get('/api/getToken', (req, res) => {
  const token = sign(req.session.user, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '1h',
  });

  res.json({ token });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to auth! hii' });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
