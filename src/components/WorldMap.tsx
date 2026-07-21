// ワールドマップ本体。縦スクロール表示 + dnd-kit による並び替え（ワールドまたぎ対応）。
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Snapshot, Stage } from '../types';
import { sortedWorlds } from '../lib/labels';
import { StageNode } from './StageNode';

interface Props {
  snap: Snapshot;
  reorderMode: boolean;
  onOpenStage: (stageId: string) => void;
  onQuickClear: (stageId: string) => void;
  onAddStage: (worldId: string) => void;
  onRenameWorld: (worldId: string, name: string) => void;
  onReorder: (arrangement: Record<string, string[]>, movedStageId: string | null) => void;
}

type Items = Record<string, string[]>;

// ワールドを象徴する絵文字（表示順 index に対応。6つ目以降は循環）
const WORLD_EMOJI = ['🍠', '💰', '☕', '📦', '🏮'];

function buildItems(snap: Snapshot): Items {
  const items: Items = {};
  for (const w of sortedWorlds(snap)) {
    items[w.id] = snap.stages
      .filter((s) => s.world_id === w.id)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id);
  }
  return items;
}

export function WorldMap({
  snap,
  reorderMode,
  onOpenStage,
  onQuickClear,
  onAddStage,
  onRenameWorld,
  onReorder,
}: Props) {
  const worlds = useMemo(() => sortedWorlds(snap), [snap]);
  const stageById = useMemo(() => {
    const m = new Map<string, Stage>();
    snap.stages.forEach((s) => m.set(s.id, s));
    return m;
  }, [snap.stages]);

  const [items, setItems] = useState<Items>(() => buildItems(snap));
  const [activeId, setActiveId] = useState<string | null>(null);

  // ドラッグ中でない時はサーバ状態に追従
  useEffect(() => {
    if (!activeId) setItems(buildItems(snap));
  }, [snap, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const findContainer = (id: string): string | undefined => {
    if (id in items) return id;
    return Object.keys(items).find((w) => items[w].includes(id));
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = (e: DragOverEvent) => {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overId) ?? (overId in items ? overId : undefined);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = overItems.indexOf(overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeIdStr),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          activeIdStr,
          ...overItems.slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    const activeContainer = findContainer(activeIdStr);
    let committed = items;
    if (overId) {
      const overContainer = findContainer(overId) ?? (overId in items ? overId : undefined);
      if (activeContainer && overContainer && activeContainer === overContainer) {
        const list = items[activeContainer];
        const from = list.indexOf(activeIdStr);
        const to = list.indexOf(overId);
        if (from !== -1 && to !== -1 && from !== to) {
          const next = [...list];
          next.splice(from, 1);
          next.splice(to, 0, activeIdStr);
          committed = { ...items, [activeContainer]: next };
          setItems(committed);
        }
      }
    }
    setActiveId(null);
    onReorder(committed, activeIdStr);
  };

  const activeStage = activeId ? stageById.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="map-wrap">
        {worlds.map((w, wi) => {
          const ids = items[w.id] ?? [];
          const clearedInWorld = ids.filter((id) => stageById.get(id)?.status === 'cleared').length;
          return (
            <WorldBlock
              key={w.id}
              worldId={w.id}
              index={wi}
              name={w.name}
              emoji={WORLD_EMOJI[wi % WORLD_EMOJI.length]}
              cleared={clearedInWorld}
              total={ids.length}
              stageIds={ids}
              onAddStage={() => onAddStage(w.id)}
              onRenameWorld={(name) => onRenameWorld(w.id, name)}
            >
              {ids.map((sid, si) => {
                const st = stageById.get(sid);
                if (!st) return null;
                // 各ワールド内で左右交互に配置（毎ワールド左始まり）
                const side = si % 2 === 0 ? 'left' : 'right';
                const label = st.kind === 'goal' ? 'GOAL' : `${wi + 1}-${si + 1}`;
                return (
                  <SortableStage
                    key={sid}
                    id={sid}
                    side={side}
                    reorderMode={reorderMode}
                    isCurrent={snap.appState.current_stage_id === sid}
                    stage={{ ...st, label, worldIndex: wi, stageIndex: si }}
                    hidden={activeId === sid}
                    onOpen={() => onOpenStage(sid)}
                    onQuickClear={() => onQuickClear(sid)}
                  />
                );
              })}
            </WorldBlock>
          );
        })}
      </div>

      <DragOverlay>
        {activeStage ? (
          <div className="node" style={{ opacity: 0.9 }}>
            <span>{activeStage.icon}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ---- ワールドの1ブロック（色分けカード・ドロップ先） ----
interface BlockProps {
  worldId: string;
  index: number;
  name: string;
  emoji: string;
  cleared: number;
  total: number;
  stageIds: string[];
  onAddStage: () => void;
  onRenameWorld: (name: string) => void;
  children: React.ReactNode;
}

function WorldBlock({
  worldId,
  index,
  name,
  emoji,
  cleared,
  total,
  stageIds,
  onAddStage,
  onRenameWorld,
  children,
}: BlockProps) {
  const { setNodeRef } = useDroppable({ id: worldId });
  return (
    <div className="world-card" data-accent={index % 5}>
      <div className="world-banner">
        <span className="num">{index + 1}</span>
        <span className="w-emoji" aria-hidden>
          {emoji}
        </span>
        <input
          className="wname"
          defaultValue={name}
          key={name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== name) onRenameWorld(v);
            else e.target.value = name;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          aria-label="ワールド名"
        />
        <span className="world-progress">
          {cleared}/{total}
        </span>
        <button className="add-stage" onClick={onAddStage} title="ステージを追加" aria-label="ステージを追加">
          ＋
        </button>
      </div>
      <SortableContext id={worldId} items={stageIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="world-body">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

// ---- 並び替え可能なステージ ----
interface SortableProps {
  id: string;
  side: 'left' | 'right';
  reorderMode: boolean;
  isCurrent: boolean;
  stage: import('../lib/labels').DerivedStage;
  hidden: boolean;
  onOpen: () => void;
  onQuickClear: () => void;
}

function SortableStage({ id, side, reorderMode, isCurrent, stage, hidden, onOpen, onQuickClear }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !reorderMode,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    visibility: hidden ? 'hidden' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <StageNode
        stage={stage}
        side={side}
        isCurrent={isCurrent}
        reorderMode={reorderMode}
        dragging={isDragging}
        onOpen={onOpen}
        onQuickClear={onQuickClear}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
