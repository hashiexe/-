-- とろりロード — Supabase スキーマ + 初期38ステージ投入
-- Supabase の SQL Editor に貼り付けて実行してください。
-- 無料枠（Free プラン）の範囲で動作します。

-- ========== テーブル ==========

create table if not exists public.worlds (
  id    text primary key,
  name  text not null,
  "order" int  not null default 0
);

create table if not exists public.stages (
  id          text primary key,
  world_id    text not null references public.worlds(id) on delete cascade,
  title       text not null default '',
  goal        text not null default '',
  icon        text not null default '🍠',
  "order"     int  not null default 0,
  status      text not null default 'todo',   -- 'todo' | 'cleared'
  kind        text not null default 'normal', -- 'normal' | 'goal'
  cleared_at  timestamptz,
  updated_by  text,                           -- '夫' | '妻'
  updated_at  timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id          text primary key,
  stage_id    text,
  stage_label text not null default '-',
  stage_title text not null default '',
  action      text not null,  -- cleared/reverted/edited/added/deleted/moved/renamed_world/marker
  actor       text not null,  -- '夫' | '妻'
  created_at  timestamptz not null default now()
);

-- 現在地マーカーなどアプリ全体の共有状態（単一行 id=1）
create table if not exists public.app_state (
  id                int primary key default 1,
  current_stage_id  text
);

-- リアルタイム購読の対象に含める
alter publication supabase_realtime add table public.worlds;
alter publication supabase_realtime add table public.stages;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.app_state;

-- ========== RLS（簡易ガード） ==========
-- 方式A（既定・あいことば方式）：匿名キーで読み書きを許可する。
--   URL を知っただけの第三者からの保護はフロントの「あいことば」で行う。
--   より堅牢にしたい場合は方式Bへ（README 参照）。
alter table public.worlds        enable row level security;
alter table public.stages        enable row level security;
alter table public.activity_logs enable row level security;
alter table public.app_state     enable row level security;

create policy "anon read worlds"  on public.worlds        for select using (true);
create policy "anon write worlds" on public.worlds        for all    using (true) with check (true);
create policy "anon read stages"  on public.stages        for select using (true);
create policy "anon write stages" on public.stages        for all    using (true) with check (true);
create policy "anon read logs"    on public.activity_logs for select using (true);
create policy "anon write logs"   on public.activity_logs for all    using (true) with check (true);
create policy "anon read state"   on public.app_state     for select using (true);
create policy "anon write state"  on public.app_state     for all    using (true) with check (true);

-- 方式B（堅牢・Supabase ログイン方式）にする場合は、上の8つの policy を消して
-- 代わりに以下のように「認証済みのみ許可」に置き換える（夫・妻のアカウントを作成しておく）：
--   create policy "auth all worlds" on public.worlds for all
--     using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
--   （stages / activity_logs / app_state も同様）

-- ========== 初期データ（全38ステージ） ==========

insert into public.worlds (id, name, "order") values
  ('w1', '焼き芋づくりを極める', 0),
  ('w2', 'はじめての黒字出店', 1),
  ('w3', 'ファンとリピーターづくり', 2),
  ('w4', 'おうちに届ける', 3),
  ('w5', 'とろりのお店', 4)
on conflict (id) do nothing;

