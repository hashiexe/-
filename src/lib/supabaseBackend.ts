// Supabase バックエンド。クラウド保存＋リアルタイム購読で2端末に同期する。
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ActivityLog, Snapshot, Stage, World } from '../types';
import { buildSeedSnapshot } from '../data/seed';
import type { Backend } from './backend';
import * as M from './mutations';
import type { StageEdit } from './mutations';

export class SupabaseBackend implements Backend {
  readonly isCloud = true;
  private db: SupabaseClient;
  private seedAttempted = false;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  async load(): Promise<Snapshot> {
    const [wRes, sRes, lRes, aRes] = await Promise.all([
      this.db.from('worlds').select('*').order('order', { ascending: true }),
      this.db.from('stages').select('*').order('order', { ascending: true }),
      this.db.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200),
      this.db.from('app_state').select('*').limit(1),
    ]);

    // 接続・権限（RLS）・スキーマ未作成などのエラーは明示的に投げる（無限ループ防止）
    if (wRes.error) {
      throw new Error(
        `Supabase に接続できませんでした（${wRes.error.message}）。` +
          'URL / anon キーの設定、および supabase/schema.sql の実行を確認してください。',
      );
    }

    const worlds = (wRes.data ?? []) as World[];

    // 空なら一度だけ初期38ステージをシードして読み直す。失敗しても再帰しない。
    if (worlds.length === 0 && !this.seedAttempted) {
      this.seedAttempted = true;
      await this.seed();
      return this.load();
    }

    const app = aRes.data?.[0];
    return {
      worlds,
      stages: (sRes.data ?? []) as Stage[],
      logs: (lRes.data ?? []) as ActivityLog[],
      appState: {
        current_stage_id: app?.current_stage_id ?? null,
        next_event_date: app?.next_event_date ?? null,
        next_event_place: app?.next_event_place ?? null,
      },
    };
  }

  private async seed() {
    const seed = buildSeedSnapshot();
    await this.db.from('worlds').insert(seed.worlds);
    await this.db.from('stages').insert(seed.stages);
    await this.db.from('app_state').upsert({ id: 1, current_stage_id: seed.appState.current_stage_id });
  }

  private async persist(next: Snapshot, changedStages: Stage[], newLog?: ActivityLog) {
    if (changedStages.length) {
      await this.db.from('stages').upsert(changedStages);
    }
    if (newLog) await this.db.from('activity_logs').insert(newLog);
    return next;
  }

  async toggleStatus(stageId: string, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.toggleStatus(cur, stageId, actor);
    const changed = next.stages.filter((s) => s.id === stageId);
    // マーカーが自動で次へ進んだ場合は app_state も保存
    if (next.appState.current_stage_id !== cur.appState.current_stage_id) {
      await this.db.from('app_state').upsert({ id: 1, current_stage_id: next.appState.current_stage_id });
    }
    return this.persist(next, changed, next.logs[0]);
  }

  async editStage(stageId: string, edit: StageEdit, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.editStage(cur, stageId, edit, actor);
    const changed = next.stages.filter((s) => s.id === stageId);
    return this.persist(next, changed, next.logs[0]);
  }

  async addStage(worldId: string, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const { snap: next, stage } = M.addStage(cur, worldId, actor);
    return this.persist(next, [stage], next.logs[0]);
  }

  async deleteStage(stageId: string, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.deleteStage(cur, stageId, actor);
    await this.db.from('stages').delete().eq('id', stageId);
    if (cur.appState.current_stage_id === stageId) {
      await this.db.from('app_state').upsert({ id: 1, current_stage_id: null });
    }
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async renameWorld(worldId: string, name: string, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.renameWorld(cur, worldId, name, actor);
    await this.db.from('worlds').update({ name }).eq('id', worldId);
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async addWorld(actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const { snap: next, world } = M.addWorld(cur, actor);
    await this.db.from('worlds').insert(world);
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async deleteWorld(worldId: string, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.deleteWorld(cur, worldId, actor);
    // stages は worlds への on delete cascade で消えるが、明示的にも消しておく
    await this.db.from('stages').delete().eq('world_id', worldId);
    await this.db.from('worlds').delete().eq('id', worldId);
    if (next.appState.current_stage_id !== cur.appState.current_stage_id) {
      await this.db.from('app_state').upsert({ id: 1, current_stage_id: next.appState.current_stage_id });
    }
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async setPriority(stageId: string, on: boolean, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.setPriority(cur, stageId, on, actor);
    const changed = next.stages.filter((s) => s.id === stageId);
    return this.persist(next, changed, next.logs[0]);
  }

  async setNextEvent(date: string | null, place: string | null, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.setNextEvent(cur, date, place, actor);
    await this.db.from('app_state').upsert({ id: 1, next_event_date: date, next_event_place: place });
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async setMarker(stageId: string | null, actor: Actor): Promise<Snapshot> {
    const cur = await this.load();
    const next = M.setMarker(cur, stageId, actor);
    await this.db.from('app_state').upsert({ id: 1, current_stage_id: stageId });
    await this.db.from('activity_logs').insert(next.logs[0]);
    return next;
  }

  async reorder(
    arrangement: Record<string, string[]>,
    movedStageId: string | null,
    actor: Actor,
  ): Promise<Snapshot> {
    const cur = await this.load();
    const moved = movedStageId ? cur.stages.find((s) => s.id === movedStageId) ?? null : null;
    const next = M.applyArrangement(cur, arrangement, moved, actor);
    const changed = next.stages.filter((s) => {
      const before = cur.stages.find((o) => o.id === s.id);
      return before && (before.order !== s.order || before.world_id !== s.world_id);
    });
    return this.persist(next, changed, moved ? next.logs[0] : undefined);
  }

  subscribe(onChange: () => void): () => void {
    const channel = this.db
      .channel('tororo-road')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stages' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worlds' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, onChange)
      .subscribe();
    return () => {
      this.db.removeChannel(channel);
    };
  }
}
