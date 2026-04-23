import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { getSocket } from '../socket';
import { PlayerColor } from '../types';

interface ChessBoardProps {
  gameId: string;
  playerColor: PlayerColor | null;
  fen: string | undefined;
  isMyTurn: boolean;
  isGameOver: boolean;
  inCheck: boolean;
  turn: 'w' | 'b';
  moveHistory: string[];
  viewMoveIndex: number; // -1 means current position, 0+ means viewing that move index
  onNavigate: (index: number) => void; // -1 for current, 0+ for move index
}

export default function ChessBoard({
  gameId,
  playerColor,
  fen,
  isMyTurn,
  isGameOver,
  inCheck,
  turn,
  moveHistory,
  viewMoveIndex,
  onNavigate,
}: ChessBoardProps) {
  const [chess] = useState(() => new Chess());
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Update chess instance when FEN changes
  useEffect(() => {
    if (fen) {
      try {
        chess.load(fen);
      } catch {
        console.error('Failed to load FEN:', fen);
      }
    }
  }, [fen, chess]);

  // Listen for move_made to track last move
  useEffect(() => {
    const socket = getSocket();
    socket.on('move_made', (move: { from: string; to: string }) => {
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setValidMoves([]);
    });

    return () => {
      socket.off('move_made');
    };
  }, []);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (!isMyTurn || isGameOver || !playerColor) {
        return false;
      }

      const piece = chess.get(sourceSquare as Square);
      if (!piece || piece.color !== (playerColor === 'white' ? 'w' : 'b')) {
        return false;
      }

      // Try the move locally first
      try {
        const moveResult = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (moveResult) {
          // Send move to server
          const socket = getSocket();
          socket.emit('make_move', {
            gameId,
            move: { from: sourceSquare, to: targetSquare, promotion: 'q' },
          });
          return true;
        }
      } catch {
        return false;
      }

      return false;
    },
    [chess, gameId, isMyTurn, isGameOver, playerColor]
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (!isMyTurn || isGameOver || !playerColor) return;

      const piece = chess.get(square as Square);

      // If clicking on own piece, show valid moves
      if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        setValidMoves(moves.map((m: { to: string }) => m.to));
      } else if (selectedSquare && validMoves.includes(square)) {
        // Make the move
        try {
          const moveResult = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q',
          });

          if (moveResult) {
            const socket = getSocket();
            socket.emit('make_move', {
              gameId,
              move: { from: selectedSquare, to: square, promotion: 'q' },
            });
            setLastMove({ from: selectedSquare, to: square });
          }
        } catch {
          // Invalid move
        }
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [chess, gameId, isMyTurn, isGameOver, playerColor, selectedSquare, validMoves]
  );

  // Build custom square styles
  const getSquareStyles = useCallback(() => {
    const styles: { [key: string]: { background?: string; backgroundColor?: string; borderRadius?: string } } = {};

    // Highlight valid moves
    validMoves.forEach((square) => {
      styles[square] = {
        background:
          chess.get(square as Square)
            ? 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(255,0,0,0.4) 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%)',
        borderRadius: '50%',
      };
    });

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(20, 85, 30, 0.5)',
      };
    }

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: 'rgba(155, 199, 0, 0.41)',
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: 'rgba(155, 199, 0, 0.41)',
      };
    }

    // Check indicator - use server-provided inCheck and turn
    if (inCheck) {
      // Find the king of the side whose turn it is (the one in check)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = chess.board()[row][col];
          if (piece?.type === 'k' && piece.color === turn) {
            const square = String.fromCharCode(97 + col) + (8 - row);
            styles[square] = {
              ...styles[square],
              background:
                'radial-gradient(ellipse at center, rgb(255, 0, 0) 0%, rgb(231, 0, 0) 25%, rgba(169, 0, 0, 0) 89%, rgba(158, 0, 0, 0) 100%)',
            };
          }
        }
      }
    }

    return styles;
  }, [validMoves, selectedSquare, lastMove, chess, inCheck, turn]);

  return (
    <div className="w-full max-w-2xl aspect-square">
      <div className="relative bg-slate-800 rounded-xl p-4 shadow-2xl border border-slate-700">
        {/* Status indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isMyTurn && !isGameOver
                ? 'bg-green-500 w-full animate-pulse'
                : isGameOver
                ? 'bg-red-500 w-full'
                : 'bg-blue-500 w-1/2'
            }`}
          />
        </div>

        {/* Board wrapper with correct orientation */}
        <div className="pt-2">
          <Chessboard
            position={fen || 'start'}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            boardOrientation={playerColor === 'black' ? 'black' : 'white'}
            boardWidth={600}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#769656' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            customSquareStyles={getSquareStyles()}
            showBoardNotation={true}
            isDraggablePiece={({ piece }) => {
              if (!isMyTurn || isGameOver || !playerColor) return false;
              const pieceColor = piece[0];
              return pieceColor === (playerColor === 'white' ? 'w' : 'b');
            }}
            dropOffBoardAction="snapback"
            animationDuration={200}
          />
        </div>

        {/* Turn indicator and Move Navigation */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              viewMoveIndex !== -1
                ? 'bg-yellow-500/20 text-yellow-400'
                : isMyTurn && !isGameOver
                ? 'bg-green-500/20 text-green-400'
                : isGameOver
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                viewMoveIndex !== -1
                  ? 'bg-yellow-400'
                  : isMyTurn && !isGameOver
                  ? 'bg-green-400 animate-pulse'
                  : isGameOver
                  ? 'bg-red-400'
                  : 'bg-blue-400'
              }`}
            />
            {viewMoveIndex !== -1
              ? `Viewing move ${viewMoveIndex + 1} of ${moveHistory.length}`
              : isGameOver
              ? 'Game Over'
              : isMyTurn
              ? 'Your turn to move'
              : "Waiting for opponent's move"}
          </div>

          {/* Move Navigation Controls */}
          {moveHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate(0)}
                disabled={viewMoveIndex === 0}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                title="First move"
              >
                |◀
              </button>
              <button
                onClick={() => onNavigate(viewMoveIndex === -1 ? moveHistory.length - 2 : Math.max(0, viewMoveIndex - 1))}
                disabled={viewMoveIndex === 0 || (viewMoveIndex === -1 && moveHistory.length === 0)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                title="Previous move"
              >
                ◀
              </button>
              <button
                onClick={() => onNavigate(-1)}
                disabled={viewMoveIndex === -1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                title="Current position"
              >
                Current
              </button>
              <button
                onClick={() => onNavigate(viewMoveIndex === -1 ? moveHistory.length - 1 : Math.min(moveHistory.length - 1, viewMoveIndex + 1))}
                disabled={viewMoveIndex === -1 || viewMoveIndex >= moveHistory.length - 1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                title="Next move"
              >
                ▶
              </button>
              <button
                onClick={() => onNavigate(-1)}
                disabled={viewMoveIndex === -1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                title="Last move / Current"
              >
                ▶|
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
