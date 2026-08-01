// 画面トップの「次回出店」表示＆編集（日付・場所）。夫婦どちらでも編集可。
import { useState } from 'react';

interface Props {
  date: string | null;
  place: string | null;
  onSave: (date: string | null, place: string | null) => void;
}

function formatDate(d: string): string {
  // 'YYYY-MM-DD' → 'M月D日(曜)'
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return d;
  const wd = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()];
  return `${dt.getMonth() + 1}月${dt.getDate()}日(${wd})`;
}

export function NextEventBar({ date, place, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState(date ?? '');
  const [p, setP] = useState(place ?? '');

  const open = () => {
    setD(date ?? '');
    setP(place ?? '');
    setEditing(true);
  };

  const save = () => {
    onSave(d ? d : null, p.trim() ? p.trim() : null);
    setEditing(false);
  };

  const clear = () => {
    onSave(null, null);
    setEditing(false);
  };

  const has = date || place;

  return (
    <>
      <button className="next-event" onClick={open}>
        <span className="ne-cal" aria-hidden>
          📅
        </span>
        <span className="ne-body">
          <span className="ne-label">次回出店</span>
          {has ? (
            <span className="ne-value">
              {date ? formatDate(date) : '日付未定'}
              {place ? ` ／ ${place}` : ''}
            </span>
          ) : (
            <span className="ne-empty">タップして予定を入れよう</span>
          )}
        </span>
        <span className="ne-edit" aria-hidden>
          ✏️
        </span>
      </button>

      {editing && (
        <div className="overlay" onClick={() => setEditing(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>📅 次回出店</h2>
            <p className="sub">日付と場所をいれてね</p>
            <div className="field">
              <label>日付</label>
              <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
            </div>
            <div className="field">
              <label>場所</label>
              <input
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="例: イケ・サンパーク"
              />
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={save}>
                ほぞんする
              </button>
              <button className="btn btn-ghost" onClick={clear}>
                予定をクリア
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
