// Responsive cell size: fit the board within the visible screen
export function calcCellSize(boardSize) {
  const maxBoardWidth = Math.min(window.innerWidth - 56, window.innerHeight - 320, 600);
  return Math.max(24, Math.floor(maxBoardWidth / boardSize));
}
