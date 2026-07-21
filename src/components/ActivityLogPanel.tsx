// 変更履歴パネル（任意表示）。「妻が 2-1 をクリアにしました」形式。
import type { ActivityLog } from '../types';
import { describeLog } from '../lib/mutations';

interface Props {
  logs: ActivityLog[];
  onClose: () => void;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hm = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `今日 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

export function ActivityLogPanel({ logs, onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div className="log-panel" onClick={(e) => e.stopPropagation()}>
        <h3>📜 みんなの記録</h3>
        {logs.length === 0 ? (
          <p className="log-empty">まだ記録はありません。</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              {describeLog(log)}
              <span className="time">{timeLabel(log.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
