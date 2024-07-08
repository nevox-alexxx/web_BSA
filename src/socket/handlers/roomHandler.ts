import { Server, Socket } from 'socket.io';
import { rooms, getUpdatedRoom, emitForRoom } from '../utils.js';
import * as config from '../config.js';

export const handleRoomEvents = (io: Server, socket: Socket, username: string) => {
  socket.on('CREATE_ROOM', (roomname) => {
    const sameNameCheck = rooms.find(room => room.name === roomname);

    if (sameNameCheck) {
      socket.emit('UNAVAILABLE_ROOM_NAME');
    } else {
      rooms.push({ name: roomname, users: [] });
      socket.emit('CREATED_ROOM', roomname);
    }
  });

  socket.on('JOIN_ROOM', ({ roomname, isOwner }) => {
    const updatedRoom = getUpdatedRoom(roomname, username, socket.id);
    if (isOwner) {
      io.emit('SHOW_ROOM', rooms.find(room => room.name === roomname));
    }

    emitForRoom({ io, roomname, message: 'UPDATE_ROOM', params: { name: updatedRoom.name, users: updatedRoom.users }});
    if (updatedRoom.users.length === config.MAXIMUM_USERS_FOR_ONE_ROOM) io.emit('HIDE_ROOM', roomname);
    io.emit('UPDATE_USERS', { name: updatedRoom.name, users: updatedRoom.users });
  });

  socket.on('QUIT_ROOM', (roomname) => {
    const roomIndex = rooms.findIndex(room => room.name === roomname);
    const userIndex = rooms[roomIndex].users.findIndex(user => user.name === username);
    rooms[roomIndex].users.splice(userIndex, 1);

    if (!rooms[roomIndex].users.length) {
      rooms.splice(roomIndex, 1);
      io.emit('DELETE_ROOM', roomname);
      return;
    }
    emitForRoom({ io, roomname, message: 'UPDATE_ROOM', params: { name: roomname, users: rooms[roomIndex].users, quitedUser: username }});

    const checkForRoomReadiness = rooms[roomIndex].users.find(user => user.status === false);
    if (!checkForRoomReadiness) {
      emitForRoom({ io, roomname, message: 'START_TIMER', params: roomname });
    }
    
    if (rooms[roomIndex].users.length === config.MAXIMUM_USERS_FOR_ONE_ROOM - 1) io.emit('DISPLAY_ROOM', roomname);
    io.emit('UPDATE_USERS', { name: roomname, users: rooms[roomIndex].users });
  });
};