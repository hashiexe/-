// 最上部の「優先タスク」欄。priority=true のステージを全ワールドから集めて表示。
import type { DerivedStage } from '../lib/labels';

interface Props {
  stages: DerivedStage[]; // priority のものだけ（ラベル付き）
  onOpen: (stageId: string) => void;
  onQuickClear: (stageId: string) => void;
}

export function PriorityStrip({ stages, onOpen, onQuickClear }: Props) {
  if (stages.length === 0) return null;
  return (
    <section className="prio-strip" aria-label="優先タスク">
      <div className="prio-head">
        <span className="prio-star" aria-hidden>
          ⭐
        </span>
        優先タスク
        <span className="prio-count">{stages.length}</span>
      </div>
      <div className="prio-list">
        {stages.map((s) => {
          const cleared = s.status === 'cleared';
          return (
            <div key={s.id} className={`prio-item ${cleared ? 'done' : ''}`}>
              <button className="prio-node" onClick={() => onOpen(s.id)} aria-label={s.title}>
                <span aria-hidden>{s.icon}</span>
                {cleared && <span className="prio-check">✓</span>}
              </button>
              <div className="prio-text">
                <div className="prio-tag">{s.label === 'GOAL' ? '🏮 GOAL' : `STAGE ${s.label}`}</div>
                <div className="prio-title">{s.title}</div>
              </div>
              <button className="prio-clear" onClick={() => onQuickClear(s.id)}>
                {cleared ? '↺' : '✓'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
