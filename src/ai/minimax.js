import { checkWin } from "../game/rules";
import { evaluate } from "./evaluate";
import { getPossibleMoves, getRawMoves } from "./moveGenerator";

export function minimax(board, depth, alpha, beta, isMax) {
  if (depth === 0) return evaluate(board);

  const moves = getPossibleMoves(board);

  if (isMax) {
    let best = -Infinity;
    for (const [r, c] of moves) {
      board[r][c] = 1;
      best = Math.max(best, minimax(board, depth - 1, alpha, beta, false));
      board[r][c] = 0;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [r, c] of moves) {
      board[r][c] = -1;
      best = Math.min(best, minimax(board, depth - 1, alpha, beta, true));
      board[r][c] = 0;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function countThreats(board, r, c, player) {
  let threats = 0;

  board[r][c] = player;

  for (const [nr, nc] of getRawMoves(board, 1)) {
    board[nr][nc] = player;
    if (checkWin(board, nr, nc, player)) {
      threats++;
    }
    board[nr][nc] = 0;
  }

  board[r][c] = 0;
  return threats;
}

function findDoubleThreat(board, player) {
  for (const [r, c] of getPossibleMoves(board)) {
    if (board[r][c] !== 0) continue;

    const threats = countThreats(board, r, c, player);
    if (threats >= 2) {
      return [r, c];
    }
  }
  return null;
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

export function findBestMove(board, depth = 3) {
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

