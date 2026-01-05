import { useState } from "react";
import Board from "./components/Board";
import { createBoard, cloneBoard } from "./game/board";
import { checkWin } from "./game/rules";
import { findBestMove } from "./ai/minimax";

export default function App() {
  const [gameOver, setGameOver] = useState(false);
  const [size, setSize] = useState(10);
  const [board, setBoard] = useState(() => createBoard(10));
  const [lastAIMove, setLastAIMove] = useState(null);
  const [winLine, setWinLine] = useState(null);

  const handleMove = (r, c) => {
    if (board[r][c] !== 0 || gameOver) return;

    const newBoard = cloneBoard(board);
    newBoard[r][c] = -1;

    const win = checkWin(newBoard, r, c, -1);
    if (win) {
      alert("Bạn thắng 🎉");
      setWinLine(win);
      setGameOver(true);
      setBoard(newBoard);
      return;
    }

    const aiMove = findBestMove(newBoard, 3);
    if (aiMove) {
      const [ar, ac] = aiMove;
      newBoard[ar][ac] = 1;
      setLastAIMove([ar, ac]);

      const aiWin = checkWin(newBoard, ar, ac, 1);
      if (aiWin) {
        alert("AI thắng 🤖");
        setGameOver(true);
        setBoard(newBoard);
        setWinLine(aiWin);
        return;
      }
    }

    setBoard(newBoard);
  };

  const handleChangeSize = (e) => {
    const newSize = Number(e.target.value);
    setSize(newSize);
    setBoard(createBoard(newSize));
    setGameOver(false);
    setLastAIMove(null);
    setWinLine(null);

  };

  const resetGame = () => {
    setBoard(createBoard(size));
    setGameOver(false);
    setLastAIMove(null);
    setWinLine(null);

  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: 0 }}>Caro AI</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Bàn cờ: </label>
        <select value={size} onChange={handleChangeSize}>
          <option value={10}>10 x 10</option>
          <option value={13}>13 x 13</option>
          <option value={15}>15 x 15</option>
        </select>

        <button onClick={resetGame} style={{ marginLeft: 10 }}>
          Reset
        </button>
      </div>

      <Board board={board} onMove={handleMove} lastAIMove={lastAIMove} winLine={winLine} />
    </div>
  );
}
