import { io, Socket } from 'socket.io-client';
import { MoveData } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
let socket: Socket | null = null;
let connectCallback: (() => void) | null = null;
let disconnectCallback: (() => void) | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Attach stored callbacks to new socket instance
    if (connectCallback) {
      socket.on('connect', connectCallback);
    }
    if (disconnectCallback) {
      socket.on('disconnect', disconnectCallback);
    }
  }
  return socket;
};

export const setSocketCallbacks = (onConnect: () => void, onDisconnect: () => void): void => {
  // Remove old callbacks if socket exists
  if (socket && connectCallback) {
    socket.off('connect', connectCallback);
  }
  if (socket && disconnectCallback) {
    socket.off('disconnect', disconnectCallback);
  }

  // Store new callbacks
  connectCallback = onConnect;
  disconnectCallback = onDisconnect;

  // Attach to current socket if it exists
  const sock = getSocket();
  sock.on('connect', onConnect);
  sock.on('disconnect', onDisconnect);
};

export const disconnectSocket = (): void => {
  if (socket) {
    // Remove callbacks before disconnecting
    if (connectCallback) {
      socket.off('connect', connectCallback);
    }
    if (disconnectCallback) {
      socket.off('disconnect', disconnectCallback);
    }
    // Disable auto-reconnection before disconnecting to prevent unwanted reconnection
    socket.io.opts.reconnection = false;
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (gameId: string, reconnectToken?: string): void => {
  const sock = getSocket();
  // Re-enable reconnection for this new connection
  sock.io.opts.reconnection = true;

  // If socket is already connected, emit immediately
  // Otherwise wait for connect event then emit
  if (sock.connected) {
    sock.emit('join_room', { gameId, reconnectToken });
  } else {
    sock.once('connect', () => {
      sock.emit('join_room', { gameId, reconnectToken });
    });
    // Ensure socket attempts to connect if not already
    if (!sock.active) {
      sock.connect();
    }
  }
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
  setSocketCallbacks,
  joinRoom,
  makeMove,
  getValidMoves,
  resignGame,
  offerDraw,
  acceptDraw,
};
