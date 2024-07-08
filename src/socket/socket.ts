import { Server } from 'socket.io';
import { handleConnection } from './handlers/connectionHandler.js';
import { handleRoomEvents } from './handlers/roomHandler.js';
import { handleGameEvents } from './handlers/gameHandler.js';

export default (io: Server) => {
  io.on('connection', socket => {
    const username = socket.handshake.query.username as string;

    handleConnection(io, socket);
    handleRoomEvents(io, socket, username);
    handleGameEvents(io, socket, username);
  });
};
