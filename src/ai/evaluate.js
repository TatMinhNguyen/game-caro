export function evaluate(board) {
  let score = 0;
  const n = board.length;

  // Horizontal windows
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(board, r, c, 0, 1, n);
    }
  }

  // Vertical windows
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c < n; c++) {
      score += evalWindow(board, r, c, 1, 0, n);
    }
  }

  // Main diagonal windows (down-right)
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 0; c <= n - 5; c++) {
      score += evalWindow(board, r, c, 1, 1, n);
    }
  }

  // Anti-diagonal windows (down-left)
  for (let r = 0; r <= n - 5; r++) {
    for (let c = 4; c < n; c++) {
      score += evalWindow(board, r, c, 1, -1, n);
    }
  }

  return score;
}

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
