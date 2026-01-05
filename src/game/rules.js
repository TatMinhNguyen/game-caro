const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export function checkWin(board, r, c, player) {
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

    if (line.length >= 5) {
      return line.slice(0, 5); // trả về 5 ô thắng
    }
  }
  return null;
}
