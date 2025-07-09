import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { getLobby, lobbies } from '../lobbies/lobbies';
import { Lobby, User } from '../types';
import { connections,socketlobby,userownedLobby,users } from '../players/online';

const PUBLIC_KEY = readFileSync('public.key', 'utf-8');
// const PRIVATE_KEY = readFileSync('private.key', 'utf-8');

const cleaupSocket = (socket: Socket, deleteUser?: boolean) => {
  console.log('cleaning up for socket', socket.id);
  const user = socket.data.user as User;
  if (deleteUser) users.delete(user.sub);
  
  const lobby_id = socketlobby.get(socket.id);
  if (lobby_id) {
    socket.leave(lobby_id);
    socketlobby.delete(socket.id);
  }
  socket.emit('forceDisconnect', 'You connected from another location.');
  connections.delete(user.sub);
  socket.disconnect(true);
};

export const addListeners = (io: Server) => {
  io.use((socket, next) => {
    const authorization = socket.handshake.auth.token;
    if (!authorization) {
      socket.data.user = undefined;
    } else {
      const token = authorization.split(' ')[1];
      verify(
        token,
        PUBLIC_KEY,
        { algorithms: ['RS256'] },
        (err, user: User) => {
          if (err) {
            return next(new Error(err.message));
          } else {
            const previousSocket = connections.get(user.sub);
            if (previousSocket && previousSocket.id !== socket.id) {
              console.log(`User ${user.name} (${user.sub}) has a new connection. Disconnecting previous socket ${previousSocket.id}.`);
              cleaupSocket(previousSocket);
            }
            users.set(user.sub, user);
            connections.set(user.sub, socket);
            socket.data.user = user;
            next();
          }
        }
      );
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connected');
    console.log(
      `socket connected ${socket.id}\t user ${socket.data.user.name}`
    );

    socket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err.message);
    });

    socket.on('createlobby', (_, callback) => {
      const alreadyhaslobby = userownedLobby.get(socket.data.user.sub);
      if (alreadyhaslobby) {
        console.log(
          'user already created  a lobby that is alive: ',
          alreadyhaslobby
        );
        return callback(
          'duplicate',
          'user aready created a lobby',
          alreadyhaslobby
        );
      }

      const lobby: Lobby = {
        id: randomUUID(),
        created_at: Date.now(),
        host: {
          ...socket.data.user,
        },
        players: [],
      };
      lobbies.set(lobby.id, lobby);
      userownedLobby.set(socket.data.user.sub, lobby.id);

      callback('success', 'created new lobby', lobby.id);
    });

    socket.on('deletelobby', async (msg, callback) => {
      const sockets = await io.in(msg.lobby_id).fetchSockets();
      sockets.forEach(s =>{
        s.leave(msg.lobby_id);
        socketlobby.delete(s.id);
        s.emit('lobbyunavailable')
      })
      lobbies.delete(msg.lobby_id);
      callback();
    });

    socket.on('joinlobby', (msg) => {
      const lobby = lobbies.get(msg.id);

      if (!lobby) {
        socket.emit('lobbyunavailable');
        return;
      }

      // checking if player  is already in lobby
      const playerexists = lobby.players.some( player => player.sub === socket.data.user.sub );

      if(playerexists) console.log('user already in lobby');
      else {
        lobby.players.push({
          ...socket.data.user,
          isHost: lobby.host.sub == socket.data.user.sub,
          isReady: false,
          team: 'A',
          joinedAt: Date.now(),
        });
        socketlobby.set(socket.id, msg.id);
      }

      socket.join(msg.id);
      io.to(msg.id).emit('lobbyupdate', lobby);
    });

    socket.on('swapteam', (msg, callback) => {
      const lobby_id = msg.lobby_id;
      const lobby = lobbies.get(lobby_id) as Lobby;
      const player_sub = socket.data.user.sub;
      if (lobby.host.sub == player_sub)
        return callback({
          success: false,
          reason: 'host',
          msg: "host can't change team!",
        });
      lobby.players = lobby.players.map( player => {
        if (player.sub == player_sub)
          return { ...player, team: player.team == 'A' ? 'B' : 'A' };
        else return player;
      });
      io.to(lobby_id).emit('lobbyupdate', lobby);
    });

    socket.on('leaveLobby', (msg, callback) => {
      const lobby = lobbies.get(msg.lobby_id) as Lobby;
      
      if (!lobby) {
        socket.emit('lobbyunavailable');
        return;
      }
      
      socket.leave(msg.lobby_id);
      socketlobby.delete(socket.id);
      lobby.players  = lobby.players.filter(
        (player) => player.sub != socket.data.user.sub
      );

      if (lobby.players.length == 0) lobbies.delete(lobby.id);
      else lobby.host = users.get(lobby.players[0].sub)
      callback();
      io.to(msg.lobby_id).emit('lobbyupdate', lobby);
      console.log(`${socket.data.user.name} left lobby ${msg.lobby_id}`);
      console.log(`lobby state: ${lobbies.get(msg.lobby_id)}`);
    });

    socket.on('getlobby', (msg, callback) => {
      const id = msg.id as string;
      const lobby = getLobby(id);
      callback(lobby);
    });

    socket.on('toggleready', (msg) => {
      const sub = socket.data.user.sub;
      const lobby = lobbies.get(msg.lobby_id);

      if (!lobby) {
        socket.emit('lobbyunavailable');
        return;
      }

      lobby.players = lobby.players.map((player) => {
        if (player.sub == sub) {
          return { ...player, isReady: !player.isReady };
        } else return player;
      });

      io.to(msg.lobby_id).emit('lobbyupdate', lobby);
    });

    socket.on('kickplayer', (msg) => {
      console.log('kickout player ', msg.sub);

      const lobby = lobbies.get(msg.lobby_id);
      lobby.players = lobby.players.filter((player) => player.sub != msg.sub);

      const playersocket = connections.get(msg.sub);
      playersocket.emit('kickedout', { lobby_id: msg.lobby_id });
      playersocket.leave(msg.lobby_id);
      socketlobby.delete(playersocket.id);
      io.to(lobby.id).emit('lobbyupdate', lobby);
    });

    socket.on('startGame', ({lobby_id}: {lobby_id: string}, callback) => {
      fetch('http://localhost:3335/queue_game', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.internal_secret,
        },
        body: JSON.stringify(lobbies.get(lobby_id)),
      }).then((res) => {
        if (res.ok) {
          res.json().then((data) => {
            console.log(`game queued: ${data.game_id}`);
            callback();
            io.to(lobby_id).emit('to_game', { game_id: data.game_id });
          });
        }
      }).catch(err =>{
        console.error('error queuing game \n',err);
        callback({err});
      })
    });

    socket.on('cleanup_before_reload', () => {
      console.log('connection severed due to network! or reload');
      cleaupSocket(socket, true);
    });

    socket.on('disconnect', () => {
      socket.leave(socketlobby.get(socket.id));
      socket.disconnect(true);
    });
  });
};
