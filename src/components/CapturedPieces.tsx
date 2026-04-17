interface CapturedPiecesProps {
  capturedByWhite: string[]; // black pieces captured by white
  capturedByBlack: string[]; // white pieces captured by black
}

const PIECE_SYMBOLS: { [key: string]: { white: string; black: string } } = {
  p: { white: '♙', black: '♟' },
  n: { white: '♘', black: '♞' },
  b: { white: '♗', black: '♝' },
  r: { white: '♖', black: '♜' },
  q: { white: '♕', black: '♛' },
  k: { white: '♔', black: '♚' },
};

const PIECE_VALUES: { [key: string]: number } = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function calculateScore(pieces: string[]): number {
  return pieces.reduce((sum, piece) => sum + (PIECE_VALUES[piece] || 0), 0);
}

function groupPieces(pieces: string[]): { [key: string]: number } {
  const grouped: { [key: string]: number } = {};
  pieces.forEach((piece) => {
    grouped[piece] = (grouped[piece] || 0) + 1;
  });
  return grouped;
}

export default function CapturedPieces({
  capturedByWhite,
  capturedByBlack,
}: CapturedPiecesProps) {
  const whiteScore = calculateScore(capturedByWhite);
  const blackScore = calculateScore(capturedByBlack);
  const scoreDiff = whiteScore - blackScore;

  const whiteGrouped = groupPieces(capturedByWhite);
  const blackGrouped = groupPieces(capturedByBlack);

  // Sort by piece value descending
  const sortPieces = (a: string, b: string) =>
    (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Black's captured pieces (captured by White) - shown at top */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg min-h-[40px]">
        <div className="flex flex-wrap gap-1 flex-1">
          {Object.entries(whiteGrouped)
            .sort(([a], [b]) => sortPieces(a, b))
            .map(([piece, count]) => (
              <span key={piece} className="text-lg leading-none">
                {PIECE_SYMBOLS[piece]?.black}
                {count > 1 && (
                  <span className="text-xs text-gray-400 ml-0.5">×{count}</span>
                )}
              </span>
            ))}
          {capturedByWhite.length === 0 && (
            <span className="text-gray-600 text-sm italic">No pieces captured</span>
          )}
        </div>
        {scoreDiff > 0 && (
          <span className="text-green-400 text-sm font-bold">+{scoreDiff}</span>
        )}
      </div>

      {/* White's captured pieces (captured by Black) - shown at bottom */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg min-h-[40px]">
        <div className="flex flex-wrap gap-1 flex-1">
          {Object.entries(blackGrouped)
            .sort(([a], [b]) => sortPieces(a, b))
            .map(([piece, count]) => (
              <span key={piece} className="text-lg leading-none">
                {PIECE_SYMBOLS[piece]?.white}
                {count > 1 && (
                  <span className="text-xs text-gray-400 ml-0.5">×{count}</span>
                )}
              </span>
            ))}
          {capturedByBlack.length === 0 && (
            <span className="text-gray-500 text-sm italic">No pieces captured</span>
          )}
        </div>
        {scoreDiff < 0 && (
          <span className="text-green-400 text-sm font-bold">+{-scoreDiff}</span>
        )}
      </div>
    </div>
  );
}
