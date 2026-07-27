import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';

import Board from './components/Board';
import Controls from './components/Controls';
import Scoreboard from './components/Scoreboard';
import WinModal from './components/WinModal';
import { createBoard, cloneBoard } from './game/board';
import { checkWin } from './game/rules';

// ---- Difficulty → Minimax depth ----
const DIFFICULTY_DEPTH = { easy: 1, medium: 3, hard: 5 };

// ---- Create AI worker (Vite syntax) ----
function createWorker() {
  return new Worker(new URL('./ai/worker.js', import.meta.url), { type: 'classic' });
}

export default function App() {
  const [size, setSize] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [playerFirst, setPlayerFirst] = useState(true);

  // Game state
  const [board, setBoard] = useState(() => createBoard(10));
  const [history, setHistory] = useState([]); // array of {board, lastAIMove}
  const [lastAIMove, setLastAIMove] = useState(null);
  const [winLine, setWinLine] = useState(null);
  const [gameResult, setGameResult] = useState(null); // 'win' | 'lose' | 'draw' | null
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Score
  const [score, setScore] = useState({ player: 0, ai: 0, draw: 0 });

  // Worker ref to avoid recreating on each render
  const workerRef = useRef(null);

  // Current turn: true = player's turn, false = AI's turn
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // ---- Init new game ----
  const initGame = useCallback((newSize, newPlayerFirst) => {
    const s = newSize ?? size;
    const pf = newPlayerFirst ?? playerFirst;
    const fresh = createBoard(s);

    setBoard(fresh);
    setHistory([]);
    setLastAIMove(null);
    setWinLine(null);
    setGameResult(null);
    setIsAIThinking(false);

    if (!pf) {
      // AI goes first
      setIsPlayerTurn(false);
      triggerAI(fresh, s, difficulty);
    } else {
      setIsPlayerTurn(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, playerFirst, difficulty]);

  // ---- Trigger AI move via Web Worker ----
  const triggerAI = useCallback((currentBoard, currentSize, currentDifficulty) => {
    setIsAIThinking(true);

    // Kill any existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = createWorker();
    workerRef.current = worker;

    const depth = DIFFICULTY_DEPTH[currentDifficulty] ?? 3;

    worker.onmessage = (e) => {
      const { move } = e.data;
      worker.terminate();
      workerRef.current = null;

      if (!move) {
        // No moves left → draw
        setGameResult('draw');
        setScore(s => ({ ...s, draw: s.draw + 1 }));
        setIsAIThinking(false);
        setIsPlayerTurn(true);
        return;
      }

      const [ar, ac] = move;
      setBoard(prev => {
        const next = cloneBoard(prev);
        next[ar][ac] = 1;

        const aiWin = checkWin(next, ar, ac, 1);
        if (aiWin) {
          setWinLine(aiWin);
          setGameResult('lose');
          setScore(s => ({ ...s, ai: s.ai + 1 }));
        }

        return next;
      });

      setLastAIMove([ar, ac]);
      setIsAIThinking(false);
      setIsPlayerTurn(true);
    };

    worker.onerror = (err) => {
      console.error('AI Worker error:', err);
      worker.terminate();
      workerRef.current = null;
      setIsAIThinking(false);
      setIsPlayerTurn(true);
    };

    worker.postMessage({ board: currentBoard, depth });
  }, []);

  // ---- Player move ----
  const handleMove = useCallback((r, c) => {
    if (!isPlayerTurn || isAIThinking || board[r][c] !== 0 || gameResult) return;

    const newBoard = cloneBoard(board);
    newBoard[r][c] = -1;

    // Save current state for undo
    setHistory(prev => [...prev, { board, lastAIMove }]);

    const win = checkWin(newBoard, r, c, -1);
    if (win) {
      setBoard(newBoard);
      setWinLine(win);
      setGameResult('win');
      setScore(s => ({ ...s, player: s.player + 1 }));
      setIsPlayerTurn(false);
      return;
    }

    // Check draw: no empty cells left for AI
    const hasEmpty = newBoard.some(row => row.includes(0));
    if (!hasEmpty) {
      setBoard(newBoard);
      setGameResult('draw');
      setScore(s => ({ ...s, draw: s.draw + 1 }));
      setIsPlayerTurn(false);
      return;
    }

    setBoard(newBoard);
    setIsPlayerTurn(false);

    // Slight delay so React renders player's move before AI starts thinking
    setTimeout(() => triggerAI(newBoard, size, difficulty), 80);
  }, [isPlayerTurn, isAIThinking, board, gameResult, lastAIMove, size, difficulty, triggerAI]);

  // ---- Undo ----
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAIThinking) return;

    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setBoard(prev.board);
    setLastAIMove(prev.lastAIMove);
    setWinLine(null);
    setGameResult(null);
    setIsPlayerTurn(true);
    setIsAIThinking(false);

    // Kill AI if running
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [history, isAIThinking]);

  // ---- Reset / New game ----
  const handleReset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    initGame();
  }, [initGame]);

  // ---- Size change ----
  const handleSizeChange = useCallback((newSize) => {
    setSize(newSize);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const fresh = createBoard(newSize);
    setBoard(fresh);
    setHistory([]);
    setLastAIMove(null);
    setWinLine(null);
    setGameResult(null);
    setIsAIThinking(false);

    if (!playerFirst) {
      setIsPlayerTurn(false);
      triggerAI(fresh, newSize, difficulty);
    } else {
      setIsPlayerTurn(true);
    }
  }, [playerFirst, difficulty, triggerAI]);

  // ---- Difficulty change ----
  const handleDifficultyChange = useCallback((d) => {
    setDifficulty(d);
    // Reset game with new difficulty
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const fresh = createBoard(size);
    setBoard(fresh);
    setHistory([]);
    setLastAIMove(null);
    setWinLine(null);
    setGameResult(null);
    setIsAIThinking(false);
    if (!playerFirst) {
      setIsPlayerTurn(false);
      triggerAI(fresh, size, d);
    } else {
      setIsPlayerTurn(true);
    }
  }, [size, playerFirst, triggerAI]);

  // ---- First mover change ----
  const handlePlayerFirstChange = useCallback((pf) => {
    setPlayerFirst(pf);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const fresh = createBoard(size);
    setBoard(fresh);
    setHistory([]);
    setLastAIMove(null);
    setWinLine(null);
    setGameResult(null);
    setIsAIThinking(false);
    if (!pf) {
      setIsPlayerTurn(false);
      triggerAI(fresh, size, difficulty);
    } else {
      setIsPlayerTurn(true);
    }
  }, [size, difficulty, triggerAI]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  // ---- Status bar content ----
  const renderStatus = () => {
    if (gameResult) return null;
    if (isAIThinking) {
      return (
        <div className="status-bar">
          <span className="status-text status-thinking">AI đang suy nghĩ</span>
          <div className="thinking-dots" aria-hidden="true">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        </div>
      );
    }
    return (
      <div className="status-bar">
        <span className={`status-text ${isPlayerTurn ? 'status-player' : 'status-ai'}`}>
          {isPlayerTurn ? '🎯 Lượt của bạn (X)' : '⏳ Đợi AI...'}
        </span>
      </div>
    );
  };

  return (
    <main className="app">
      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Caro AI</h1>
        <p className="game-subtitle">Thách đấu trí tuệ nhân tạo</p>
      </header>

      {/* Scoreboard */}
      <Scoreboard score={score} />

      {/* Controls */}
      <Controls
        size={size}
        onSizeChange={handleSizeChange}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        playerFirst={playerFirst}
        onPlayerFirstChange={handlePlayerFirstChange}
        onReset={handleReset}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        isAIThinking={isAIThinking}
      />

      {/* Status */}
      {renderStatus()}

      {/* Board */}
      <Board
        board={board}
        onMove={handleMove}
        lastAIMove={lastAIMove}
        winLine={winLine}
        isPlayerTurn={isPlayerTurn && !isAIThinking && !gameResult}
      />

      {/* Win Modal */}
      {gameResult && (
        <WinModal
          result={gameResult}
          onRestart={handleReset}
        />
      )}
    </main>
  );
}
