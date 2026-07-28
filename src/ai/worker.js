// =========================================
// AI Web Worker — Caro AI
// Chạy tính toán Minimax ở background thread
// =========================================

// ---- Game Rules (inlined) ----
const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

function checkWin(board, r, c, player) {
  for (const [dx, dy] of DIRS) {
    const line = [[r, c]];
    let i = 1;
    while (board[r + dx * i]?.[c + dy * i] === player) {
      line.push([r + dx * i, c + dy * i]);
      i++;
    }
    i = 1;
    while (board[r - dx * i]?.[c - dy * i] === player) {
      line.unshift([r - dx * i, c - dy * i]);
      i++;
    }
    if (line.length >= 5) return line.slice(0, 5);
  }
  return null;
}

// ---- Move Generator ----
function getPossibleMoves(board, radius = 2, minNeighbors = 2) {
  const moves = new Map();
  const n = board.length;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || board[nr][nc] !== 0) continue;

            const key = `${nr},${nc}`;
            if (!moves.has(key)) {
              let score = 0;
              for (const [dx, dy] of DIRS) {
                let count = 0;
                for (let k = 1; k <= 2; k++) {
                  const r1 = nr + dx * k, c1 = nc + dy * k;
                  const r2 = nr - dx * k, c2 = nc - dy * k;
                  if (r1 >= 0 && r1 < n && c1 >= 0 && c1 < n && board[r1][c1] !== 0) count++;
                  if (r2 >= 0 && r2 < n && c2 >= 0 && c2 < n && board[r2][c2] !== 0) count++;
                }
                score += count * count;
              }
              moves.set(key, score);
            }
          }
        }
      }
    }
  }

  if (moves.size === 0) {
    const mid = Math.floor(n / 2);
    return [[mid, mid]];
  }

  const sorted = [...moves.entries()].sort((a, b) => b[1] - a[1]);
  const filtered = sorted.filter(([, s]) => s >= minNeighbors);
  return (filtered.length > 0 ? filtered : sorted).map(([key]) => key.split(',').map(Number));
}

function getRawMoves(board, radius = 1) {
  const moves = new Set();
  const n = board.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === 0) {
              moves.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }
  if (moves.size === 0) {
    const mid = Math.floor(n / 2);
    return [[mid, mid]];
  }
  return [...moves].map(m => m.split(',').map(Number));
}

// ---- Sliding Window Evaluator ----
function evalWindow(board, startR, startC, dr, dc, n) {
  let countAI = 0;
  let countHuman = 0;

  for (let i = 0; i < 5; i++) {
    const r = startR + dr * i;
    const c = startC + dc * i;
    const val = board[r][c];
    if (val === 1) countAI++;
    else if (val === -1) countHuman++;
  }

  if (countAI > 0 && countHuman > 0) return 0;

  if (countAI > 0) {
    if (countAI === 5) return 1000000;

    let openEnds = 0;
    const beforeR = startR - dr, beforeC = startC - dc;
    if (beforeR >= 0 && beforeR < n && beforeC >= 0 && beforeC < n && board[beforeR][beforeC] === 0) openEnds++;
    const afterR = startR + dr * 5, afterC = startC + dc * 5;
    if (afterR >= 0 && afterR < n && afterC >= 0 && afterC < n && board[afterR][afterC] === 0) openEnds++;

    if (countAI === 4) return openEnds === 2 ? 100000 : (openEnds === 1 ? 15000 : 0);
    if (countAI === 3) return openEnds === 2 ? 6000 : (openEnds === 1 ? 1200 : 0);
    if (countAI === 2) return openEnds === 2 ? 600 : (openEnds === 1 ? 100 : 0);
    return 10;
  }

  if (countHuman > 0) {
    if (countHuman === 5) return -1000000;

    let openEnds = 0;
    const beforeR = startR - dr, beforeC = startC - dc;
    if (beforeR >= 0 && beforeR < n && beforeC >= 0 && beforeC < n && board[beforeR][beforeC] === 0) openEnds++;
    const afterR = startR + dr * 5, afterC = startC + dc * 5;
    if (afterR >= 0 && afterR < n && afterC >= 0 && afterC < n && board[afterR][afterC] === 0) openEnds++;

    if (countHuman === 4) return openEnds === 2 ? -120000 : (openEnds === 1 ? -25000 : 0);
    if (countHuman === 3) return openEnds === 2 ? -8000 : (openEnds === 1 ? -1500 : 0);
    if (countHuman === 2) return openEnds === 2 ? -700 : (openEnds === 1 ? -120 : 0);
    return -10;
  }

  return 0;
}

