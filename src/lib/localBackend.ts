// localStorage バックエンド。Supabase 未設定でもアプリが単体で動く。
// 同一ブラウザの別タブへは storage イベントで同期する。
import type { Actor, Snapshot } from '../types';
import { buildSeedSnapshot } from '../data/seed';
import type { Backend } from './backend';
import * as M from './mutations';
import type { StageEdit } from './mutations';

const KEY = 'tororo-road:v1';
const PING = 'tororo-road:ping';

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {
    /* 壊れていたら初期化 */
  }
  const seed = buildSeedSnapshot();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function write(snap: Snapshot): Snapshot {
  localStorage.setItem(KEY, JSON.stringify(snap));
  // 別タブ通知（storage イベントは他タブのみ発火するのでこれで十分）
  localStorage.setItem(PING, Date.now().toString());
  return snap;
}

export class LocalBackend implements Backend {
  readonly isCloud = false;

  async load(): Promise<Snapshot> {
    return read();
  }

  async toggleStatus(stageId: string, actor: Actor): Promise<Snapshot> {
    return write(M.toggleStatus(read(), stageId, actor));
  }

  async editStage(stageId: string, edit: StageEdit, actor: Actor): Promise<Snapshot> {
    return write(M.editStage(read(), stageId, edit, actor));
  }

  async addStage(worldId: string, actor: Actor): Promise<Snapshot> {
    return write(M.addStage(read(), worldId, actor).snap);
  }

  async deleteStage(stageId: string, actor: Actor): Promise<Snapshot> {
    return write(M.deleteStage(read(), stageId, actor));
  }

  async renameWorld(worldId: string, name: string, actor: Actor): Promise<Snapshot> {
    return write(M.renameWorld(read(), worldId, name, actor));
  }

  async setMarker(stageId: string | null, actor: Actor): Promise<Snapshot> {
    return write(M.setMarker(read(), stageId, actor));
  }

  async reorder(
    arrangement: Record<string, string[]>,
    movedStageId: string | null,
    actor: Actor,
  ): Promise<Snapshot> {
    const snap = read();
    const moved = movedStageId ? snap.stages.find((s) => s.id === movedStageId) ?? null : null;
    return write(M.applyArrangement(snap, arrangement, moved, actor));
  }

  subscribe(onChange: () => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === PING || e.key === KEY) onChange();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}
