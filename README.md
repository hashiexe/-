# とろりロード 🍠

**おいも屋 とろり** の開業〜事業拡大までのロードマップを、夫婦2人で共同管理するためのWebアプリ。
スーパーマリオのワールドマップのように、ステージ（1-1, 1-2 …）をクリアして進みます。クリアすると紙吹雪でお祝い。マスコット「いものすけ」が現在地を歩きます。

- **全38ステージ / 5ワールド**（要件定義 §7）を初期データとして収録
- 順不同クリア対応（ロック概念なし。どのステージも最初から達成可能）
- クリア切替 + 紙吹雪＋「STAGE X-Y クリア！」演出
- ステージの編集・追加・削除・**ドラッグ＆ドロップ並び替え**（ワールドまたぎ可）
- 変更履歴ログ（「妻が 2-1 をクリアにしました」）
- スマホ縦画面を最優先、PCでも崩れない
- **運用コスト0円**（Vercel + Supabase の無料枠）

デザインは `design/tororo-road.html`（共有イメージ）を踏襲しています。

---

## 技術構成

| 区分 | 採用 |
|---|---|
| フロント | React 19 + Vite + TypeScript |
| 並び替え | dnd-kit |
| 紙吹雪 | canvas-confetti |
| DB / 同期 | Supabase（PostgreSQL + Realtime）※任意 |
| ホスティング | Vercel（無料サブドメイン） |

### 2つの動作モード

環境変数の有無で自動的に切り替わります。

1. **localStorage モード（既定）** … Supabase 未設定でもそのまま起動。データはその端末のブラウザに保存。まず動かして確認したい時に。
2. **クラウド同期モード** … `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定すると、Supabase に保存し2端末でリアルタイム同期。

---

## セットアップ

```bash
npm install
cp .env.example .env   # あいことば等を設定
npm run dev            # http://localhost:5173
```

初回は「あいことば」を聞かれます（既定 `oimoya`／`.env` の `VITE_APP_PASSPHRASE` で変更）。
その後「夫 / 妻」を選ぶと、以降の更新者として記録されます。

### スクリプト
- `npm run dev` … 開発サーバ
- `npm run build` … 本番ビルド（`dist/`）
- `npm run preview` … ビルド結果のプレビュー
- `npm run lint` … oxlint

---

## クラウド同期（Supabase）の設定

1. [supabase.com](https://supabase.com) で無料プロジェクトを作成。
2. **SQL Editor** に `supabase/schema.sql` を貼り付けて実行
   （テーブル作成 + RLS + 初期38ステージ投入 + Realtime 登録まで一括）。
3. **Settings → API** の `Project URL` と `anon public` キーを `.env` に設定：
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. 再起動すると、ヘッダーに「☁️ 同期中」と出て2端末で同期します。

> 万一 Supabase 側のテーブルが空でも、アプリ初回起動時に38ステージを自動投入します。

### アクセス制限の方式
- **方式A（既定）／あいことば**：フロントの共有あいことばで簡易ガード。DB は匿名キーで読み書き。
  「URLを知っただけの第三者が編集できない」程度の簡易ガード（要件 §3）。導入が最も簡単。
- **方式B／Supabase ログイン**：より堅牢にしたい場合。夫・妻のアカウントを作り、
  RLS を「認証済みのみ許可」に置き換える（`supabase/schema.sql` 末尾のコメント参照）。

---

## デプロイ（Vercel・無料枠）

1. このリポジトリを GitHub に push。
2. [vercel.com](https://vercel.com) で **New Project → Import**。
3. Framework は自動で **Vite** を検出（Build: `npm run build` / Output: `dist`）。
4. **Environment Variables** に `.env` と同じ値を登録
   （`VITE_APP_PASSPHRASE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`）。
5. Deploy。無料サブドメイン（例 `tororo-road.vercel.app`）がそのまま使えます。

> 将来いずれかのサービスが無料枠を縮小しても、有料化せず Netlify / Cloudflare Pages 等へ移行できます。

---

## ディレクトリ

```
src/
  data/seed.ts          初期38ステージ定義
  types.ts              World / Stage / ActivityLog 等
  lib/
    labels.ts           1-1 等のラベルを並び順から自動算出
    mutations.ts        スナップショットへの純粋な変換群
    localBackend.ts     localStorage バックエンド
    supabaseBackend.ts  Supabase バックエンド（Realtime購読）
    createBackend.ts    環境変数でバックエンドを選択
  hooks/
    useGate.ts          あいことば + 夫/妻 の簡易ガード
    useRoadmap.ts       状態管理・同期
  components/           WorldMap / StageNode / StageDetail / Celebration / Gate / ActivityLogPanel / Mascot
supabase/schema.sql     テーブル + RLS + 初期データ
design/tororo-road.html 共有デザインイメージ
```

---

## 費用の方針
原則すべて無料。ホスティング（Vercel）・DB（Supabase）とも無料枠のみ。独自ドメインは取得しません。→ 運用コスト **0円**。
