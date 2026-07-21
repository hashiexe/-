// ステージ1件の見た目（丸ノード + 情報）。並び替えの制御は WorldMap 側。
import { forwardRef } from 'react';
import type { DerivedStage } from '../lib/labels';
import { Mascot } from './Mascot';

interface Props {
  stage: DerivedStage;
  side: 'left' | 'right';
  isCurrent: boolean;
  reorderMode: boolean;
  dragging?: boolean;
  onOpen: () => void;
  onQuickClear: () => void;
  // dnd-kit 用（並び替えモード時のみ付与）
  handleProps?: Record<string, unknown>;
}

export const StageNode = forwardRef<HTMLDivElement, Props>(function StageNode(
  { stage, side, isCurrent, reorderMode, dragging, onOpen, onQuickClear, handleProps },
  ref,
) {
  const cleared = stage.status === 'cleared';
  const isGoal = stage.kind === 'goal';

  const nodeClass = [
    'node',
    cleared ? 'cleared' : '',
    isGoal ? 'goal' : '',
    isCurrent ? 'current' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={`stage ${side} ${dragging ? 'dragging' : ''}`}
      {...(reorderMode ? handleProps : {})}
    >
      <div
        className={nodeClass}
        onClick={reorderMode ? undefined : onOpen}
        role="button"
        aria-label={`STAGE ${stage.label} ${stage.title}`}
      >
        {isCurrent && <Mascot className="mascot-marker" size={34} />}
        <span aria-hidden>{stage.icon}</span>
        {cleared && <div className="check">✓</div>}
        {reorderMode && <span className="drag-handle">⠿ うごかす</span>}
      </div>

      <div className="stage-info">
        <div className="stage-tag">{isGoal ? '🏮 GOAL' : `STAGE ${stage.label}`}</div>
        <div className="stage-title">{stage.title}</div>
        {stage.goal && <span className="stage-goal">{stage.goal}</span>}
        {!reorderMode && !isGoal && (
          <div style={{ marginTop: 6 }}>
            <button className="link-btn" onClick={onQuickClear}>
              {cleared ? '↺ 未達成にもどす' : '✓ クリアにする'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
