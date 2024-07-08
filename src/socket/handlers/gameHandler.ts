import { Server, Socket } from 'socket.io';
import { texts } from '../../data.js';
import { rooms, emitForRoom } from '../utils.js';
import * as config from '../config.js';

export const handleGameEvents = (io: Server, socket: Socket, username: string) => {
  socket.on('READY_STATUS', ({ status, username, roomname }) => {
    const roomIndex = rooms.findIndex(room => room.name === roomname);
    const userIndex = rooms[roomIndex].users.findIndex(user => user.name === username);
    rooms[roomIndex].users[userIndex].status = status;
    const notReady = rooms[roomIndex].users.find(user => !user.status);
    if (!notReady) {
      emitForRoom({ io, roomname, message: 'START_TIMER', params: roomname });
      io.emit('HIDE_ROOM', roomname);
    }
    emitForRoom({ io, roomname, message: 'UPDATE_ROOM', params: { name: roomname, users: rooms[roomIndex].users } });
  });

  socket.on('GET_TEXT', (roomname) => {
    const randomText = texts[Math.round(Math.random() * 6)];
    emitForRoom({ io, roomname, message: 'RECEIVE_TEXT', params: { randomText, roomname } });
  });

  socket.on('FIND_PROGRESS', ({ notReady, entire, roomname }) => {
    const percent = 100 - 100 * notReady / entire;
    emitForRoom({ io, roomname, message: 'SET_PROGRESS', params: { percent, username, roomname } });
  });

  socket.on('USER_FINISHED_GAME', ({ percent, username, roomname, timeLefted }) => {
    const roomIndex = rooms.findIndex(room => room.name === roomname);
    const userIndex = rooms[roomIndex].users.findIndex(user => user.name === username);

    rooms[roomIndex].users[userIndex].percentOfTextDone = percent;
    rooms[roomIndex].users[userIndex].userTime = config.SECONDS_FOR_GAME - timeLefted;

    const areAllFinished = rooms[roomIndex].users.every(user => user.percentOfTextDone === percent);
    if (areAllFinished) {
      emitForRoom({ io, roomname, message: 'GAME_OVER', params: { users: rooms[roomIndex].users, roomname } });
      rooms[roomIndex].users.forEach(user => {
        user.percentOfTextDone = 0;
        user.status = false;
        user.userTime = config.SECONDS_FOR_GAME;
      });
    }
  });

  socket.on('TIME_OVER', ({ notReady, entire, roomname, username }) => {
    const roomIndex = rooms.findIndex(room => room.name === roomname);
    const userIndex = rooms[roomIndex].users.findIndex(user => user.name === username);
    const percent = 100 - 100 * notReady / entire;
    rooms[roomIndex].users[userIndex].percentOfTextDone = percent;

    emitForRoom({ io, roomname, message: 'GAME_OVER', params: { users: rooms[roomIndex].users, roomname } });
    rooms[roomIndex].users.forEach(user => {
      user.percentOfTextDone = 0;
      user.status = false;
      user.userTime = config.SECONDS_FOR_GAME;
    });
  });
};