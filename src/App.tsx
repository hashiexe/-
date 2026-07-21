import { useEffect, useMemo, useRef, useState } from 'react';
import { useGate } from './hooks/useGate';
import { useRoadmap } from './hooks/useRoadmap';
import { deriveStages, labelForStage, sortedWorlds } from './lib/labels';
import type { StageEdit } from './lib/mutations';
import { Gate } from './components/Gate';
import { WorldMap } from './components/WorldMap';
import { StageDetail } from './components/StageDetail';
import { Celebration, type CelebrationData } from './components/Celebration';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { Mascot } from './components/Mascot';

// いものすけをなでた時のひとこと（ゆるっと可愛い雰囲気）
const IMONO_LINES = [
  'おなかすいたよぉ',
  'たいようで ねむくなっちゃう…',
  'おいしく やいてね♪',
  'ほくほくに なりたいな',
  'むらさきのかわ、じまんなんだ',
  'あまく なってきたかな？',
  'ゆげ でてる？ あつあつだよ',
  'なでてくれて ありがと〜',
  'きょうも がんばろ〜',
  'ひとやすみ しよ？',
  'つぎのステージ いってみよ！',
  'とろりのお店、たのしみだね',
  'ぽかぽか きもちいい〜',
  'いっしょに がんばろうね',
  'おいもは しあわせの あじ',
  'えへへ、くすぐったい',
];

// 進み具合ごとの応援メッセージ（開くたびにランダムで1つ選ぶ）
const CHEERS = {
  empty: ['ステージを ついかしてみよう！', '＋ボタンで はじめよう'],
  start: [
    'さあ、はじめよう！🍠',
    'まずは ひとつ、いってみよ〜',
    'どのステージからでも OK！',
    'きょうの いっぽを ふみだそう✨',
    'いものすけと しゅっぱつ！',
  ],
  low: [
    'いいスタート！その調子〜✨',
    'ちょっとずつ すすんでる♪',
    'その いきだよ〜',
    'ひとつクリア、えらい！',
    'ぼちぼち いこう🍠',
  ],
  mid: [
    'どんどん すすんでるね！',
    'のってきた〜✨',
    'いい ペース！',
    'もう これだけ できたよ',
    'いものすけ うれしそう😊',
  ],
  high: [
    'はんぶん こえた！すごいっ💪',
    'ここまで きたね、えらい！',
    'うしろ半分、みえてきた✨',
    'ばっちり ちょうし♪',
    'あと はんぶん、たのしも〜',
  ],
  almost: [
    'ゴールは すぐそこ！あとちょっと🏮',
    'ラストスパート〜✨',
    'もうちょっとで とろりのお店！',
    'ここまで きたら いける！',
    'あとすこし、ふぁいと💪',
  ],
  done: [
    'ぜんぶクリア！おめでとう🎉',
    'やったね！かんぺき✨',
    'とろりロード せいは！すごい🏮',
    'ふたりで やりきったね🎉',
  ],
};

function cheerMessage(cleared: number, total: number, seed: number): string {
  let pool: string[];
  if (total === 0) pool = CHEERS.empty;
  else if (cleared === 0) pool = CHEERS.start;
  else if (cleared >= total) pool = CHEERS.done;
  else {
    const r = cleared / total;
    pool = r < 0.25 ? CHEERS.low : r < 0.5 ? CHEERS.mid : r < 0.75 ? CHEERS.high : CHEERS.almost;
  }
  return pool[Math.floor(seed * pool.length) % pool.length];
}

