// ==========================================
// Caro AI Engine — WebAssembly (AssemblyScript)
// Minimax + Alpha-Beta Pruning + Zobrist TT + Window Pattern Evaluation
// ==========================================

const MAX_BOARD_SIZE: i32 = 30;
const MAX_CELLS: i32 = 900; // 30 * 30

let currentBoardSize: i32 = 15;
let currentTotalCells: i32 = 225;

// Board memory: 0 = Empty, 1 = AI (X/O), 2 = Human
const board: Uint8Array = new Uint8Array(MAX_CELLS);

// Direction vectors: Right, Down, Down-Right, Down-Left
const DIRS_R: StaticArray<i32> = [0, 1, 1, 1];
const DIRS_C: StaticArray<i32> = [1, 0, 1, -1];

// Zobrist Hash Keys
const zobristTable: StaticArray<u64> = new StaticArray<u64>(MAX_CELLS * 2);
let currentHash: u64 = 0;

function initZobrist(): void {
  let seed: u64 = 88172645463325252;
  for (let i = 0; i < MAX_CELLS * 2; i++) {
    seed ^= seed << 13;
    seed ^= seed >> 7;
    seed ^= seed << 17;
    zobristTable[i] = seed;
  }
}
initZobrist();

// Transposition Table
const TT_SIZE: i32 = 65536; // 2^16
const TT_MASK: u64 = <u64>(TT_SIZE - 1);
const TT_hash = new StaticArray<u64>(TT_SIZE);
const TT_depth = new Int8Array(TT_SIZE);
const TT_score = new Int32Array(TT_SIZE);
const TT_flag = new Uint8Array(TT_SIZE); // 0 = EXACT, 1 = LOWERBOUND, 2 = UPPERBOUND

function clearTT(): void {
  for (let i = 0; i < TT_SIZE; i++) {
    TT_hash[i] = 0;
    TT_depth[i] = -1;
    TT_score[i] = 0;
    TT_flag[i] = 0;
  }
}

export function setBoardSize(size: i32): void {
  if (size >= 5 && size <= MAX_BOARD_SIZE) {
    currentBoardSize = size;
    currentTotalCells = size * size;
  }
}

export function getBoardSize(): i32 {
  return currentBoardSize;
}

export function resetBoard(): void {
  for (let i = 0; i < currentTotalCells; i++) {
    board[i] = 0;
  }
  currentHash = 0;
  clearTT();
}

export function setCell(r: i32, c: i32, val: i32): void {
  if (r >= 0 && r < currentBoardSize && c >= 0 && c < currentBoardSize) {
    const idx = r * currentBoardSize + c;
    const oldVal = board[idx];
    if (oldVal !== <u8>val) {
      if (oldVal === 1) currentHash ^= zobristTable[idx * 2];
      else if (oldVal === 2) currentHash ^= zobristTable[idx * 2 + 1];

      board[idx] = <u8>val;

      if (val === 1) currentHash ^= zobristTable[idx * 2];
      else if (val === 2) currentHash ^= zobristTable[idx * 2 + 1];
    }
  }
}

export function getCell(r: i32, c: i32): i32 {
  if (r >= 0 && r < currentBoardSize && c >= 0 && c < currentBoardSize) {
    return <i32>board[r * currentBoardSize + c];
  }
  return -1;
}

function checkWinAt(r: i32, c: i32, player: u8): bool {
  for (let d = 0; d < 4; d++) {
    const dr = DIRS_R[d];
    const dc = DIRS_C[d];
    let count: i32 = 1;

    let step: i32 = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= currentBoardSize || nc < 0 || nc >= currentBoardSize) break;
      if (board[nr * currentBoardSize + nc] === player) {
        count++;
        step++;
      } else {
        break;
      }
    }

    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= currentBoardSize || nc < 0 || nc >= currentBoardSize) break;
      if (board[nr * currentBoardSize + nc] === player) {
        count++;
        step++;
      } else {
        break;
      }
    }

    if (count >= 5) return true;
  }
  return false;
}

