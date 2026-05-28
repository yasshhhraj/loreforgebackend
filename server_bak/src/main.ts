import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { addListeners } from './socket/initGameSocket';
import { randomUUID } from 'crypto';
import { ongoing_games } from './games/ongoing';
import { Lobby,  } from './types';
import ollama from 'ollama';
import { model } from './ollama';
import { prompts } from './prompt';
import { lobbies } from './lobbies/lobbies';
import * as path from 'path';
import session from 'express-session';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'jsonwebtoken';
import * as fs from 'fs';

if (!fs.existsSync('private.key')) {
  console.error("private.key not found. Please generate a key pair.");
  process.exit(1);
}
const PRIVATE_KEY = fs.readFileSync('private.key', 'utf8');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3333;


const app = express();
const client = new OAuth2Client(process.env.client_id);
const server = createServer(app);

const io = new Server(server, {
  cors: {
      origin: ['http://localhost:5173','http://localhost:4173',],
      methods: ['GET', 'POST'],
      credentials: true
  }
})

addListeners(io);

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

app.get('/api/verifylobby', (req, res) => {
  const id = req.query.id as string;

  if (lobbies.has(id)) res.json({ exists: true, id });
  else res.status(404).json({ exists: false });
});




app.post('/queue_game', (req, res) =>{
  const lobby = req.body as Lobby;
  const players = {};
  lobby.players.forEach(player => players[player.sub] = {...player, joined: false });
  const game: any = {
    game_id: randomUUID(),
    lobby_id: lobby.id,
    players: players,
    chronicles: [],
    narrative: 'to be generated',
    status: 'ongoing'
  }
  const genreq = {
    model: model,
    system: prompts.narrator.systemPrompt,
    options: {
      temperature: 0.8
    },
    think: true,
    prompt: 'generate a unique story begggining and be creative with character names dont use generic names like elara.',
  } 

  ollama.generate({...genreq, stream: false}).then(response => {
    game.narrative = response.response;
    console.log({game});
    ongoing_games.set(game.game_id, game);
    console.log('game queued: ', game.game_id);
    
    res.json({game_id: game.game_id});

  }).catch(err =>{
    console.error(`error while genrating story ${err} `);
    res.status(500).send(err);
  })
  
})



app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

server.listen(port, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});




