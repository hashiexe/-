// 簡易ガード：共有あいことばで入場し、「夫 / 妻」を選ぶ。
// 厳格な認証ではない（要件どおり）。あいことばは VITE_APP_PASSPHRASE、
// 未設定時は既定値。DB の本格保護は Supabase 側 RLS で行う想定。
import { useCallback, useEffect, useState } from 'react';
import type { Actor } from '../types';

const PASS_KEY = 'tororo-road:pass-ok';
const ACTOR_KEY = 'tororo-road:actor';

const PASSPHRASE = (import.meta.env.VITE_APP_PASSPHRASE as string | undefined) ?? 'oimoya';

export interface Gate {
  unlocked: boolean;
  actor: Actor | null;
  tryUnlock: (input: string) => boolean;
  setActor: (a: Actor) => void;
  signOut: () => void;
}

export function useGate(): Gate {
  const [unlocked, setUnlocked] = useState(false);
  const [actor, setActorState] = useState<Actor | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(PASS_KEY) === '1' || localStorage.getItem(PASS_KEY) === '1') {
      setUnlocked(true);
    }
    const saved = localStorage.getItem(ACTOR_KEY) as Actor | null;
    if (saved === '夫' || saved === '妻') setActorState(saved);
  }, []);

  const tryUnlock = useCallback((input: string) => {
    if (input.trim() === PASSPHRASE) {
      setUnlocked(true);
      localStorage.setItem(PASS_KEY, '1');
      return true;
    }
    return false;
  }, []);

  const setActor = useCallback((a: Actor) => {
    setActorState(a);
    localStorage.setItem(ACTOR_KEY, a);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(PASS_KEY);
    sessionStorage.removeItem(PASS_KEY);
    setUnlocked(false);
  }, []);

  return { unlocked, actor, tryUnlock, setActor, signOut };
}
