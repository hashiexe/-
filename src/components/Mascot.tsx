// マスコット「いものすけ」— 焼き芋の妖精。インラインSVG。
interface Props {
  size?: number;
  className?: string;
}

export function Mascot({ size = 64, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="いものすけ"
    >
      {/* 葉っぱ */}
      <path d="M32 8 C30 2 22 2 22 8 C22 12 28 14 32 12 Z" fill="#5c8a4a" />
      <path d="M32 8 C34 2 42 2 42 8 C42 12 36 14 32 12 Z" fill="#3f6633" />
      {/* からだ（さつまいも） */}
      <ellipse cx="32" cy="38" rx="20" ry="22" fill="#e8823c" />
      <path
        d="M32 16 C18 16 12 30 14 44 C16 56 26 60 32 60 C38 60 48 56 50 44 C52 30 46 16 32 16 Z"
        fill="#e8823c"
      />
      {/* 皮のグラデ影 */}
      <path
        d="M44 22 C50 30 50 44 44 52 C50 44 50 30 44 22 Z"
        fill="#c86a2e"
        opacity="0.6"
      />
      {/* ほっぺ */}
      <circle cx="23" cy="42" r="3.5" fill="#f4a15e" />
      <circle cx="41" cy="42" r="3.5" fill="#f4a15e" />
      {/* 目 */}
      <circle cx="26" cy="37" r="2.4" fill="#3d2b24" />
      <circle cx="38" cy="37" r="2.4" fill="#3d2b24" />
      <circle cx="26.8" cy="36.2" r="0.8" fill="#fff" />
      <circle cx="38.8" cy="36.2" r="0.8" fill="#fff" />
      {/* 口（にっこり） */}
      <path d="M29 43 Q32 46 35 43" stroke="#3d2b24" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
