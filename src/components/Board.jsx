import Cell from "./Cell";

export default function Board({ board, onMove, lastAIMove, winLine }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${board.length}, 40px)`,
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <Cell
            key={`${r}-${c}`}
            value={cell}
            onClick={() => onMove(r, c)}
            isLastAI={lastAIMove?.[0] === r && lastAIMove?.[1] === c}
            isWinCell={winLine?.some(([wr, wc]) => wr === r && wc === c)}
          />
        ))
      )}
    </div>
  );
}
