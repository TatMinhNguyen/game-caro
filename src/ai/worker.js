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

// ---- Evaluate ----
const SCORE_TABLE = {
  '5': 1000000,
  '4_2': 100000,
  '4_1': 10000,
  '3_2': 5000,
  '3_1': 1000,
  '2_2': 500,
};

function countLine(board, r, c, dx, dy, player) {
  let count = 1, openEnds = 0;
  let i = 1;
  while (board[r + dx * i]?.[c + dy * i] === player) { count++; i++; }
  if (board[r + dx * i]?.[c + dy * i] === 0) openEnds++;
  i = 1;
  while (board[r - dx * i]?.[c - dy * i] === player) { count++; i++; }
  if (board[r - dx * i]?.[c - dy * i] === 0) openEnds++;
  return { count, openEnds };
}

function evaluatePoint(board, r, c, player) {
  let total = 0;
  for (const [dx, dy] of DIRS) {
    const { count, openEnds } = countLine(board, r, c, dx, dy, player);
    if (count >= 2) {
      const key = count >= 5 ? '5' : `${Math.min(count, 4)}_${openEnds}`;
      const val = SCORE_TABLE[key] || 0;
      total += player === 1 ? val : -val;
    }
  }
  return total;
}

function evaluate(board) {
  let score = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r][c] !== 0) {
        score += evaluatePoint(board, r, c, board[r][c]);
      }
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
  const r = Math.floor(encodedMove / 15);
  const c = encodedMove % 15;
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

