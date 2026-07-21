// 簡易ガード画面：あいことば入力 →「夫 / 妻」選択。
import { useState } from 'react';
import type { Actor } from '../types';
import type { Gate as GateState } from '../hooks/useGate';
import { Mascot } from './Mascot';

export function Gate({ gate }: { gate: GateState }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  if (!gate.unlocked) {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!gate.tryUnlock(input)) setError('あいことばが ちがうみたい…');
    };
    return (
      <div className="gate">
        <div className="gate-card">
          <Mascot className="badge-mascot" size={72} />
          <h1>とろりロード</h1>
          <p>あいことばを いれてね</p>
          <form onSubmit={submit}>
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder="あいことば"
              autoFocus
            />
            <div className="gate-error">{error}</div>
            <button type="submit" className="btn btn-primary">
              はいる
            </button>
          </form>
        </div>
      </div>
    );
  }

  // あいことば通過後、まだ誰か未選択なら選ばせる
  if (!gate.actor) {
    const pick = (a: Actor) => gate.setActor(a);
    return (
      <div className="gate">
        <div className="gate-card">
          <Mascot className="badge-mascot" size={72} />
          <h1>だれですか？</h1>
          <p>更新した人の記録に つかいます</p>
          <div className="actor-choice">
            <button onClick={() => pick('夫')}>
              <span className="emoji">👨</span>夫
            </button>
            <button onClick={() => pick('妻')}>
              <span className="emoji">👩</span>妻
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
