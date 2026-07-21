// クリア時のお祝い演出：紙吹雪 + 「STAGE X-Y クリア！」カード。
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export interface CelebrationData {
  label: string;
  title: string;
  goal: string;
}

interface Props {
  data: CelebrationData | null;
  onClose: () => void;
}

const COLORS = ['#e8823c', '#f2c14e', '#5c8a4a', '#5b3a56', '#ffd98a'];

export function Celebration({ data, onClose }: Props) {
  useEffect(() => {
    if (!data) return;
    // 派手すぎない、でも嬉しい紙吹雪
    const fire = () => {
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 38,
        origin: { y: 0.45 },
        colors: COLORS,
        scalar: 0.9,
      });
    };
    fire();
    const t = setTimeout(fire, 260);
    return () => clearTimeout(t);
  }, [data]);

  if (!data) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="clear-card" onClick={(e) => e.stopPropagation()}>
        <div className="emoji">🎉</div>
        <h2>
          {data.label === 'GOAL' ? 'GOAL' : `STAGE ${data.label}`} クリア!
        </h2>
        <p>{data.goal || data.title}</p>
        <button className="btn btn-primary" onClick={onClose}>
          つぎへすすむ
        </button>
      </div>
    </div>
  );
}
