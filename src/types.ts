// とろりロード — 共通型定義

/** 更新者（この2名のみ） */
export type Actor = '夫' | '妻';

/** ステージの状態（ロック概念は持たない。順不同クリア対応で最初から達成可能） */
export type StageStatus = 'todo' | 'cleared';

/** 通常ステージ / 最終ゴール（🏮 実店舗オープン） */
export type StageKind = 'normal' | 'goal';

/** ワールド（フェーズ） */
export interface World {
  id: string;
  name: string;
  order: number;
}

/** ステージ */
export interface Stage {
  id: string;
  world_id: string;
  title: string;
  goal: string;
  icon: string;
  order: number;
  status: StageStatus;
  kind: StageKind;
  cleared_at: string | null;
  updated_by: Actor | null;
  updated_at: string;
}

/** 変更履歴 */
export type LogAction =
  | 'cleared'
  | 'reverted'
  | 'edited'
  | 'added'
  | 'deleted'
  | 'moved'
  | 'renamed_world'
  | 'marker';

export interface ActivityLog {
  id: string;
  stage_id: string | null;
  /** 表示用に非正規化して保持（削除後も文言を出せるように） */
  stage_label: string;
  stage_title: string;
  action: LogAction;
  actor: Actor;
  created_at: string;
}

/** アプリ全体の共有状態（いものすけの現在地など） */
export interface AppState {
  current_stage_id: string | null;
}

/** 画面が扱うデータ一式 */
export interface Snapshot {
  worlds: World[];
  stages: Stage[];
  logs: ActivityLog[];
  appState: AppState;
}
