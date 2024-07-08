import { Server, Socket } from 'socket.io';
import { users, rooms, emitForRoom } from '../utils.js';

export const handleConnection = (io: Server, socket: Socket) => {
  const username = socket.handshake.query.username as string;

  socket.on('VALIDATE_USERNAME', (username) => {
    const isExistingUser = users.includes(username);
    if (isExistingUser) {
      socket.emit('USER_ALREADY_EXISTS', username);
    } else {
      socket.emit('USER_CREATED');
      users.push(username);
    }
  });

  rooms.forEach(room => {
    const index = room.users.findIndex(user => user.name === username);
    if (index !== -1) room.users.splice(index, 1);
  });

  const emptyRoomIndex = rooms.findIndex(room => room.users.length === 0);
  if (emptyRoomIndex !== -1) rooms.splice(emptyRoomIndex, 1);

  io.emit('UPDATE_ROOMS', rooms);

  socket.on('disconnect', () => {
    const quitedRoom = rooms.find(room => room.users.find(user => user.name === username));
    if (quitedRoom) {
      emitForRoom({ io, roomname: quitedRoom.name, message: 'DELETE_DISCONNECTED_USER_CARD', params: username });
    }
  });
};