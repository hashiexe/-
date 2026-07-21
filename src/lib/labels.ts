// ステージ番号ラベル（1-1 等）を並び順から自動算出する。
// ワールドをまたいだ並び替えでも常にラベルが整合するように、
// 保存値には依存せず「ワールドの表示順」と「ワールド内の表示順」から都度計算する。
import type { Snapshot, Stage, World } from '../types';

export interface DerivedStage extends Stage {
  /** 表示用ラベル。通常は "2-3"、ゴールは "GOAL" */
  label: string;
  /** ワールドの表示インデックス（0始まり） */
  worldIndex: number;
  /** ワールド内の表示インデックス（0始まり） */
  stageIndex: number;
}

/** ワールドを order 昇順で返す */
export function sortedWorlds(snap: Snapshot): World[] {
  return [...snap.worlds].sort((a, b) => a.order - b.order);
}

/** 指定ワールドのステージを order 昇順で返す */
export function stagesOfWorld(snap: Snapshot, worldId: string): Stage[] {
  return snap.stages
    .filter((s) => s.world_id === worldId)
    .sort((a, b) => a.order - b.order);
}

/** すべてのステージにラベルを付与して返す（ワールド順→ステージ順） */
export function deriveStages(snap: Snapshot): DerivedStage[] {
  const worlds = sortedWorlds(snap);
  const result: DerivedStage[] = [];
  worlds.forEach((w, wi) => {
    stagesOfWorld(snap, w.id).forEach((s, si) => {
      result.push({
        ...s,
        worldIndex: wi,
        stageIndex: si,
        label: s.kind === 'goal' ? 'GOAL' : `${wi + 1}-${si + 1}`,
      });
    });
  });
  return result;
}

/** stage_id からラベルを引く（見つからなければ '-'） */
export function labelForStage(snap: Snapshot, stageId: string | null): string {
  if (!stageId) return '-';
  const found = deriveStages(snap).find((s) => s.id === stageId);
  return found ? found.label : '-';
}
