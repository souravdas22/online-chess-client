import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSocket, disconnectSocket } from './socket';
import { GameState, PlayerColor, GameMove, TimeControl } from './types';
import { Chess } from 'chess.js';
import GameInfo from './components/GameInfo';
import RoomManager from './components/RoomManager';
import ChessBoard from './components/ChessBoard';
import Timer from './components/Timer';
import CapturedPieces from './components/CapturedPieces';

function App() {
  const [gameId, setGameId] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chess] = useState(() => new Chess());
  const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1); // -1 = current position, 0+ = viewing history

  // Setup socket event listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('assign_role', ({ color }: { color: PlayerColor }) => {
      setPlayerColor(color);
      setError(null);
    });

    socket.on('game_state', (state: GameState) => {
      setGameState(state);
      // Sync local chess instance with server FEN
      try {
        chess.load(state.fen);
      } catch {
        console.error('Failed to load FEN:', state.fen);
      }
      // Reset to current position when game state updates (new move made)
      setViewMoveIndex(-1);
    });

    socket.on('move_made', (move: GameMove) => {
      try {
        chess.move({
          from: move.from,
          to: move.to,
          promotion: 'q',
        });
        // Reset to current position when a new move is made
        setViewMoveIndex(-1);
      } catch {
        console.error('Failed to sync move:', move);
      }
    });

    socket.on('room_full', ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on('move_error', ({ error: err }: { error: string }) => {
      setError(err);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('game_over', ({ reason, winner }: { reason: string; winner?: PlayerColor }) => {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              isGameOver: true,
              gameOverReason: reason,
              winner,
            }
          : null
      );
    });

    socket.on('player_disconnected', ({ color }: { color: PlayerColor }) => {
      setError(`Player ${color} disconnected. Waiting for reconnect...`);
    });

    socket.on('player_joined', ({ color }: { color: PlayerColor }) => {
      setError(`Player ${color} joined the game!`);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('assign_role');
      socket.off('game_state');
      socket.off('move_made');
      socket.off('room_full');
      socket.off('move_error');
      socket.off('game_over');
      socket.off('player_disconnected');
      socket.off('player_joined');
      disconnectSocket();
    };
  }, [chess]);

  const handleJoinRoom = useCallback((id: string, timeControl?: TimeControl) => {
    setGameId(id);
    setError(null);
    const socket = getSocket();
    // Get stored reconnect token if any
    const token = localStorage.getItem(`chess_token_${id}`);
    socket.emit('join_room', { gameId: id, reconnectToken: token, timeControl });
    // Store token for potential reconnection
    localStorage.setItem(`chess_token_${id}`, socket.id || '');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    if (gameId) {
      localStorage.removeItem(`chess_token_${gameId}`);
    }
    disconnectSocket();
    setGameId('');
    setPlayerColor(null);
    setGameState(null);
    setIsConnected(false);
    setViewMoveIndex(-1);
    chess.reset();
  }, [gameId, chess]);

  const hasBothPlayers = !!(gameState?.players?.white && gameState?.players?.black);
  const isMyTurn = gameState?.turn === (playerColor === 'white' ? 'w' : 'b');

  // Calculate display FEN based on view position
  const displayFen = useMemo(() => {
    if (!gameState) return undefined;
    if (viewMoveIndex === -1) return gameState.fen;

    // Reconstruct position from move history up to viewMoveIndex
    const tempChess = new Chess();
    for (let i = 0; i <= viewMoveIndex && i < gameState.moveHistory.length; i++) {
      try {
        tempChess.move(gameState.moveHistory[i]);
      } catch {
        console.error('Failed to replay move:', gameState.moveHistory[i]);
      }
    }
    return tempChess.fen();
  }, [gameState, viewMoveIndex]);

  // Handle navigation
  const handleNavigate = useCallback((index: number) => {
    setViewMoveIndex(index);
  }, []);

  const gameStatus = !hasBothPlayers
    ? 'Waiting for opponent...'
    : gameState?.isGameOver
    ? `Game Over: ${gameState.gameOverReason}${gameState.winner ? ` - ${gameState.winner} wins!` : ''}`
    : isMyTurn
    ? 'Your turn'
    : "Opponent's turn";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">♟️</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Real-Time Chess
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {gameId && (
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full text-sm font-medium transition-colors"
              >
                Leave Game
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {!gameId ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <RoomManager onJoinRoom={handleJoinRoom} />
          </div>
        ) : (
          <>
            {/* Left Panel - Game Info */}
            <div className="lg:w-80 bg-white/5 border-r border-white/10 p-6">
              <GameInfo
                gameId={gameId}
                playerColor={playerColor}
                gameState={gameState}
                status={gameStatus}
                moveHistory={gameState?.moveHistory || []}
              />
            </div>

            {/* Center - Chess Board */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
              {/* Opponent Info */}
              <div className="w-full max-w-2xl mb-2 flex items-center justify-between">
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    gameState?.turn === 'b' && !gameState?.isGameOver
                      ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                      : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      playerColor === 'white' ? 'bg-black' : 'bg-white'
                    }`}
                  >
                    <span className={playerColor === 'white' ? 'text-white' : 'text-black'}>
                      ♚
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {playerColor === 'white' ? 'Black' : 'White'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {hasBothPlayers ? 'Connected' : 'Waiting...'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">Opponent</div>
              </div>

              {/* Captured Pieces - Top (pieces captured by White) */}
              <div className="w-full max-w-2xl mb-2">
                <CapturedPieces
                  capturedByWhite={gameState?.capturedPieces?.white || []}
                  capturedByBlack={gameState?.capturedPieces?.black || []}
                />
              </div>

              {/* Timer */}
              <div className="w-full max-w-2xl mb-2">
                <Timer
                  gameId={gameId}
                  whiteTimeRemaining={gameState?.whiteTimeRemaining || 0}
                  blackTimeRemaining={gameState?.blackTimeRemaining || 0}
                  isGameOver={gameState?.isGameOver || false}
                  turn={gameState?.turn || 'w'}
                  hasBothPlayers={hasBothPlayers}
                  playerColor={playerColor}
                />
              </div>

              {/* Chess Board */}
              <ChessBoard
                gameId={gameId}
                playerColor={playerColor}
                fen={displayFen}
                isMyTurn={isMyTurn && viewMoveIndex === -1}
                isGameOver={gameState?.isGameOver || false}
                inCheck={viewMoveIndex === -1 ? (gameState?.inCheck || false) : false}
                turn={viewMoveIndex === -1 ? (gameState?.turn || 'w') : (displayFen ? (displayFen.includes(' w ') ? 'w' : 'b') : 'w')}
                moveHistory={gameState?.moveHistory || []}
                viewMoveIndex={viewMoveIndex}
                onNavigate={handleNavigate}
              />

              {/* Player Info */}
              <div className="w-full max-w-2xl mt-4 flex items-center justify-between">
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    gameState?.turn === (playerColor === 'white' ? 'w' : 'b') &&
                    !gameState?.isGameOver
                      ? 'bg-green-500/20 ring-2 ring-green-500/50'
                      : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      playerColor === 'white' ? 'bg-white' : 'bg-black'
                    }`}
                  >
                    <span className={playerColor === 'white' ? 'text-black' : 'text-white'}>
                      ♚
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {playerColor === 'white' ? 'White' : 'Black'}
                    </div>
                    <div className="text-sm text-gray-400">You</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">Your turn</div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg toast backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-3 px-6 text-center text-sm text-gray-400">
        Real-Time Multiplayer Chess • Built with React, Fastify & Socket.IO
      </footer>
    </div>
  );
}

export default App;
