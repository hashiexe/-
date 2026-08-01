// 初期ロードマップ定義 — 全ステージ / ワールド
import type { Snapshot, Stage, World } from '../types';

interface SeedStage {
  key: string; // 安定した一意キー（並び替えても不変）
  title: string;
  goal: string;
  icon: string;
  kind?: 'goal';
}

interface SeedWorld {
  key: string;
  name: string;
  stages: SeedStage[];
}

const SEED_WORLDS: SeedWorld[] = [
  {
    key: 'w1',
    name: '焼き芋づくりを極める',
    stages: [
      { key: 's1-1', title: '定番の味を決める', goal: '基準レシピ（無水鍋の焼き時間・温度）を確定', icon: '🍠' },
      { key: 's1-2', title: '1日20本つくれる', goal: '', icon: '🍠' },
      { key: 's1-3', title: '1日40本つくれる', goal: '', icon: '🍠' },
      { key: 's1-4', title: '1日60本つくれる', goal: '', icon: '🍠' },
      { key: 's1-5', title: '1日80本つくれる', goal: '生産目標クリア', icon: '🏁' },
      { key: 's1-6', title: '冷凍ストックを作れる', goal: '家庭用冷凍庫で冷凍焼き芋を安定生産', icon: '🧊' },
      { key: 's1-7', title: '1日100本つくれる', goal: '', icon: '🍠' },
      { key: 's1-8', title: '1日120本つくれる', goal: '', icon: '🍠' },
      { key: 's1-9', title: '1日140本つくれる', goal: '', icon: '🍠' },
      { key: 's1-10', title: '1日160本つくれる', goal: '', icon: '🍠' },
      { key: 's1-11', title: '1日180本つくれる', goal: '', icon: '🍠' },
      { key: 's1-12', title: '1日200本つくれる', goal: '生産力MAXクリア', icon: '🏁' },
    ],
  },
  {
    key: 'w-dev',
    name: '商品開発',
    stages: [
      { key: 's-dev1', title: '干し芋の開発', goal: '定番にする干し芋のレシピ・仕上がりを確定', icon: '🍠' },
      { key: 's-dev2', title: '犬用お菓子の開発', goal: 'わんちゃん向け焼き芋おやつを商品化', icon: '🐕' },
    ],
  },
  {
    key: 'w2',
    name: 'はじめての黒字出店',
    stages: [
      { key: 's2-1', title: '出店の持ち物を揃える', goal: '什器・釣銭・のぼり等のチェックリスト完成', icon: '📋' },
      { key: 's2-2', title: '初出店をやりきる', goal: 'イケ・サンパークに1回出店（完走が目標）', icon: '🎪' },
      { key: 's2-3', title: '1出店で30本売れる', goal: '', icon: '💰' },
      { key: 's2-4', title: '1出店で50本売れる', goal: '', icon: '💰' },
      { key: 's2-5', title: '1出店で利益5,000円', goal: '', icon: '💰' },
      { key: 's2-6', title: '1出店で利益10,000円', goal: '黒字化の大目標クリア', icon: '🏁' },
      { key: 's2-7', title: '1出店で利益15,000円', goal: '', icon: '💰' },
      { key: 's2-8', title: '1出店で利益20,000円', goal: '', icon: '💰' },
      { key: 's2-9', title: '1出店で利益25,000円', goal: '', icon: '💰' },
      { key: 's2-10', title: '1出店で利益30,000円', goal: '出店利益の大目標クリア', icon: '🏁' },
    ],
  },
  {
    key: 'w3',
    name: 'ファンとリピーターづくり',
    stages: [
      { key: 's3-1', title: 'いものすけを看板にする', goal: 'キャラPOP・パッケージで世界観を統一', icon: '🐭' },
      { key: 's3-2', title: 'マリアージュセットを始める', goal: '焼き芋＋コーヒーの提供開始', icon: '☕' },
      { key: 's3-3', title: 'セットが5人に1人売れる', goal: '客単価アップ達成', icon: '☕' },
      { key: 's3-4', title: 'SNSを開設する', goal: '出店告知の発信チャネルを作る', icon: '📱' },
      { key: 's3-5', title: 'リピーターに再会する', goal: '「前も買ったよ」のお客さんが現れる', icon: '🤝' },
      { key: 's3-6', title: '月4回の定期出店', goal: '出店ペースを確立', icon: '🏁' },
      { key: 's3-coffee', title: '仕入れコーヒーの確定', goal: 'マリアージュに合う豆を決めて仕入れ先を確定', icon: '☕' },
      { key: 's3-mascot', title: 'いものすけ（マスコット）の作成', goal: 'いものすけのイラスト・グッズを用意', icon: '🐭' },
      { key: 's3-sign', title: '赤ちゃん・犬が焼き芋を食べてる看板の作成', goal: 'ほっこり看板でお店の顔をつくる', icon: '🪧' },
      { key: 's3-game', title: '看板ゲームの作成', goal: '看板を使ったミニゲームで集客・話題づくり', icon: '🎮' },
    ],
  },
  {
    key: 'w4',
    name: 'おうちに届ける',
    stages: [
      { key: 's4-1', title: '商品ページを作る', goal: '冷凍焼き芋の魅力（無添加・家族で・ストック可）を言語化', icon: '📝' },
      { key: 's4-2', title: 'ECサイトを公開する', goal: '自社サイトをリリース', icon: '🏁' },
      { key: 's4-3', title: 'クール便の発送体制を作る', goal: '梱包・送料設定を確定', icon: '📦' },
      { key: 's4-4', title: 'EC初受注をこなす', goal: '通販での初めての1件', icon: '🎁' },
      { key: 's4-5', title: 'リピート通販が入る', goal: 'EC経由の再注文が発生', icon: '🔁' },
      { key: 's4-6', title: '月間EC販売の目標達成', goal: '', icon: '🏁' },
    ],
  },
  {
    key: 'w5',
    name: 'とろりのお店',
    stages: [
      { key: 's5-1', title: '出店データをまとめる', goal: 'マルシェ・ECの実績を集計', icon: '📊' },
      { key: 's5-2', title: '収支計画をFIX', goal: 'シェアキッチンの収支計画を確定', icon: '🧮' },
      { key: 's5-3', title: '物件・資金のあてをつける', goal: '', icon: '🔑' },
      { key: 's5-save10', title: '貯金10万円', goal: '', icon: '🐷' },
      { key: 's5-save30', title: '貯金30万円', goal: '', icon: '🐷' },
      { key: 's5-save50', title: '貯金50万円', goal: '', icon: '🐷' },
      { key: 's5-save70', title: '貯金70万円', goal: '', icon: '🐷' },
      { key: 's5-save100', title: '貯金100万円', goal: '開業資金の目標達成', icon: '🐷' },
      { key: 's5-goal', title: 'シェアキッチン週1オープン', goal: 'とろりロードのゴール！', icon: '🍳', kind: 'goal' },
    ],
  },
];

/** 初期スナップショット（すべて未達成の状態） */
export function buildSeedSnapshot(): Snapshot {
  const now = new Date().toISOString();
  const worlds: World[] = [];
  const stages: Stage[] = [];

  SEED_WORLDS.forEach((w, wi) => {
    worlds.push({ id: w.key, name: w.name, order: wi });
    w.stages.forEach((s, si) => {
      stages.push({
        id: s.key,
        world_id: w.key,
        title: s.title,
        goal: s.goal,
        icon: s.icon,
        order: si,
        status: 'todo',
        kind: s.kind ?? 'normal',
        priority: false,
        cleared_at: null,
        updated_by: null,
        updated_at: now,
      });
    });
  });

  return {
    worlds,
    stages,
    logs: [],
    appState: { current_stage_id: 's1-1', next_event_date: null, next_event_place: null },
  };
}

/** 全ステージ数 */
export const TOTAL_STAGES = SEED_WORLDS.reduce((n, w) => n + w.stages.length, 0);
