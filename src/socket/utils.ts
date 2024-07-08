import { Server } from 'socket.io';

export const users: string[] = [];
export const rooms: Array<{ name: string, users: Array<{ name: string, id: string, status: boolean, percentOfTextDone: number, userTime: number }> }> = [];

export const getUpdatedRoom = (name: string, user?: string, id?: string) => {
  const roomIndex = rooms.findIndex((room) => room.name === name);
  if (user) rooms[roomIndex].users.push({ name: user, id: id!, status: false, percentOfTextDone: 0, userTime: 60 });
  return rooms[roomIndex];
};

export const emitForRoom = ({ io, roomname, message, params }) => {
  rooms.forEach(room => {
    if (room.name === roomname) {
      room.users.forEach(user => {
        io.to(user.id).emit(message, params);
      });
    }
  });
};