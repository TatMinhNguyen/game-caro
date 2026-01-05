const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

// điểm theo pattern
const SCORE_TABLE = {
  "5": 1000000,
  "4_2": 100000,  // 4 mở
  "4_1": 10000,   // 4 bị chặn 1 đầu
  "3_2": 5000,
  "3_1": 1000,
  "2_2": 500,
};

export function evaluate(board) {
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

function evaluatePoint(board, r, c, player) {
  let total = 0;

  for (const [dx, dy] of DIRS) {
    const { count, openEnds } = countLine(board, r, c, dx, dy, player);

    if (count >= 2) {
      const key = count === 5
        ? "5"
        : `${count}_${openEnds}`;

      const val = SCORE_TABLE[key] || 0;
      total += player === 1 ? val : -val;
    }
  }

  return total;
}

function countLine(board, r, c, dx, dy, player) {
  let count = 1;
  let openEnds = 0;

  let i = 1;
  while (board[r + dx * i]?.[c + dy * i] === player) {
    count++;
    i++;
  }
  if (board[r + dx * i]?.[c + dy * i] === 0) openEnds++;

  i = 1;
  while (board[r - dx * i]?.[c - dy * i] === player) {
    count++;
    i++;
  }
  if (board[r - dx * i]?.[c - dy * i] === 0) openEnds++;

  return { count, openEnds };
}