function evaluate(board) {
  let score = 0;
  const n = board.length;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(board, r, c, 0, 1, n);
    }
  }
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c < n; c++) {
      score += evalWindow(board, r, c, 1, 0, n);
    }
  }
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(board, r, c, 1, 1, n);
    }
  }
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 4; c < n; c++) {
      score += evalWindow(board, r, c, 1, -1, n);
    }
  }

  return score;
}

// ---- Minimax ----
function minimax(board, depth, alpha, beta, isMax) {
  if (depth === 0) return evaluate(board);

  const moves = getPossibleMoves(board);

  if (isMax) {
    let best = -Infinity;
    for (const [r, c] of moves) {
      board[r][c] = 1;
      const win = checkWin(board, r, c, 1);
      const score = win ? 1000000 + depth * 100 : minimax(board, depth - 1, alpha, beta, false);
      board[r][c] = 0;
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [r, c] of moves) {
      board[r][c] = -1;
      const win = checkWin(board, r, c, -1);
      const score = win ? -1000000 - depth * 100 : minimax(board, depth - 1, alpha, beta, true);
      board[r][c] = 0;
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function findImmediateMove(board, player) {
  for (const [r, c] of getRawMoves(board, 1)) {
    board[r][c] = player;
    if (checkWin(board, r, c, player)) {
      board[r][c] = 0;
      return [r, c];
    }
    board[r][c] = 0;
  }
  return null;
}

function countThreats(board, r, c, player) {
  let threats = 0;
  board[r][c] = player;
  for (const [nr, nc] of getRawMoves(board, 1)) {
    board[nr][nc] = player;
    if (checkWin(board, nr, nc, player)) threats++;
    board[nr][nc] = 0;
  }
  board[r][c] = 0;
  return threats;
}

function findDoubleThreat(board, player) {
  for (const [r, c] of getPossibleMoves(board)) {
    if (board[r][c] !== 0) continue;
    if (countThreats(board, r, c, player) >= 2) return [r, c];
  }
  return null;
}

function findBestMove(board, depth) {
  // 1. AI thắng ngay?
  let move = findImmediateMove(board, 1);
  if (move) return move;

  // 2. Chặn người chơi thắng ngay?
  move = findImmediateMove(board, -1);
  if (move) return move;

  // 3. AI tạo double threat?
  move = findDoubleThreat(board, 1);
  if (move) return move;

  // 4. Chặn double threat của người chơi?
  move = findDoubleThreat(board, -1);
  if (move) return move;

  // 5. Minimax fallback
  let bestScore = -Infinity;
  let bestMove = null;

  for (const [r, c] of getPossibleMoves(board)) {
    board[r][c] = 1;
    const score = minimax(board, depth - 1, -Infinity, Infinity, false);
    board[r][c] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

// ---- WebAssembly AI Engine Integration ----
let wasmInstance = null;
let wasmInitPromise = null;

async function initWasm() {
  if (wasmInstance) return wasmInstance;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      const response = await fetch('/caro_engine.wasm');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const bytes = await response.arrayBuffer();
      const results = await WebAssembly.instantiate(bytes, {
        env: {
          abort: (msg, file, line, col) => {
            console.error(`WASM Abort: ${msg} at ${file}:${line}:${col}`);
          }
        }
      });
      wasmInstance = results.instance.exports;
      console.log('⚡ WebAssembly AI Engine loaded successfully!');
      return wasmInstance;
    } catch (err) {
      console.warn('WASM load failed, falling back to JS Minimax:', err);
      wasmInstance = null;
      return null;
    }
  })();

  return wasmInitPromise;
}

// Start loading WASM eagerly when worker starts
initWasm();

function findBestMoveWasm(wasm, board, depth) {
  const n = board.length;
  if (wasm.setBoardSize) {
    wasm.setBoardSize(n);
  }
  wasm.resetBoard();

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const val = board[r][c];
      const wasmVal = val === 1 ? 1 : val === -1 ? 2 : 0;
      if (wasmVal !== 0) {
        wasm.setCell(r, c, wasmVal);
      }
    }
  }

  const encodedMove = wasm.findBestMove(depth);
  if (encodedMove < 0) return null;
  const r = Math.floor(encodedMove / n);
  const c = encodedMove % n;
  return [r, c];
}

// ---- Worker Message Handler ----
self.onmessage = async function (e) {
  const { board, depth } = e.data;
  const boardClone = board.map(row => [...row]);

  let move = null;
  let usedWasm = false;

  const wasm = await initWasm();
  if (wasm) {
    try {
      move = findBestMoveWasm(wasm, boardClone, depth);
      usedWasm = true;
    } catch (err) {
      console.warn('WASM execution failed, using JS fallback:', err);
    }
  }

  if (!move) {
    move = findBestMove(boardClone, depth);
    usedWasm = false;
  }

  self.postMessage({ move, isWasm: usedWasm });
};
