export default function Scoreboard({ score }) {
  return (
    <div className="scoreboard" role="region" aria-label="Bảng điểm">
      <div className="score-card score-player">
        <div className="score-label">Bạn (X)</div>
        <div key={score.player} className="score-value score-animated">
          {score.player}
        </div>
      </div>
      <div className="score-card score-draw">
        <div className="score-label">Hòa</div>
        <div key={score.draw} className="score-value score-animated">
          {score.draw}
        </div>
      </div>
      <div className="score-card score-ai">
        <div className="score-label">AI (O)</div>
        <div key={score.ai} className="score-value score-animated">
          {score.ai}
        </div>
      </div>
    </div>
  );
}

