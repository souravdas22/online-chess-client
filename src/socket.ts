import { io, Socket } from 'socket.io-client';
import { MoveData } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (gameId: string, reconnectToken?: string): void => {
  const sock = getSocket();
  sock.emit('join_room', { gameId, reconnectToken });
};

export const makeMove = (gameId: string, move: MoveData): void => {
  const sock = getSocket();
  sock.emit('make_move', { gameId, move });
};

export const getValidMoves = (gameId: string, square: string): void => {
  const sock = getSocket();
  sock.emit('get_valid_moves', { gameId, square });
};

export const resignGame = (gameId: string): void => {
  const sock = getSocket();
  sock.emit('resign', { gameId });
};

export const offerDraw = (gameId: string): void => {
  const sock = getSocket();
  sock.emit('offer_draw', { gameId });
};

export const acceptDraw = (gameId: string): void => {
  const sock = getSocket();
  sock.emit('accept_draw', { gameId });
};

export default {
  getSocket,
  disconnectSocket,
  joinRoom,
  makeMove,
  getValidMoves,
  resignGame,
  offerDraw,
  acceptDraw,
};
