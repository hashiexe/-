import type { Backend } from './backend';
import { LocalBackend } from './localBackend';
import { SupabaseBackend } from './supabaseBackend';
import { supabase } from './supabaseClient';

let instance: Backend | null = null;

/** 環境変数に応じて Supabase / localStorage のバックエンドを1つ生成 */
export function getBackend(): Backend {
  if (instance) return instance;
  instance = supabase ? new SupabaseBackend(supabase) : new LocalBackend();
  return instance;
}
