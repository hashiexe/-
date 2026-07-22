// スナップショットに対する純粋な変換関数群。
// localStorage バックエンドはこれをそのまま利用し、
// Supabase バックエンドは同じ意味の行操作を行う。
import type { Actor, ActivityLog, LogAction, Snapshot, Stage, StageStatus } from '../types';
import { deriveStages, labelForStage } from './labels';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeLog(
  snap: Snapshot,
  stage: { id: string | null; title: string },
  action: LogAction,
  actor: Actor,
): ActivityLog {
  return {
    id: newId(),
    stage_id: stage.id,
    stage_label: stage.id ? labelForStage(snap, stage.id) : '-',
    stage_title: stage.title,
    action,
    actor,
    created_at: new Date().toISOString(),
  };
}

const MAX_LOGS = 200;

function withLog(snap: Snapshot, log: ActivityLog): ActivityLog[] {
  return [log, ...snap.logs].slice(0, MAX_LOGS);
}

/** クリア / 未達成 の切替 */
export function toggleStatus(snap: Snapshot, stageId: string, actor: Actor): Snapshot {
  const target = snap.stages.find((s) => s.id === stageId);
  if (!target) return snap;
  const now = new Date().toISOString();
  const nextStatus: StageStatus = target.status === 'cleared' ? 'todo' : 'cleared';
  const stages = snap.stages.map((s) =>
    s.id === stageId
      ? {
          ...s,
          status: nextStatus,
          cleared_at: nextStatus === 'cleared' ? now : null,
          updated_by: actor,
          updated_at: now,
        }
      : s,
  );

  // いものすけが乗っているステージをクリアしたら、次の未達成ステージへ自動で進む
  let appState = snap.appState;
  if (nextStatus === 'cleared' && snap.appState.current_stage_id === stageId) {
    const ordered = deriveStages({ ...snap, stages });
    const idx = ordered.findIndex((s) => s.id === stageId);
    const nextTodo = ordered.slice(idx + 1).find((s) => s.status === 'todo') ?? ordered.find((s) => s.status === 'todo');
    if (nextTodo) appState = { ...snap.appState, current_stage_id: nextTodo.id };
  }

  const log = makeLog(snap, target, nextStatus === 'cleared' ? 'cleared' : 'reverted', actor);
  return { ...snap, stages, appState, logs: withLog(snap, log) };
}

export type StageEdit = Pick<Stage, 'title' | 'goal' | 'icon' | 'world_id'>;

/** ステージ内容の編集（タイトル・目標・絵文字・所属ワールド） */
export function editStage(snap: Snapshot, stageId: string, edit: StageEdit, actor: Actor): Snapshot {
  const target = snap.stages.find((s) => s.id === stageId);
  if (!target) return snap;
  const now = new Date().toISOString();
  const worldChanged = edit.world_id !== target.world_id;
  // ワールドを移動する場合は移動先の末尾に置く
  const newOrder = worldChanged
    ? Math.max(-1, ...snap.stages.filter((s) => s.world_id === edit.world_id).map((s) => s.order)) + 1
    : target.order;
  const stages = snap.stages.map((s) =>
    s.id === stageId
      ? { ...s, ...edit, order: newOrder, updated_by: actor, updated_at: now }
      : s,
  );
  const log = makeLog(snap, { id: stageId, title: edit.title }, 'edited', actor);
  return { ...snap, stages, logs: withLog(snap, log) };
}

/** 新規ステージ追加（指定ワールドの末尾） */
export function addStage(snap: Snapshot, worldId: string, actor: Actor): { snap: Snapshot; stage: Stage } {
  const now = new Date().toISOString();
  const order = Math.max(-1, ...snap.stages.filter((s) => s.world_id === worldId).map((s) => s.order)) + 1;
  const stage: Stage = {
    id: newId(),
    world_id: worldId,
    title: '新しいステージ',
    goal: '',
    icon: '🍠',
    order,
    status: 'todo',
    kind: 'normal',
    cleared_at: null,
    updated_by: actor,
    updated_at: now,
  };
  const stages = [...snap.stages, stage];
  const next = { ...snap, stages };
  const log = makeLog(next, stage, 'added', actor);
  return { snap: { ...next, logs: withLog(snap, log) }, stage };
}

/** ステージ削除 */
export function deleteStage(snap: Snapshot, stageId: string, actor: Actor): Snapshot {
  const target = snap.stages.find((s) => s.id === stageId);
  if (!target) return snap;
  const stages = snap.stages.filter((s) => s.id !== stageId);
  const appState =
    snap.appState.current_stage_id === stageId
      ? { ...snap.appState, current_stage_id: null }
      : snap.appState;
  const log = makeLog(snap, target, 'deleted', actor);
  return { ...snap, stages, appState, logs: withLog(snap, log) };
}

/** ワールド名の変更 */
export function renameWorld(snap: Snapshot, worldId: string, name: string, actor: Actor): Snapshot {
  const worlds = snap.worlds.map((w) => (w.id === worldId ? { ...w, name } : w));
  const log = makeLog(snap, { id: null, title: name }, 'renamed_world', actor);
  return { ...snap, worlds, logs: withLog(snap, log) };
}

/** いものすけの現在地マーカーを設定 */
export function setMarker(snap: Snapshot, stageId: string | null, actor: Actor): Snapshot {
  const appState = { ...snap.appState, current_stage_id: stageId };
  const target = stageId ? snap.stages.find((s) => s.id === stageId) : null;
  const log = makeLog(snap, { id: stageId, title: target?.title ?? '' }, 'marker', actor);
  return { ...snap, appState, logs: withLog(snap, log) };
}

/** 並び替え結果を適用。arrangement は worldId -> 並び順に並んだ stageId 配列 */
export function applyArrangement(
  snap: Snapshot,
  arrangement: Record<string, string[]>,
  movedStage: Stage | null,
  actor: Actor,
): Snapshot {
  const now = new Date().toISOString();
  const posById = new Map<string, { world_id: string; order: number }>();
  for (const [worldId, ids] of Object.entries(arrangement)) {
    ids.forEach((id, idx) => posById.set(id, { world_id: worldId, order: idx }));
  }
  const stages = snap.stages.map((s) => {
    const pos = posById.get(s.id);
    if (!pos) return s;
    if (pos.world_id === s.world_id && pos.order === s.order) return s;
    return { ...s, world_id: pos.world_id, order: pos.order, updated_by: actor, updated_at: now };
  });
  const next = { ...snap, stages };
  if (!movedStage) return next;
  const log = makeLog(next, movedStage, 'moved', actor);
  return { ...next, logs: withLog(snap, log) };
}

/** 日本語の履歴文を組み立てる */
export function describeLog(log: ActivityLog): string {
  const who = log.actor;
  const where = log.stage_label !== '-' ? `${log.stage_label} ` : '';
  switch (log.action) {
    case 'cleared':
      return `${who}が ${where}をクリアにしました`;
    case 'reverted':
      return `${who}が ${where}を未達成に戻しました`;
    case 'edited':
      return `${who}が ${where}「${log.stage_title}」を編集しました`;
    case 'added':
      return `${who}がステージを追加しました`;
    case 'deleted':
      return `${who}が「${log.stage_title}」を削除しました`;
    case 'moved':
      return `${who}が ${where}を並び替えました`;
    case 'renamed_world':
      return `${who}がワールド名を「${log.stage_title}」に変更しました`;
    case 'marker':
      return log.stage_id
        ? `${who}が現在地を ${where}にしました`
        : `${who}が現在地マーカーを外しました`;
    default:
      return `${who}が更新しました`;
  }
}