insert into public.stages (id, world_id, title, goal, icon, "order", status, kind) values
  ('s1-1','w1','定番の味を決める','基準レシピ（無水鍋の焼き時間・温度）を確定','🍠',0,'todo','normal'),
  ('s1-2','w1','1日20本つくれる','','🍠',1,'todo','normal'),
  ('s1-3','w1','1日40本つくれる','','🍠',2,'todo','normal'),
  ('s1-4','w1','1日60本つくれる','','🍠',3,'todo','normal'),
  ('s1-5','w1','1日80本つくれる','生産目標クリア','🏁',4,'todo','normal'),
  ('s1-6','w1','冷凍ストックを作れる','家庭用冷凍庫で冷凍焼き芋を安定生産','🧊',5,'todo','normal'),
  ('s1-7','w1','1日100本つくれる','','🍠',6,'todo','normal'),
  ('s1-8','w1','1日120本つくれる','','🍠',7,'todo','normal'),
  ('s1-9','w1','1日140本つくれる','','🍠',8,'todo','normal'),
  ('s1-10','w1','1日160本つくれる','','🍠',9,'todo','normal'),
  ('s1-11','w1','1日180本つくれる','','🍠',10,'todo','normal'),
  ('s1-12','w1','1日200本つくれる','生産力MAXクリア','🏁',11,'todo','normal'),
  ('s2-1','w2','出店の持ち物を揃える','什器・釣銭・のぼり等のチェックリスト完成','📋',0,'todo','normal'),
  ('s2-2','w2','初出店をやりきる','イケ・サンパークに1回出店（完走が目標）','🎪',1,'todo','normal'),
  ('s2-3','w2','1出店で30本売れる','','💰',2,'todo','normal'),
  ('s2-4','w2','1出店で50本売れる','','💰',3,'todo','normal'),
  ('s2-5','w2','1出店で利益5,000円','','💰',4,'todo','normal'),
  ('s2-6','w2','1出店で利益10,000円','黒字化の大目標クリア','🏁',5,'todo','normal'),
  ('s2-7','w2','1出店で利益15,000円','','💰',6,'todo','normal'),
  ('s2-8','w2','1出店で利益20,000円','','💰',7,'todo','normal'),
  ('s2-9','w2','1出店で利益25,000円','','💰',8,'todo','normal'),
  ('s2-10','w2','1出店で利益30,000円','出店利益の大目標クリア','🏁',9,'todo','normal'),
  ('s3-1','w3','いものすけを看板にする','キャラPOP・パッケージで世界観を統一','🐭',0,'todo','normal'),
  ('s3-2','w3','マリアージュセットを始める','焼き芋＋コーヒーの提供開始','☕',1,'todo','normal'),
  ('s3-3','w3','セットが5人に1人売れる','客単価アップ達成','☕',2,'todo','normal'),
  ('s3-4','w3','SNSを開設する','出店告知の発信チャネルを作る','📱',3,'todo','normal'),
  ('s3-5','w3','リピーターに再会する','「前も買ったよ」のお客さんが現れる','🤝',4,'todo','normal'),
  ('s3-6','w3','月4回の定期出店','出店ペースを確立','🏁',5,'todo','normal'),
  ('s4-1','w4','商品ページを作る','冷凍焼き芋の魅力（無添加・家族で・ストック可）を言語化','📝',0,'todo','normal'),
  ('s4-2','w4','ECサイトを公開する','自社サイトをリリース','🏁',1,'todo','normal'),
  ('s4-3','w4','クール便の発送体制を作る','梱包・送料設定を確定','📦',2,'todo','normal'),
  ('s4-4','w4','EC初受注をこなす','通販での初めての1件','🎁',3,'todo','normal'),
  ('s4-5','w4','リピート通販が入る','EC経由の再注文が発生','🔁',4,'todo','normal'),
  ('s4-6','w4','月間EC販売の目標達成','','🏁',5,'todo','normal'),
  ('s5-1','w5','出店データをまとめる','マルシェ・ECの実績を集計','📊',0,'todo','normal'),
  ('s5-2','w5','実店舗の収支計画をFIX','','🧮',1,'todo','normal'),
  ('s5-3','w5','物件・資金のあてをつける','','🔑',2,'todo','normal'),
  ('s5-goal','w5','実店舗オープン','とろりロードのゴール！','🏮',3,'todo','goal')
on conflict (id) do nothing;

insert into public.app_state (id, current_stage_id) values (1, 's1-1')
on conflict (id) do nothing;
