export function getPossibleMoves(
  board,
  radius = 2,
  minNeighbors = 2
) {
  const moves = new Map(); // key -> score
  const n = board.length;

  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr;
            const nc = c + dc;

            if (
              nr < 0 ||
              nr >= n ||
              nc < 0 ||
              nc >= n ||
              board[nr][nc] !== 0
            )
              continue;

            const key = `${nr},${nc}`;
            if (!moves.has(key)) {
              let score = 0;

              // đếm hàng xóm
              for (const [dx, dy] of directions) {
                let count = 0;

                for (let k = 1; k <= 2; k++) {
                  const r1 = nr + dx * k;
                  const c1 = nc + dy * k;
                  const r2 = nr - dx * k;
                  const c2 = nc - dy * k;

                  if (
                    r1 >= 0 &&
                    r1 < n &&
                    c1 >= 0 &&
                    c1 < n &&
                    board[r1][c1] !== 0
                  )
                    count++;

                  if (
                    r2 >= 0 &&
                    r2 < n &&
                    c2 >= 0 &&
                    c2 < n &&
                    board[r2][c2] !== 0
                  )
                    count++;
                }

                score += count * count; // ưu tiên nối chuỗi
              }

              moves.set(key, score);
            }
          }
        }
      }
    }
  }

  // bàn trống
  if (moves.size === 0) {
    const mid = Math.floor(n / 2);
    return [[mid, mid]];
  }

  // lọc + sort
  const sortedMoves = [...moves.entries()].sort((a, b) => b[1] - a[1]);
  const filteredMoves = sortedMoves.filter(([, score]) => score >= minNeighbors);

  // Nếu lọc xong mà hết nước đi (ví dụ đầu game), thì lấy danh sách chưa lọc
  return (filteredMoves.length > 0 ? filteredMoves : sortedMoves).map(([key]) =>
    key.split(",").map(Number)
  );
}

export function getRawMoves(board, radius = 1) {
  const moves = new Set();
  const n = board.length;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < n &&
              nc >= 0 &&
              nc < n &&
              board[nr][nc] === 0
            ) {
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

  return [...moves].map(m => m.split(",").map(Number));
}
