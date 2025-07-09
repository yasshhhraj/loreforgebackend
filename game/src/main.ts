import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { addListeners } from './socket/initGameSocket';
import { randomUUID } from 'crypto';
import { ongoing_games } from './games/ongoing';
import { Game, Lobby,  } from './types';
import ollama from 'ollama';
import { model } from './ollama';
import { prompts } from './prompt';
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3335;


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
      origin: ['http://localhost:5173','http://localhost:4173',],
      methods: ['GET', 'POST'],
      credentials: true
  }
})

addListeners(io);

app.use(express.json());



app.post('/queue_game', (req, res) =>{
  const lobby = req.body as Lobby;
  const players = {};
  lobby.players.forEach(player => players[player.sub] = {...player, joined: false });
  const game: Game = {
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




