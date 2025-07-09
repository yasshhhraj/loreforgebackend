import express from 'express';
import * as path from 'path';
import session from 'express-session';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { addListeners } from './socket/initsocket';
import { lobbies } from './lobbies/lobbies';


// const PUBLIC_KEY = readFileSync('public.key');


const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

addListeners(io);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'], // or whatever your frontend origin is
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);


// app.use((req, res, next) => {
//   const authorization = req.headers.authorization;
//   if (!authorization) {
//     res.status(401).send('authorization not included');
//     return;
//   }

//   const token = authorization.split(' ')[1];

//   verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, user) => {
//     if (err) res.status(401).send('unauthorized');
//     else {
//       req.session.user = user;
//       next();
//     }
//   });
// });

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to lobby service!' });
});

app.get('/api/verifylobby', (req, res) => {
  const id = req.query.id as string;

  if (lobbies.has(id)) res.json({ exists: true, id });
  else res.status(404).json({ exists: false });
});

const port = process.env.PORT || 3334;
server
  .listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
  })
  .on('error', console.error);
