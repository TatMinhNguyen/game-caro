import { useEffect, useMemo, useRef } from 'react';

const CONFETTI_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#7c6af7', '#ff9f43', '#a29bfe'];

function generateConfettiPieces() {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: `${Math.random() * 0.8}s`,
    duration: `${1.2 + Math.random() * 0.8}s`,
    size: `${6 + Math.random() * 6}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    rotation: `${Math.random() * 360}deg`,
  }));
}

function Confetti() {
  // useMemo is the correct hook for computing a value once on mount.
  // Reading/writing ref.current during render is disallowed in React.
  const pieces = useMemo(() => generateConfettiPieces(), []);

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            borderRadius: p.borderRadius,
          }}
        />
      ))}
    </div>
  );
}

export default function WinModal({ result, onRestart }) {
  const btnRef = useRef(null);

  useEffect(() => {
    // Auto-focus restart button for keyboard users
    const t = setTimeout(() => btnRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const config = {
    win: {
      emoji: '🎉',
      title: 'Xuất sắc!',
      subtitle: 'Bạn đã đánh bại AI! Thật ấn tượng 💪',
      modalClass: 'modal-win',
    },
    lose: {
      emoji: '🤖',
      title: 'AI thắng!',
      subtitle: 'AI đã chiến thắng lần này. Hãy thử lại bạn nhé!',
      modalClass: 'modal-lose',
    },
    draw: {
      emoji: '🤝',
      title: 'Hòa!',
      subtitle: 'Ván đấu kịch tính! Bàn cờ đã đầy.',
      modalClass: 'modal-draw',
    },
  };

  const { emoji, title, subtitle, modalClass } = config[result] || config.draw;
  const isWin = result === 'win';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal-card ${modalClass}`}>
        {isWin && <Confetti />}
        <span className="modal-emoji" role="img" aria-label={title}>{emoji}</span>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-subtitle">{subtitle}</p>
        <div className="modal-actions">
          <button
            id="modal-restart-btn"
            ref={btnRef}
            className="btn btn-primary"
            onClick={onRestart}
          >
            🔄 Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
}
