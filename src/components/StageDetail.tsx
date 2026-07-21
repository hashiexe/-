// ステージ詳細シート：クリア切替 / 編集 / 現在地マーカー / 削除。
import { useState } from 'react';
import type { World } from '../types';
import type { DerivedStage } from '../lib/labels';
import type { StageEdit } from '../lib/mutations';

const EMOJI_CHOICES = [
  '🍠', '🏁', '💰', '📋', '🎪', '☕', '🐭', '📱', '🤝', '🧊',
  '📝', '📦', '🎁', '🔁', '📊', '🧮', '🔑', '🏮', '⭐', '🔥',
];

interface Props {
  stage: DerivedStage;
  worlds: World[];
  isCurrent: boolean;
  onToggleStatus: () => void;
  onSave: (edit: StageEdit) => void;
  onDelete: () => void;
  onSetMarker: (on: boolean) => void;
  onClose: () => void;
}

export function StageDetail({
  stage,
  worlds,
  isCurrent,
  onToggleStatus,
  onSave,
  onDelete,
  onSetMarker,
  onClose,
}: Props) {
  const [title, setTitle] = useState(stage.title);
  const [goal, setGoal] = useState(stage.goal);
  const [icon, setIcon] = useState(stage.icon);
  const [worldId, setWorldId] = useState(stage.world_id);
  const [confirmDel, setConfirmDel] = useState(false);

  const cleared = stage.status === 'cleared';

  const save = () => {
    onSave({ title: title.trim() || '（無題）', goal: goal.trim(), icon, world_id: worldId });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>
          {stage.label === 'GOAL' ? 'GOAL' : `STAGE ${stage.label}`} {stage.icon}
        </h2>
        <p className="sub">{cleared ? '✅ クリア済み' : '⬜ 未達成'}</p>

        {/* クリア切替 */}
        <button className={`btn ${cleared ? 'btn-ghost' : 'btn-gold'}`} onClick={onToggleStatus}>
          {cleared ? '未達成に もどす' : 'クリアにする！'}
        </button>

        <div style={{ height: 18 }} />

        {/* 編集フォーム */}
        <div className="field">
          <label>タイトル</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 1日80本つくれる" />
        </div>

        <div className="field">
          <label>目標・達成条件</label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例: 生産目標クリア" />
        </div>

        <div className="field">
          <label>アイコン</label>
          <div className="emoji-row">
            <div className="emoji-preview">{icon}</div>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
          </div>
          <div className="emoji-choices" style={{ marginTop: 8 }}>
            {EMOJI_CHOICES.map((e) => (
              <button key={e} className={e === icon ? 'sel' : ''} onClick={() => setIcon(e)} type="button">
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>所属ワールド</label>
          <select value={worldId} onChange={(e) => setWorldId(e.target.value)}>
            {worlds.map((w, i) => (
              <option key={w.id} value={w.id}>
                {i + 1}. {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={save}>
            ほぞんする
          </button>
          <button className="btn btn-leaf" onClick={() => onSetMarker(!isCurrent)}>
            {isCurrent ? 'いものすけを ここから外す' : 'ここを いまの目標にする'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            とじる
          </button>
          {confirmDel ? (
            <div className="btn-row-2">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>
                やめる
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#b04a3a', boxShadow: '0 4px 0 #7f3327' }}
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                本当に削除
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>
              このステージを削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
