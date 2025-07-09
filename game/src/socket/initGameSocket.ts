import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { Server, Socket } from "socket.io";
import { JudgeResponse, User } from "../types";
import { players_ingame } from "../games/playersonline";
import { ongoing_games } from "../games/ongoing";
import { players } from "../games/useronline";

import ollama, { GenerateRequest, GenerateResponse } from 'ollama';
import { model } from "../ollama";
import { prompts } from "../prompt";

const PUBLIC_KEY = readFileSync('public.key', 'utf-8');


const leavegame = (socket, reason: string, io: Server) => {
    const game = ongoing_games.get(socket.data.game_id);
    const user = socket.data.user;
    const player = game.players[user.sub];
    player.joined=false;
    game.players[user.sub]= player;
    socket.emit('leftgame', reason);
    //emit game update event
    io.to(socket.data.game_id).emit('gameupdate', {updatetype: 'playerleft', players: game.players});
}



const joingame = (socket, io: Server) =>{
    const user = socket.data.user as User;
    const game = ongoing_games.get(socket.data.game_id);
    game.players[user.sub] = {...game.players[user.sub],joined: true, jonedAt: Date.now() };
    //emit event for game update
    io.to(socket.data.game_id).except(socket.id).emit('gameupdate', {updatetype: 'playerjoined', players: game.players});
    
}

const socketcleanup = (socket: Socket, reason:string, io: Server) => {
    console.log('cleanup socket', socket.id);

    leavegame(socket, reason, io);
    socket.leave(socket.data.game_id)
    players_ingame.delete(socket.data.user.sub);
    socket.disconnect(true);
}


export function addListeners(io: Server) {
    
    io.use((socket, next) =>{
        if(!socket.handshake.auth) return next(new Error('unauthorized'));

        const token = socket.handshake.auth.token;
        const game_id = socket.handshake.auth.game_id;
        if(!ongoing_games.has(game_id)) return next(new Error('invalid game id!'));
        verify(token.split(' ')[1], PUBLIC_KEY, { algorithms: ['RS256'] }, (err, user:User) =>{
            if(err) {
                return next(new Error(err.message));
            }else {

                const userreconnected = players.has(user.sub);
                if(userreconnected) {
                    console.log(`user ${user.sub} reconnected! cleaning up old socket before reconnecting`);                    
                    const oldsocket = players.get(user.sub);

                    socketcleanup(oldsocket, 'user reconnected!', io);
                    players.delete(user.sub);
                }

                socket.data.user = user;
                socket.data.game_id = game_id;

                joingame(socket, io);
                
                socket.join(game_id);

                players_ingame.set(user.sub, game_id);
                players.set(user.sub, socket);
                next();
            }
        })

    })
    
    io.on('connection', socket =>{
        console.log(`player joined, ${socket.id} user ${socket.data.user.name}`);
        
        socket.on('get_game', (msg, callback) => {
            const game = ongoing_games.get(socket.data.game_id);
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
            })
 
 
        })

        
    })

}













