// マスコット「いものすけ」— 焼き芋の妖精。
// 上半分=黄色（中身）／下半分=紫の皮（種のポツポツ）、点目にT字の口、頭から湯気。
// 手描き風の太い黒フチ。インラインSVG。
interface Props {
  size?: number;
  className?: string;
}

const BODY = 'M31 9 C19 9 12 20 12 33 C12 46 19 57 30 57 C41 57 52 48 52 34 C52 20 44 9 31 9 Z';
const PEEL = 'M11 40 Q18 36 25 40 Q32 44 39 40 Q46 36 53 40 L53 58 L11 58 Z';
const DIV = 'M11 40 Q18 36 25 40 Q32 44 39 40 Q46 36 53 40';
const INK = '#241c16';

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
      <defs>
        <clipPath id="imono-body">
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* からだ（黄色）＋皮（紫）を body でクリップ */}
      <g clipPath="url(#imono-body)">
        <rect x="0" y="0" width="64" height="64" fill="#f6e03a" />
        <path d={PEEL} fill="#8c4fe3" />
        {/* 皮の種（ポツポツ） */}
        <g fill="#5b2ba6">
          <ellipse cx="19" cy="47" rx="1" ry="1.9" transform="rotate(20 19 47)" />
          <ellipse cx="27" cy="50" rx="1" ry="1.9" transform="rotate(-15 27 50)" />
          <ellipse cx="35" cy="47" rx="1" ry="1.9" transform="rotate(18 35 47)" />
          <ellipse cx="43" cy="50" rx="1" ry="1.9" transform="rotate(-20 43 50)" />
          <ellipse cx="23" cy="54" rx="1" ry="1.8" transform="rotate(10 23 54)" />
          <ellipse cx="39" cy="54" rx="1" ry="1.8" transform="rotate(-10 39 54)" />
        </g>
      </g>

      {/* 中身と皮の境目 */}
      <path d={DIV} fill="none" stroke={INK} strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      {/* 本体の輪郭 */}
      <path d={BODY} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />

      {/* 目 */}
      <circle cx="25.5" cy="29" r="2.1" fill={INK} />
      <circle cx="36.5" cy="29" r="2.1" fill={INK} />

      {/* 口（T字） */}
      <path
        d="M27 34 H35 M31 34 V41"
        fill="none"
        stroke={INK}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 34 H35 M31 34 V41"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 湯気 */}
      <g fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round">
        <path d="M26 7 q-2.3 -1.5 0 -3 q2.3 -1.5 0 -3" />
        <path d="M31 7 q-2.3 -1.5 0 -3 q2.3 -1.5 0 -3" />
        <path d="M36 7 q-2.3 -1.5 0 -3 q2.3 -1.5 0 -3" />
      </g>
    </svg>
  );
}
