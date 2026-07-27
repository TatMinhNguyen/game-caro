import Cell from './Cell';
import { calcCellSize } from '../game/boardSize';
import { useMemo } from 'react';

export default function Board({ board, onMove, lastAIMove, winLine, isPlayerTurn }) {
  const cellSize = useMemo(() => calcCellSize(board.length), [board.length]);

  return (
    <div className="board-wrapper">
      <div
        className="board-grid"
        style={{ gridTemplateColumns: `repeat(${board.length}, ${cellSize}px)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              value={cell}
              onClick={() => onMove(r, c)}
              isLastAI={lastAIMove?.[0] === r && lastAIMove?.[1] === c}
              isWinCell={winLine?.some(([wr, wc]) => wr === r && wc === c)}
              isPlayerTurn={isPlayerTurn}
              style={{ width: cellSize, height: cellSize, fontSize: Math.round(cellSize * 0.55) }}
            />
          ))
        )}
      </div>
    </div>
  );
}