function evalWindow(startR: i32, startC: i32, dr: i32, dc: i32): i32 {
  let countAI: i32 = 0;
  let countHuman: i32 = 0;

  for (let i = 0; i < 5; i++) {
    const r = startR + dr * i;
    const c = startC + dc * i;
    const val = board[r * currentBoardSize + c];
    if (val === 1) countAI++;
    else if (val === 2) countHuman++;
  }

  if (countAI > 0 && countHuman > 0) return 0; // Contested window

  if (countAI > 0) {
    if (countAI === 5) return 1000000;

    let openEnds: i32 = 0;
    const beforeR = startR - dr;
    const beforeC = startC - dc;
    if (beforeR >= 0 && beforeR < currentBoardSize && beforeC >= 0 && beforeC < currentBoardSize) {
      if (board[beforeR * currentBoardSize + beforeC] === 0) openEnds++;
    }
    const afterR = startR + dr * 5;
    const afterC = startC + dc * 5;
    if (afterR >= 0 && afterR < currentBoardSize && afterC >= 0 && afterC < currentBoardSize) {
      if (board[afterR * currentBoardSize + afterC] === 0) openEnds++;
    }

    if (countAI === 4) return openEnds === 2 ? 100000 : (openEnds === 1 ? 15000 : 0);
    if (countAI === 3) return openEnds === 2 ? 6000 : (openEnds === 1 ? 1200 : 0);
    if (countAI === 2) return openEnds === 2 ? 600 : (openEnds === 1 ? 100 : 0);
    return 10;
  }

  if (countHuman > 0) {
    if (countHuman === 5) return -1000000;

    let openEnds: i32 = 0;
    const beforeR = startR - dr;
    const beforeC = startC - dc;
    if (beforeR >= 0 && beforeR < currentBoardSize && beforeC >= 0 && beforeC < currentBoardSize) {
      if (board[beforeR * currentBoardSize + beforeC] === 0) openEnds++;
    }
    const afterR = startR + dr * 5;
    const afterC = startC + dc * 5;
    if (afterR >= 0 && afterR < currentBoardSize && afterC >= 0 && afterC < currentBoardSize) {
      if (board[afterR * currentBoardSize + afterC] === 0) openEnds++;
    }

    if (countHuman === 4) return openEnds === 2 ? -120000 : (openEnds === 1 ? -25000 : 0);
    if (countHuman === 3) return openEnds === 2 ? -8000 : (openEnds === 1 ? -1500 : 0);
    if (countHuman === 2) return openEnds === 2 ? -700 : (openEnds === 1 ? -120 : 0);
    return -10;
  }

  return 0;
}

export function evaluateBoard(): i32 {
  let score: i32 = 0;
  const n = currentBoardSize;

  // Horizontal windows
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(r, c, 0, 1);
    }
  }

  // Vertical windows
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c < n; c++) {
      score += evalWindow(r, c, 1, 0);
    }
  }

  // Main diagonal windows (down-right)
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(r, c, 1, 1);
    }
  }

  // Anti-diagonal windows (down-left)
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 4; c < n; c++) {
      score += evalWindow(r, c, 1, -1);
    }
  }

  return score;
}

const candidateMoves: Int32Array = new Int32Array(MAX_CELLS);
const moveScores: Int32Array = new Int32Array(MAX_CELLS);
const visited: Uint8Array = new Uint8Array(MAX_CELLS);

function getPossibleMovesCount(): i32 {
  for (let i = 0; i < currentTotalCells; i++) {
    visited[i] = 0;
  }

  let count: i32 = 0;
  let hasPieces: bool = false;
  const n = currentBoardSize;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r * n + c] !== 0) {
        hasPieces = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
              const idx = nr * n + nc;
              if (board[idx] === 0 && visited[idx] === 0) {
                visited[idx] = 1;
                candidateMoves[count] = idx;

                let densityScore: i32 = 0;
                for (let d = 0; d < 4; d++) {
                  let pCount: i32 = 0;
                  for (let k = 1; k <= 2; k++) {
                    const r1 = nr + DIRS_R[d] * k, c1 = nc + DIRS_C[d] * k;
                    const r2 = nr - DIRS_R[d] * k, c2 = nc - DIRS_C[d] * k;
                    if (r1 >= 0 && r1 < n && c1 >= 0 && c1 < n && board[r1 * n + c1] !== 0) pCount++;
                    if (r2 >= 0 && r2 < n && c2 >= 0 && c2 < n && board[r2 * n + c2] !== 0) pCount++;
                  }
                  densityScore += pCount * pCount;
                }
                moveScores[count] = densityScore;
                count++;
              }
            }
          }
        }
      }
    }
  }

  if (!hasPieces) {
    const mid = n / 2;
    candidateMoves[0] = mid * n + mid;
    return 1;
  }

  // Insertion sort candidate moves by density score descending
  for (let i = 1; i < count; i++) {
    const keyMove = candidateMoves[i];
    const keyScore = moveScores[i];
    let j = i - 1;
    while (j >= 0 && moveScores[j] < keyScore) {
      candidateMoves[j + 1] = candidateMoves[j];
      moveScores[j + 1] = moveScores[j];
      j--;
    }
    candidateMoves[j + 1] = keyMove;
    moveScores[j + 1] = keyScore;
  }

  return count;
}

