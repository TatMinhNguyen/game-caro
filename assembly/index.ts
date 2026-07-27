// ==========================================
// Caro AI Engine — WebAssembly (AssemblyScript)
// Minimax + Alpha-Beta Pruning + Threat Evaluation
// ==========================================

const BOARD_SIZE: i32 = 15;
const TOTAL_CELLS: i32 = 225; // 15 * 15

// Board memory: 0 = Empty, 1 = AI (X/O), 2 = Human
const board: Uint8Array = new Uint8Array(TOTAL_CELLS);

// Direction vectors: Right, Down, Down-Right, Down-Left
const DIRS_R: StaticArray<i32> = [0, 1, 1, 1];
const DIRS_C: StaticArray<i32> = [1, 0, 1, -1];

export function resetBoard(): void {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    board[i] = 0;
  }
}

export function setCell(r: i32, c: i32, val: i32): void {
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    board[r * BOARD_SIZE + c] = <u8>val;
  }
}

export function getCell(r: i32, c: i32): i32 {
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    return <i32>board[r * BOARD_SIZE + c];
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
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr * BOARD_SIZE + nc] === player) {
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
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr * BOARD_SIZE + nc] === player) {
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

function evaluateLine(r: i32, c: i32, dr: i32, dc: i32, player: u8): i32 {
  let count: i32 = 1;
  let openEnds: i32 = 0;

  let i: i32 = 1;
  while (true) {
    const nr = r + dr * i;
    const nc = c + dc * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
    const val = board[nr * BOARD_SIZE + nc];
    if (val === player) {
      count++;
      i++;
    } else {
      if (val === 0) openEnds++;
      break;
    }
  }

  i = 1;
  while (true) {
    const nr = r - dr * i;
    const nc = c - dc * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
    const val = board[nr * BOARD_SIZE + nc];
    if (val === player) {
      count++;
      i++;
    } else {
      if (val === 0) openEnds++;
      break;
    }
  }

  if (count >= 5) return 1000000;
  if (count === 4) return openEnds === 2 ? 100000 : (openEnds === 1 ? 10000 : 0);
  if (count === 3) return openEnds === 2 ? 5000 : (openEnds === 1 ? 1000 : 0);
  if (count === 2) return openEnds === 2 ? 500 : 0;
  return 0;
}

export function evaluateBoard(): i32 {
  let scoreAI: i32 = 0;
  let scoreHuman: i32 = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx = r * BOARD_SIZE + c;
      const p = board[idx];
      if (p === 1) {
        for (let d = 0; d < 4; d++) {
          scoreAI += evaluateLine(r, c, DIRS_R[d], DIRS_C[d], 1);
        }
      } else if (p === 2) {
        for (let d = 0; d < 4; d++) {
          scoreHuman += evaluateLine(r, c, DIRS_R[d], DIRS_C[d], 2);
        }
      }
    }
  }

  return scoreAI - scoreHuman;
}

const candidateMoves: Int32Array = new Int32Array(TOTAL_CELLS);
const visited: Uint8Array = new Uint8Array(TOTAL_CELLS);

function getPossibleMovesCount(): i32 {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    visited[i] = 0;
  }

  let count: i32 = 0;
  let hasPieces: bool = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r * BOARD_SIZE + c] !== 0) {
        hasPieces = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const idx = nr * BOARD_SIZE + nc;
              if (board[idx] === 0 && visited[idx] === 0) {
                visited[idx] = 1;
                candidateMoves[count] = idx;
                count++;
              }
            }
          }
        }
      }
    }
  }

  if (!hasPieces) {
    candidateMoves[0] = 7 * BOARD_SIZE + 7;
    return 1;
  }

  return count;
}

function minimax(depth: i32, alpha: i32, beta: i32, isMax: bool): i32 {
  if (depth === 0) return evaluateBoard();

  const movesCount = getPossibleMovesCount();
  const localMoves = new Int32Array(movesCount);
  for (let i = 0; i < movesCount; i++) {
    localMoves[i] = candidateMoves[i];
  }

  if (isMax) {
    let maxEval: i32 = -2000000000;
    for (let i = 0; i < movesCount; i++) {
      const idx = localMoves[i];
      const r = idx / BOARD_SIZE;
      const c = idx % BOARD_SIZE;

      board[idx] = 1;
      let evalScore: i32;
      if (checkWinAt(r, c, 1)) {
        evalScore = 1000000 + depth * 100;
      } else {
        evalScore = minimax(depth - 1, alpha, beta, false);
      }
      board[idx] = 0;

      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval: i32 = 2000000000;
    for (let i = 0; i < movesCount; i++) {
      const idx = localMoves[i];
      const r = idx / BOARD_SIZE;
      const c = idx % BOARD_SIZE;

      board[idx] = 2;
      let evalScore: i32;
      if (checkWinAt(r, c, 2)) {
        evalScore = -1000000 - depth * 100;
      } else {
        evalScore = minimax(depth - 1, alpha, beta, true);
      }
      board[idx] = 0;

      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function findImmediateMove(player: u8): i32 {
  const movesCount = getPossibleMovesCount();
  for (let i = 0; i < movesCount; i++) {
    const idx = candidateMoves[i];
    const r = idx / BOARD_SIZE;
    const c = idx % BOARD_SIZE;
    board[idx] = player;
    const isWin = checkWinAt(r, c, player);
    board[idx] = 0;
    if (isWin) return idx;
  }
  return -1;
}

export function findBestMove(depth: i32): i32 {
  let move = findImmediateMove(1);
  if (move !== -1) return move;

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

  for (let i = 0; i < movesCount; i++) {
    const idx = localMoves[i];
    board[idx] = 1;
    const score = minimax(depth - 1, alpha, beta, false);
    board[idx] = 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
    if (score > alpha) alpha = score;
  }

  return bestMove;
}
