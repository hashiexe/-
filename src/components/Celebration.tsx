// クリア時のお祝い演出：紙吹雪 + いものすけの喜び + 「STAGE X-Y クリア！」カード。
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mascot } from './Mascot';

export interface CelebrationData {
  label: string;
  title: string;
  goal: string;
  reaction: string;
  anim: string;
}

interface Props {
  data: CelebrationData | null;
  onClose: () => void;
}

const COLORS = ['#e8823c', '#f2c14e', '#5c8a4a', '#8c4fe3', '#f6e03a'];

function burst() {
  const style = Math.floor(Math.random() * 3);
  if (style === 0) {
    confetti({ particleCount: 70, spread: 72, startVelocity: 40, origin: { y: 0.45 }, colors: COLORS, scalar: 0.9 });
  } else if (style === 1) {
    // 左右からのミニ大砲
    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: COLORS, scalar: 0.85 });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: COLORS, scalar: 0.85 });
  } else {
    // ふんわり舞い落ちる
    confetti({ particleCount: 60, spread: 100, startVelocity: 26, gravity: 0.7, ticks: 220, origin: { y: 0.3 }, colors: COLORS, scalar: 1 });
  }
}

export function Celebration({ data, onClose }: Props) {
  useEffect(() => {
    if (!data) return;
    burst();
    const t = setTimeout(burst, 280);
    return () => clearTimeout(t);
  }, [data]);

  if (!data) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="clear-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-duo">
          <Mascot size={72} className={`celebrate-mascot ${data.anim}`} />
          <Mascot size={48} className={`celebrate-mascot celebrate-child ${data.anim}`} />
        </div>
        <h2>{data.label === 'GOAL' ? 'GOAL' : `STAGE ${data.label}`} クリア!</h2>
        <p className="reaction">{data.reaction}</p>
        <p className="goal-text">{data.goal || data.title}</p>
        <button className="btn btn-primary" onClick={onClose}>
          つぎへすすむ
        </button>
      </div>
    </div>
  );
}
