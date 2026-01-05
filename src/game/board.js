export function createBoard(size) {
  return Array.from({ length: size }, () =>
    Array(size).fill(0)
  );
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}
