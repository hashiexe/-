-- とろりロード — 既存DB用マイグレーション（1回だけ実行）
-- すでに schema.sql で作成・同期済みのプロジェクトに、今回の新機能ぶんを追加します。
-- 進捗データは消えません。Supabase の SQL Editor に貼って Run してください。

-- 1) 新しい列（優先タスク・次回出店）
alter table public.stages    add column if not exists priority boolean not null default false;
alter table public.app_state add column if not exists next_event_date  text;
alter table public.app_state add column if not exists next_event_place text;

-- 2) 新ワールド「商品開発」を World1 の次に差し込む（並び順を振り直し）
insert into public.worlds (id, name, "order") values ('w-dev', '商品開発', 1) on conflict (id) do nothing;
update public.worlds set "order" = 0 where id = 'w1';
update public.worlds set "order" = 2 where id = 'w2';
update public.worlds set "order" = 3 where id = 'w3';
update public.worlds set "order" = 4 where id = 'w4';
update public.worlds set "order" = 5 where id = 'w5';

-- 3) 商品開発ワールドのステージ
insert into public.stages (id, world_id, title, goal, icon, "order", status, kind) values
  ('s-dev1','w-dev','干し芋の開発','定番にする干し芋のレシピ・仕上がりを確定','🍠',0,'todo','normal'),
  ('s-dev2','w-dev','犬用お菓子の開発','わんちゃん向け焼き芋おやつを商品化','🐕',1,'todo','normal')
on conflict (id) do nothing;

-- 4) 「ファンとリピーターづくり」への追加ステージ
insert into public.stages (id, world_id, title, goal, icon, "order", status, kind) values
  ('s3-coffee','w3','仕入れコーヒーの確定','マリアージュに合う豆を決めて仕入れ先を確定','☕',6,'todo','normal'),
  ('s3-mascot','w3','いものすけ（マスコット）の作成','いものすけのイラスト・グッズを用意','🐭',7,'todo','normal'),
  ('s3-sign','w3','赤ちゃん・犬が焼き芋を食べてる看板の作成','ほっこり看板でお店の顔をつくる','🪧',8,'todo','normal'),
  ('s3-game','w3','看板ゲームの作成','看板を使ったミニゲームで集客・話題づくり','🎮',9,'todo','normal')
on conflict (id) do nothing;

-- 5) 貯金ステップ（とろりのお店ワールド、ゴールの手前）
insert into public.stages (id, world_id, title, goal, icon, "order", status, kind) values
  ('s5-save10','w5','貯金10万円','','🐷',3,'todo','normal'),
  ('s5-save30','w5','貯金30万円','','🐷',4,'todo','normal'),
  ('s5-save50','w5','貯金50万円','','🐷',5,'todo','normal'),
  ('s5-save70','w5','貯金70万円','','🐷',6,'todo','normal'),
  ('s5-save100','w5','貯金100万円','開業資金の目標達成','🐷',7,'todo','normal')
on conflict (id) do nothing;

-- 6) 最終ゴールを「実店舗オープン」→「シェアキッチン週1オープン」に置き換え
update public.stages
  set title = 'シェアキッチン週1オープン', goal = 'とろりロードのゴール！', icon = '🍳', "order" = 8
  where id = 's5-goal';

-- 7) 収支計画ステージの文言をシェアキッチン向けに微調整（任意）
update public.stages set title = '収支計画をFIX', goal = 'シェアキッチンの収支計画を確定' where id = 's5-2';
