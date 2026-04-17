import { GameState, PlayerColor } from '../types';

interface GameInfoProps {
  gameId: string;
  playerColor: PlayerColor | null;
  gameState: GameState | null;
  status: string;
  moveHistory: string[];
}

export default function GameInfo({
  gameId,
  playerColor,
  gameState,
  status,
  moveHistory,
}: GameInfoProps) {
  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
  };

  const groupMoves = () => {
    const groups: string[][] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      groups.push([moveHistory[i], moveHistory[i + 1] || '']);
    }
    return groups;
  };

  return (
   <> <div className="h-full flex flex-col gap-6">
      {/* Game ID */}
      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Game ID
        </label>
        <div className="flex items-center gap-2 mt-1">
          <code className="flex-1 text-xl font-bold text-white tracking-wider">
            {gameId}
          </code>
          <button
            onClick={copyGameId}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sm rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            📋
          </button>
        </div>
      </div>

      {/* Time Control */}
      {gameState?.timeControl && (
        <div className="bg-white/5 rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            Time Control
          </label>
          <div className="mt-1 text-lg font-semibold text-white">
            {gameState.timeControl.name}
          </div>
        </div>
      )}

      {/* Status */}
      <div
        className={`rounded-xl p-4 ${
          gameState?.isGameOver
            ? 'bg-red-500/10 border border-red-500/30'
            : gameState?.turn === (playerColor === 'white' ? 'w' : 'b')
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-blue-500/10 border border-blue-500/30'
        }`}
      >
        <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Status
        </label>
        <div
          className={`text-lg font-semibold mt-1 ${
            gameState?.isGameOver
              ? 'text-red-400'
              : gameState?.turn === (playerColor === 'white' ? 'w' : 'b')
              ? 'text-green-400'
              : 'text-blue-400'
          }`}
        >
          {status}
        </div>
      </div>

      {/* Players */}
      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Players
        </label>
        <div className="mt-3 space-y-2">
          <div
            className={`flex items-center gap-3 p-2 rounded-lg ${
              gameState?.players?.white
                ? 'bg-white/10'
                : 'bg-white/5 opacity-50'
            } ${
              playerColor === 'white'
                ? 'ring-1 ring-green-500/50'
                : ''
            }`}
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
              ♚
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">White</div>
              <div className="text-xs text-gray-500">
                {gameState?.players?.white
                  ? playerColor === 'white'
                    ? 'You'
                    : 'Opponent'
                  : 'Waiting...'}
              </div>
            </div>
            {gameState?.turn === 'w' && !gameState?.isGameOver && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>

          <div
            className={`flex items-center gap-3 p-2 rounded-lg ${
              gameState?.players?.black
                ? 'bg-white/10'
                : 'bg-white/5 opacity-50'
            } ${
              playerColor === 'black'
                ? 'ring-1 ring-green-500/50'
                : ''
            }`}
          >
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
              ♚
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Black</div>
              <div className="text-xs text-gray-500">
                {gameState?.players?.black
                  ? playerColor === 'black'
                    ? 'You'
                    : 'Opponent'
                  : 'Waiting...'}
              </div>
            </div>
            {gameState?.turn === 'b' && !gameState?.isGameOver && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Move History */}
      <div className="flex-1 bg-white/5 rounded-xl p-4 flex flex-col min-h-0">
        <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
          Move History
        </label>
        <div className="flex-1 overflow-y-auto font-mono text-sm">
          {moveHistory.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No moves yet
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {groupMoves().map((movePair, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-1.5 pr-2 text-gray-500 w-8">
                      {index + 1}.
                    </td>
                    <td className="py-1.5 pr-2 text-white">
                      {movePair[0]}
                    </td>
                    <td className="py-1.5 text-gray-400">
                      {movePair[1] || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div></>
  );
}
