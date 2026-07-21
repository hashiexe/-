// ロードマップの状態管理。バックエンドから読み込み、変更を購読し、
// 各操作を通じてクラウド/ローカルへ反映する。
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Actor, Snapshot, Stage } from '../types';
import { getBackend } from '../lib/createBackend';
import type { StageEdit } from '../lib/mutations';

export interface Roadmap {
  snap: Snapshot | null;
  loading: boolean;
  isCloud: boolean;
  toggleStatus: (stageId: string) => Promise<Stage | undefined>;
  editStage: (stageId: string, edit: StageEdit) => Promise<void>;
  addStage: (worldId: string) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;
  renameWorld: (worldId: string, name: string) => Promise<void>;
  setMarker: (stageId: string | null) => Promise<void>;
  reorder: (arrangement: Record<string, string[]>, movedStageId: string | null) => Promise<void>;
}

export function useRoadmap(actor: Actor | null): Roadmap {
  const backend = getBackend();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;

  useEffect(() => {
    let alive = true;
    backend
      .load()
      .then((s) => alive && setSnap(s))
      .finally(() => alive && setLoading(false));
    const unsub = backend.subscribe(() => {
      backend.load().then((s) => alive && setSnap(s));
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [backend]);

  const requireActor = useCallback((): Actor => actor ?? '夫', [actor]);

  const toggleStatus = useCallback(
    async (stageId: string) => {
      const before = snapRef.current?.stages.find((s) => s.id === stageId);
      const next = await backend.toggleStatus(stageId, requireActor());
      setSnap(next);
      const after = next.stages.find((s) => s.id === stageId);
      // クリアに変わった時だけ演出用に返す
      return before?.status !== 'cleared' && after?.status === 'cleared' ? after : undefined;
    },
    [backend, requireActor],
  );

  const editStage = useCallback(
    async (stageId: string, edit: StageEdit) => {
      setSnap(await backend.editStage(stageId, edit, requireActor()));
    },
    [backend, requireActor],
  );

  const addStage = useCallback(
    async (worldId: string) => {
      setSnap(await backend.addStage(worldId, requireActor()));
    },
    [backend, requireActor],
  );

  const deleteStage = useCallback(
    async (stageId: string) => {
      setSnap(await backend.deleteStage(stageId, requireActor()));
    },
    [backend, requireActor],
  );

  const renameWorld = useCallback(
    async (worldId: string, name: string) => {
      setSnap(await backend.renameWorld(worldId, name, requireActor()));
    },
    [backend, requireActor],
  );

  const setMarker = useCallback(
    async (stageId: string | null) => {
      setSnap(await backend.setMarker(stageId, requireActor()));
    },
    [backend, requireActor],
  );

  const reorder = useCallback(
    async (arrangement: Record<string, string[]>, movedStageId: string | null) => {
      setSnap(await backend.reorder(arrangement, movedStageId, requireActor()));
    },
    [backend, requireActor],
  );

  return {
    snap,
    loading,
    isCloud: backend.isCloud,
    toggleStatus,
    editStage,
    addStage,
    deleteStage,
    renameWorld,
    setMarker,
    reorder,
  };
}
