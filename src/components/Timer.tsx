import { useState, useEffect } from 'react';
import { getSocket } from '../socket';

interface TimerProps {
  gameId: string;
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  isGameOver: boolean;
  turn: 'w' | 'b';
  hasBothPlayers: boolean;
  playerColor: 'white' | 'black' | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function Timer({
  gameId,
  whiteTimeRemaining,
  blackTimeRemaining,
  isGameOver,
  turn,
  hasBothPlayers,
  playerColor,
}: TimerProps) {
  const [displayWhiteTime, setDisplayWhiteTime] = useState(whiteTimeRemaining);
  const [displayBlackTime, setDisplayBlackTime] = useState(blackTimeRemaining);

  // Sync with props when they change
  useEffect(() => {
    setDisplayWhiteTime(whiteTimeRemaining);
    setDisplayBlackTime(blackTimeRemaining);
  }, [whiteTimeRemaining, blackTimeRemaining]);

  // Countdown timer effect
  useEffect(() => {
    if (isGameOver || !hasBothPlayers) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setDisplayWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setDisplayBlackTime((prev) => Math.max(0, prev - 1));
      }

      // Check for timeout every 5 seconds
      const socket = getSocket();
      socket.emit('check_timeout', { gameId });
    }, 1000);

    return () => clearInterval(interval);
  }, [turn, isGameOver, hasBothPlayers, gameId]);

  // Request time updates periodically
  useEffect(() => {
    if (isGameOver || !hasBothPlayers) return;

    const socket = getSocket();

    const handleTimeUpdate = (data: { whiteTime: number; blackTime: number }) => {
      setDisplayWhiteTime(data.whiteTime);
      setDisplayBlackTime(data.blackTime);
    };

    socket.on('time_update', handleTimeUpdate);

    // Request time update every 5 seconds for sync
    const syncInterval = setInterval(() => {
      socket.emit('get_time', { gameId });
    }, 5000);

    return () => {
      socket.off('time_update', handleTimeUpdate);
      clearInterval(syncInterval);
    };
  }, [gameId, isGameOver, hasBothPlayers]);

  const isWhiteLow = displayWhiteTime < 60;
  const isBlackLow = displayBlackTime < 60;
  const isWhiteTurn = turn === 'w';
  const isBlackTurn = turn === 'b';

  return (
    <div className="flex justify-center gap-4 mb-4">
      {/* Black Timer */}
      <div
        className={`px-4 py-2 rounded-lg font-mono text-xl font-bold flex items-center gap-2 ${
          isBlackTurn && !isGameOver
            ? 'bg-gray-800 text-white ring-2 ring-yellow-400'
            : 'bg-gray-700 text-gray-300'
        } ${isBlackLow && !isGameOver ? 'text-red-400 animate-pulse' : ''}`}
      >
        <span className="text-2xl">♚</span>
        <span>{formatTime(displayBlackTime)}</span>
        {playerColor === 'black' && (
          <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded">
            You
          </span>
        )}
      </div>

      {/* White Timer */}
      <div
        className={`px-4 py-2 rounded-lg font-mono text-xl font-bold flex items-center gap-2 ${
          isWhiteTurn && !isGameOver
            ? 'bg-white text-black ring-2 ring-yellow-400'
            : 'bg-gray-200 text-gray-700'
        } ${isWhiteLow && !isGameOver ? 'text-red-600 animate-pulse' : ''}`}
      >
        <span className="text-2xl">♔</span>
        <span>{formatTime(displayWhiteTime)}</span>
        {playerColor === 'white' && (
          <span className="text-xs bg-green-500/30 text-green-600 px-2 py-0.5 rounded">
            You
          </span>
        )}
      </div>
    </div>
  );
}
