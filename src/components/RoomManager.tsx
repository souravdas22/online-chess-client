import { useState, useCallback } from 'react';

interface RoomManagerProps {
  onJoinRoom: (gameId: string) => void;
}

export default function RoomManager({ onJoinRoom }: RoomManagerProps) {
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(true);

  const generateGameId = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameId(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      onJoinRoom(gameId.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">♟️</div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Chess</h2>
        <p className="text-gray-400">
          Play real-time chess with friends online
        </p>
      </div>

      {/* Toggle */}
      <div className="flex bg-white/5 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => { setIsCreating(true); generateGameId(); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            isCreating
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Create Game
        </button>
        <button
          type="button"
          onClick={() => { setIsCreating(false); setGameId(''); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            !isCreating
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Join Game
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Game ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              placeholder="Enter game ID..."
              maxLength={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wider"
            />
            {isCreating && (
              <button
                type="button"
                onClick={generateGameId}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors"
              >
                Regenerate
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isCreating
              ? 'Share this ID with your friend to play together'
              : 'Ask your friend for the game ID'}
          </p>
        </div>

        <button
          type="submit"
          disabled={!gameId.trim()}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isCreating ? 'Create Game' : 'Join Game'}
        </button>
      </form>

      {/* Instructions */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-gray-400 mb-3">How to play:</h3>
        <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
          <li>Create a new game or join an existing one</li>
          <li>Share the game ID with your opponent</li>
          <li>Play real-time chess with drag and drop</li>
          <li>First player gets White, second gets Black</li>
        </ol>
      </div>
    </div>
  );
}
