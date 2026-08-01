-- とろりロード — Supabase スキーマ + 初期データ投入
-- Supabase の SQL Editor に貼り付けて実行してください。無料枠で動作します。
-- ※すでに古い版で作成済みの場合は、これではなく supabase/migration-2.sql を実行してください。

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
  priority    boolean not null default false, -- 優先タスク
  cleared_at  timestamptz,
  updated_by  text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id          text primary key,
  stage_id    text,
  stage_label text not null default '-',
  stage_title text not null default '',
  action      text not null,
  actor       text not null,
  created_at  timestamptz not null default now()
);

-- 現在地マーカー・次回出店などアプリ全体の共有状態（単一行 id=1）
create table if not exists public.app_state (
  id                int primary key default 1,
  current_stage_id  text,
  next_event_date   text,
  next_event_place  text
);

alter publication supabase_realtime add table public.worlds;
alter publication supabase_realtime add table public.stages;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.app_state;

-- ========== RLS（あいことば方式＝匿名キーで読み書き） ==========
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

-- ========== 初期データ ==========
insert into public.worlds (id, name, "order") values
  ('w1', '焼き芋づくりを極める', 0),
  ('w-dev', '商品開発', 1),
  ('w2', 'はじめての黒字出店', 2),
  ('w3', 'ファンとリピーターづくり', 3),
  ('w4', 'おうちに届ける', 4),
  ('w5', 'とろりのお店', 5)
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
  ('s-dev1','w-dev','干し芋の開発','定番にする干し芋のレシピ・仕上がりを確定','🍠',0,'todo','normal'),
  ('s-dev2','w-dev','犬用お菓子の開発','わんちゃん向け焼き芋おやつを商品化','🐕',1,'todo','normal'),
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
  ('s3-coffee','w3','仕入れコーヒーの確定','マリアージュに合う豆を決めて仕入れ先を確定','☕',6,'todo','normal'),
  ('s3-mascot','w3','いものすけ（マスコット）の作成','いものすけのイラスト・グッズを用意','🐭',7,'todo','normal'),
  ('s3-sign','w3','赤ちゃん・犬が焼き芋を食べてる看板の作成','ほっこり看板でお店の顔をつくる','🪧',8,'todo','normal'),
  ('s3-game','w3','看板ゲームの作成','看板を使ったミニゲームで集客・話題づくり','🎮',9,'todo','normal'),
  ('s4-1','w4','商品ページを作る','冷凍焼き芋の魅力（無添加・家族で・ストック可）を言語化','📝',0,'todo','normal'),
  ('s4-2','w4','ECサイトを公開する','自社サイトをリリース','🏁',1,'todo','normal'),
  ('s4-3','w4','クール便の発送体制を作る','梱包・送料設定を確定','📦',2,'todo','normal'),
  ('s4-4','w4','EC初受注をこなす','通販での初めての1件','🎁',3,'todo','normal'),
  ('s4-5','w4','リピート通販が入る','EC経由の再注文が発生','🔁',4,'todo','normal'),
  ('s4-6','w4','月間EC販売の目標達成','','🏁',5,'todo','normal'),
  ('s5-1','w5','出店データをまとめる','マルシェ・ECの実績を集計','📊',0,'todo','normal'),
  ('s5-2','w5','収支計画をFIX','シェアキッチンの収支計画を確定','🧮',1,'todo','normal'),
  ('s5-3','w5','物件・資金のあてをつける','','🔑',2,'todo','normal'),
  ('s5-save10','w5','貯金10万円','','🐷',3,'todo','normal'),
  ('s5-save30','w5','貯金30万円','','🐷',4,'todo','normal'),
  ('s5-save50','w5','貯金50万円','','🐷',5,'todo','normal'),
  ('s5-save70','w5','貯金70万円','','🐷',6,'todo','normal'),
  ('s5-save100','w5','貯金100万円','開業資金の目標達成','🐷',7,'todo','normal'),
  ('s5-goal','w5','シェアキッチン週1オープン','とろりロードのゴール！','🍳',8,'todo','goal')
on conflict (id) do nothing;

insert into public.app_state (id, current_stage_id) values (1, 's1-1')
on conflict (id) do nothing;
