// バックエンド抽象。UI は接続先（Supabase / localStorage）を意識しない。
import type { Actor, Snapshot } from '../types';
import type { StageEdit } from './mutations';

export interface Backend {
  /** 現在のデータ一式を取得（無ければ初期38ステージを投入） */
  load(): Promise<Snapshot>;
  toggleStatus(stageId: string, actor: Actor): Promise<Snapshot>;
  editStage(stageId: string, edit: StageEdit, actor: Actor): Promise<Snapshot>;
  addStage(worldId: string, actor: Actor): Promise<Snapshot>;
  deleteStage(stageId: string, actor: Actor): Promise<Snapshot>;
  renameWorld(worldId: string, name: string, actor: Actor): Promise<Snapshot>;
  addWorld(actor: Actor): Promise<Snapshot>;
  deleteWorld(worldId: string, actor: Actor): Promise<Snapshot>;
  setPriority(stageId: string, on: boolean, actor: Actor): Promise<Snapshot>;
  setNextEvent(date: string | null, place: string | null, actor: Actor): Promise<Snapshot>;
  setMarker(stageId: string | null, actor: Actor): Promise<Snapshot>;
  reorder(arrangement: Record<string, string[]>, movedStageId: string | null, actor: Actor): Promise<Snapshot>;
  /** 他端末/他タブの変更通知を購読。戻り値は解除関数 */
  subscribe(onChange: () => void): () => void;
  /** クラウド同期が有効か（UI 表示用） */
  readonly isCloud: boolean;
}