export default function App() {
  const gate = useGate();
  const roadmap = useRoadmap(gate.actor);
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // このセッション（＝この画面を開いている間）で固定の応援メッセージ。開くたびに変わる
  const [cheerSeed] = useState(() => Math.random());

  useEffect(() => () => clearTimeout(speechTimer.current), []);

  const speak = () => {
    setSpeech((prev) => {
      let line = IMONO_LINES[Math.floor(Math.random() * IMONO_LINES.length)];
      if (IMONO_LINES.length > 1) {
        while (line === prev) line = IMONO_LINES[Math.floor(Math.random() * IMONO_LINES.length)];
      }
      return line;
    });
    setTapCount((n) => n + 1);
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 3200);
  };

  const snap = roadmap.snap;

  const derived = useMemo(() => (snap ? deriveStages(snap) : []), [snap]);
  const clearedCount = derived.filter((s) => s.status === 'cleared').length;
  const total = derived.length;
  const pct = total ? (clearedCount / total) * 100 : 0;
  const walkPct = Math.min(Math.max(pct, 3), 97);
  // 端に寄った時に吹き出しが画面外に出ないよう、開く向きを変える
  const bubbleSide = walkPct < 30 ? 'right' : walkPct > 70 ? 'left' : 'center';
  const currentLabel = snap ? labelForStage(snap, snap.appState.current_stage_id) : '-';

  // ガード未通過なら入場画面
  if (!gate.unlocked || !gate.actor) {
    return <Gate gate={gate} />;
  }

  if (roadmap.error) {
    return (
      <div className="gate">
        <div className="gate-card">
          <Mascot className="badge-mascot" size={72} />
          <h1>あれれ…</h1>
          <p style={{ marginBottom: 10 }}>クラウドにつながりませんでした。</p>
          <p className="gate-error" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
            {roadmap.error}
          </p>
          <button className="btn btn-primary" onClick={() => location.reload()} style={{ marginTop: 12 }}>
            もう一度ためす
          </button>
        </div>
      </div>
    );
  }

  if (!snap) {
    return (
      <div className="gate">
        <div className="gate-card">
          <Mascot className="badge-mascot" size={72} />
          <p>よみこみ中…</p>
        </div>
      </div>
    );
  }

  const openStage = openStageId ? derived.find((s) => s.id === openStageId) ?? null : null;
  const worlds = sortedWorlds(snap);

  const celebrateIfCleared = async (stageId: string) => {
    const clearedStage = await roadmap.toggleStatus(stageId);
    if (clearedStage) {
      const d = derived.find((s) => s.id === stageId);
      setCelebration({
        label: d?.label ?? '',
        title: clearedStage.title,
        goal: clearedStage.goal,
      });
    }
  };

  const handleSave = (stageId: string, edit: StageEdit) => {
    void roadmap.editStage(stageId, edit);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-actor">
          <span className="who">{gate.actor}</span>
          <button className="link-btn" onClick={gate.signOut}>
            ぬける
          </button>
        </div>
        <div className="title-plaque">
          <span className="spark spark-a" aria-hidden>
            ✨
          </span>
          <span className="spark spark-b" aria-hidden>
            ✨
          </span>
          <Mascot className="mascot-big" size={62} />
          <span className="title-text">
            <h1>とろりロード</h1>
            <span className="tagline">おいも屋 とろり 開業ロードマップ</span>
          </span>
          <Mascot className="mascot-small" size={40} />
        </div>

        <div className="stat-strip">
          <div className="stat-chip">
            クリア <b>{clearedCount}</b> / {total}
          </div>
          <div className="stat-chip">
            現在地 <b>{currentLabel}</b>
          </div>
          {roadmap.isCloud && <div className="stat-chip">☁️ 同期中</div>}
        </div>

        <div className="progress-wrap">
          <div className="progress-walker" style={{ left: `${walkPct}%` }}>
            {speech && (
              <div className={`speech-bubble ${bubbleSide}`} role="status">
                {speech}
              </div>
            )}
            <button
              key={tapCount}
              type="button"
              className="walker-btn hopping"
              onClick={speak}
              aria-label="いものすけを なでる"
            >
              <Mascot size={30} />
            </button>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-goal" aria-hidden>
            🏮
          </span>
        </div>
        <p className="cheer">{cheerMessage(clearedCount, total, cheerSeed)}</p>

        <div className="toolbar">
          <button
            className={`pill ${reorderMode ? 'active' : ''}`}
            onClick={() => setReorderMode((v) => !v)}
          >
            {reorderMode ? '✓ 並び替え中' : '↕ 並び替え'}
          </button>
          <button className="pill" onClick={() => setShowLog(true)}>
            📜 記録
          </button>
        </div>
      </header>

      <WorldMap
        snap={snap}
        reorderMode={reorderMode}
        onOpenStage={(id) => setOpenStageId(id)}
        onQuickClear={(id) => void celebrateIfCleared(id)}
        onAddStage={(worldId) => void roadmap.addStage(worldId)}
        onRenameWorld={(worldId, name) => void roadmap.renameWorld(worldId, name)}
        onReorder={(arr, movedId) => void roadmap.reorder(arr, movedId)}
      />

      <p className="footer-note">ふたりで こつこつ、とろりのお店まで。🍠</p>

      {openStage && (
        <StageDetail
          stage={openStage}
          worlds={worlds}
          isCurrent={snap.appState.current_stage_id === openStage.id}
          onToggleStatus={() => {
            void celebrateIfCleared(openStage.id);
            setOpenStageId(null);
          }}
          onSave={(edit) => handleSave(openStage.id, edit)}
          onDelete={() => void roadmap.deleteStage(openStage.id)}
          onSetMarker={(on) => void roadmap.setMarker(on ? openStage.id : null)}
          onClose={() => setOpenStageId(null)}
        />
      )}

      <Celebration data={celebration} onClose={() => setCelebration(null)} />

      {showLog && <ActivityLogPanel logs={snap.logs} onClose={() => setShowLog(false)} />}
    </>
  );
}
