export default function Controls({
  size,
  onSizeChange,
  difficulty,
  onDifficultyChange,
  playerFirst,
  onPlayerFirstChange,
  onReset,
  onUndo,
  canUndo,
  isAIThinking,
}) {
  return (
    <div className="controls">
      {/* Row 1: Board size + Difficulty */}
      <div className="control-row">
        <span className="control-label">Bàn cờ</span>
        <select
          id="select-board-size"
          className="control-select"
          value={size}
          onChange={e => onSizeChange(Number(e.target.value))}
          disabled={isAIThinking}
        >
          <option value={10}>10 × 10</option>
          <option value={13}>13 × 13</option>
          <option value={15}>15 × 15</option>
        </select>

        <span className="control-label" style={{ minWidth: 48 }}>Độ khó</span>
        <select
          id="select-difficulty"
          className="control-select"
          value={difficulty}
          onChange={e => onDifficultyChange(e.target.value)}
          disabled={isAIThinking}
        >
          <option value="easy">🟢 Dễ</option>
          <option value="medium">🟡 Thường</option>
          <option value="hard">🔴 Khó</option>
        </select>
      </div>

      {/* Row 2: First move + Action buttons */}
      <div className="control-row">
        <span className="control-label">Đi trước</span>
        <select
          id="select-first-move"
          className="control-select"
          value={playerFirst ? 'player' : 'ai'}
          onChange={e => onPlayerFirstChange(e.target.value === 'player')}
          disabled={isAIThinking}
        >
          <option value="player">Người (X)</option>
          <option value="ai">AI (O)</option>
        </select>

        <div className="control-buttons">
          <button
            id="btn-undo"
            className="btn btn-secondary"
            onClick={onUndo}
            disabled={!canUndo || isAIThinking}
            title="Đi lại (Undo)"
          >
            <span className="btn-icon">↩</span> Undo
          </button>
          <button
            id="btn-reset"
            className="btn btn-primary"
            onClick={onReset}
            disabled={isAIThinking}
            title="Ván mới"
          >
            <span className="btn-icon">⚡</span> Mới
          </button>
        </div>
      </div>
    </div>
  );
}
