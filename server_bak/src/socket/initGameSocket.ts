import { verify } from "jsonwebtoken";
import { readFileSync, existsSync } from "fs";
import { Server, Socket } from "socket.io";
import { JudgeResponse, User, Lobby } from "../types";
import { players_ingame } from "../games/playersonline";
import { ongoing_games } from "../games/ongoing";
import { players as online_players } from "../games/useronline";
import { getLobby, lobbies } from '../lobbies/lobbies';
import { connections, socketlobby, userownedLobby, users } from '../players/online';
import { randomUUID } from "crypto";

import ollama, { GenerateRequest, GenerateResponse } from 'ollama';
import { model } from "../ollama";
import { prompts } from "../prompt";

if (!existsSync('public.key')) {
  console.error("public.key not found. Please generate a key pair.");
  process.exit(1);
}
const PUBLIC_KEY = readFileSync('public.key', 'utf-8');

const leavegame = (socket, reason: string, io: Server) => {
    const game = ongoing_games.get(socket.data.game_id);
    if (!game) {
        return;
    }
    const user = socket.data.user;
    const player = game.players[user.sub];
    player.joined=false;
    game.players[user.sub]= player;
    socket.emit('leftgame', reason);
    io.to(socket.data.game_id).emit('gameupdate', {updatetype: 'playerleft', players: game.players});
}

const joingame = (socket, io: Server) =>{
    const user = socket.data.user as User;
    const game = ongoing_games.get(socket.data.game_id);
    game.players[user.sub] = {...game.players[user.sub],joined: true, jonedAt: Date.now() };
    io.to(socket.data.game_id).except(socket.id).emit('gameupdate', {updatetype: 'playerjoined', players: game.players});
}

const socketcleanup = (socket: Socket, reason:string, io: Server) => {
    console.log('cleanup socket', socket.id);
    leavegame(socket, reason, io);
    if (socket.data.game_id) {
        socket.leave(socket.data.game_id);
        players_ingame.delete(socket.data.user.sub);
    }
    const lobby_id = socketlobby.get(socket.id);
    if (lobby_id) {
        socket.leave(lobby_id);
        socketlobby.delete(socket.id);
    }
    connections.delete(socket.data.user.sub);
    socket.disconnect(true);
}

export function addListeners(io: Server) {
    
    io.use((socket, next) =>{
        if(!socket.handshake.auth) return next(new Error('unauthorized'));

        const token = socket.handshake.auth.token;
        verify(token.split(' ')[1], PUBLIC_KEY, { algorithms: ['RS256'] }, (err, user:User) =>{
            if(err) {
                return next(new Error(err.message));
            } else {
                const previousSocket = connections.get(user.sub);
                if (previousSocket && previousSocket.id !== socket.id) {
                  console.log(`User ${user.name} (${user.sub}) has a new connection. Disconnecting previous socket ${previousSocket.id}.`);
                  socketcleanup(previousSocket, 'reconnected', io);
                }
                users.set(user.sub, user);
                connections.set(user.sub, socket);
                socket.data.user = user;
                next();
            }
        })
    })
    
    io.on('connection', socket =>{
        console.log(`player joined, ${socket.id} user ${socket.data.user.name}`);

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
      
            if (lobby.players.length == 0) {
                lobbies.delete(lobby.id);
            }
            else {
                lobby.host = users.get(lobby.players[0].sub);
                lobby.players[0].isHost = true;
            }
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
            if (lobby.host.sub !== socket.data.user.sub) {
                return;
            }
            lobby.players = lobby.players.filter((player) => player.sub != msg.sub);
      
            const playersocket = connections.get(msg.sub);
            playersocket.emit('kickedout', { lobby_id: msg.lobby_id });
            playersocket.leave(msg.lobby_id);
            socketlobby.delete(playersocket.id);
            io.to(lobby.id).emit('lobbyupdate', lobby);
          });
      
          socket.on('startGame', ({lobby_id}: {lobby_id: string}, callback) => {
            const lobby = lobbies.get(lobby_id);
            const players = {};
            lobby.players.forEach(player => players[player.sub] = {...player, joined: false });
            const game = {
                game_id: randomUUID(),
                lobby_id: lobby.id,
                players: players,
                chronicles: [],
                narrative: 'to be generated',
                status: 'ongoing'
            };
            ongoing_games.set(game.game_id, game);
            io.to(lobby_id).emit('to_game', { game_id: game.game_id });
            callback();
          });
        
        socket.on('get_game', (msg, callback) => {
            const game_id = msg.game_id;
            socket.data.game_id = game_id;
            joingame(socket, io);
            socket.join(game_id);
            const game = ongoing_games.get(game_id);
            callback(game);
        })

        socket.on('submission', (msg, callback) =>{
            const submission = msg.submission as string;
            const game = ongoing_games.get(socket.data.game_id);

            const genreq: GenerateRequest = {
                model: model,
                format: 'json',
                think: true,
                system: prompts.judge.systemPrompt,
                prompt: JSON.stringify({storyContext: [game.narrative, ...game.chronicles], playerAction: submission}),
            }

            ollama.generate({...genreq, stream: false}).then(response =>{
                console.log(response.response);
                let res = response.response;
                res= res.replaceAll('\n', '');
                if(res.startsWith('{{')) res = res.slice(1);
                socket.emit('logthis', response);
                try {
                    const resp = JSON.parse(res) as JudgeResponse;
                    
                    const accepted = resp.accepted ;

                    if(accepted) {
                        const newchronicles ={
                            sno: game.chronicles.length+1,
                            player: socket.data.user.name,
                            action: resp.revisedAction
                        } 
                        game.chronicles.push(newchronicles)
                        callback({accepted: true});
                        io.to(socket.data.game_id).emit('gameupdate', {type: 'newchronicles', delta: newchronicles});
                    }else {
                        callback({accepted: false, reason: resp.reasons});
                    }
                } catch (error) {
                    console.error("Failed to parse ollama response", error);
                    callback({ accepted: false, reason: "Failed to parse AI response" });
                }
            }).catch(err => {
                console.error("ollama generate error", err);
                callback({ accepted: false, reason: "AI request failed" });
            });
        })

        socket.on('disconnect', () => {
            socketcleanup(socket, 'disconnected', io);
        });
    })
}
