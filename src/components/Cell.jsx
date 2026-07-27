export default function Cell({ value, onClick, isLastAI, isWinCell, isPlayerTurn, style }) {
  const isEmpty = value === 0;
  const isX = value === -1;
  const isO = value === 1;

  let cellClass = 'cell';
  if (!isEmpty) cellClass += ' cell-occupied';
  else if (!isPlayerTurn) cellClass += ' cell-disabled';
  if (isLastAI) cellClass += ' cell-last-ai';
  if (isWinCell) cellClass += ' cell-win';

  return (
    <div className={cellClass} onClick={isEmpty && isPlayerTurn ? onClick : undefined} style={style}>
      {isX && <span className="cell-piece cell-piece-x">X</span>}
      {isO && <span className="cell-piece cell-piece-o">O</span>}
      {isEmpty && isPlayerTurn && (
        <span className="cell-preview" aria-hidden="true">X</span>
      )}
    </div>
  );
}