function minimax(depth: i32, alpha: i32, beta: i32, isMax: bool): i32 {
  if (depth === 0) return evaluateBoard();

  // TT Lookup
  const ttIndex = <i32>(currentHash & TT_MASK);
  if (TT_hash[ttIndex] === currentHash && TT_depth[ttIndex] >= <i8>depth) {
    const flag = TT_flag[ttIndex];
    const score = TT_score[ttIndex];
    if (flag === 0) return score; // EXACT
    if (flag === 1 && score > alpha) alpha = score; // LOWERBOUND
    else if (flag === 2 && score < beta) beta = score; // UPPERBOUND
    if (beta <= alpha) return score;
  }

  const origAlpha = alpha;
  const movesCount = getPossibleMovesCount();
  const localMoves = new Int32Array(movesCount);
  for (let i = 0; i < movesCount; i++) {
    localMoves[i] = candidateMoves[i];
  }

  const n = currentBoardSize;
  let bestEval: i32;

  if (isMax) {
    bestEval = -2000000000;
    for (let i = 0; i < movesCount; i++) {
      const idx = localMoves[i];
      const r = idx / n;
      const c = idx % n;

      setCell(r, c, 1);
      let evalScore: i32;
      if (checkWinAt(r, c, 1)) {
        evalScore = 1000000 + depth * 100;
      } else {
        evalScore = minimax(depth - 1, alpha, beta, false);
      }
      setCell(r, c, 0);

      if (evalScore > bestEval) bestEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
  } else {
    bestEval = 2000000000;
    for (let i = 0; i < movesCount; i++) {
      const idx = localMoves[i];
      const r = idx / n;
      const c = idx % n;

      setCell(r, c, 2);
      let evalScore: i32;
      if (checkWinAt(r, c, 2)) {
        evalScore = -1000000 - depth * 100;
      } else {
        evalScore = minimax(depth - 1, alpha, beta, true);
      }
      setCell(r, c, 0);

      if (evalScore < bestEval) bestEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
  }

  // TT Store
  TT_hash[ttIndex] = currentHash;
  TT_depth[ttIndex] = <i8>depth;
  TT_score[ttIndex] = bestEval;
  if (bestEval <= origAlpha) TT_flag[ttIndex] = 2; // UPPERBOUND
  else if (bestEval >= beta) TT_flag[ttIndex] = 1; // LOWERBOUND
  else TT_flag[ttIndex] = 0; // EXACT

  return bestEval;
}

function findImmediateMove(player: u8): i32 {
  const movesCount = getPossibleMovesCount();
  const n = currentBoardSize;
  for (let i = 0; i < movesCount; i++) {
    const idx = candidateMoves[i];
    const r = idx / n;
    const c = idx % n;
    setCell(r, c, player);
    const isWin = checkWinAt(r, c, player);
    setCell(r, c, 0);
    if (isWin) return idx;
  }
  return -1;
}

export function findBestMove(depth: i32): i32 {
  // 1. AI wins immediately?
  let move = findImmediateMove(1);
  if (move !== -1) return move;

  // 2. Block human win immediately?
  move = findImmediateMove(2);
  if (move !== -1) return move;

  const movesCount = getPossibleMovesCount();
  const localMoves = new Int32Array(movesCount);
  for (let i = 0; i < movesCount; i++) {
    localMoves[i] = candidateMoves[i];
  }

  let bestScore: i32 = -2000000000;
  let bestMove: i32 = localMoves[0];
  let alpha: i32 = -2000000000;
  let beta: i32 = 2000000000;
  const n = currentBoardSize;

  for (let i = 0; i < movesCount; i++) {
    const idx = localMoves[i];
    const r = idx / n;
    const c = idx % n;

    setCell(r, c, 1);
    const score = minimax(depth - 1, alpha, beta, false);
    setCell(r, c, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
    if (score > alpha) alpha = score;
  }

  return bestMove;
}
