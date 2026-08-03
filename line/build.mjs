/* =====================================================================
 * line/design/*.html から、LINEにアップロードする画像と
 * 印刷用のPDFを書き出すスクリプト。
 * ---------------------------------------------------------------------
 *   npm run line:build
 *
 * 出来上がったものは line/out/ に入ります。
 * 生成済みのファイルはリポジトリに入っているので、
 * デザインを変えたときだけ実行すれば大丈夫です。
 *
 * 追加のパッケージは要りません（npm install も不要です）。
 * パソコンに入っている Chrome / Chromium をそのまま使います。
 * ===================================================================== */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat, rm, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.join(HERE, 'design');
const OUT = path.join(HERE, 'out');

/** LINEのリッチメニュー画像は 1MB 以下という決まりがあります */
const RICHMENU_MAX_BYTES = 1024 * 1024;

/** 書き出すもの一覧。ここに1行足せば対象が増えます。 */
const TARGETS = [
  // --- LINEにアップロードする画像 -----------------------------------
  { file: 'richmenu-winter.html', out: 'richmenu-winter.png', mode: 'png', width: 2500, height: 1686, limit: RICHMENU_MAX_BYTES },
  { file: 'richmenu-summer.html', out: 'richmenu-summer.png', mode: 'png', width: 2500, height: 1686, limit: RICHMENU_MAX_BYTES },
  { file: 'cover.html', out: 'cover.png', mode: 'png', width: 1080, height: 878 },
  // --- 印刷して現場で使うもの（page は mm。用紙サイズの確認に使います） ---
  { file: 'pop-a5-friend.html', out: 'pop-a5-friend.pdf', mode: 'pdf', page: [148, 210] },
  { file: 'pop-a4-schedule.html', out: 'pop-a4-schedule.pdf', mode: 'pdf', page: [210, 297] },
  { file: 'card-a4-10up.html', out: 'card-a4-10up.pdf', mode: 'pdf', page: [210, 297] },
  { file: 'pop-a6-shopcard.html', out: 'pop-a6-shopcard.pdf', mode: 'pdf', page: [105, 148] },
];

/** Chrome / Chromium を探します。CHROME_PATH を指定すればそれを優先します。 */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/opt/pw-browsers/chromium', // Claude Code の実行環境
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      'Chrome が見つかりませんでした。\n' +
        'Google Chrome をインストールするか、CHROME_PATH に実行ファイルの場所を指定してください。\n' +
        '  例) CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run line:build',
    );
  }
  return found;
}

/**
 * Chrome をヘッドレスで動かします。
 * --user-data-dir を毎回変えるのは、すでにChromeを開いている人の
 * 普段のプロファイルを触らないためです。
 */
async function runChrome(chrome, args, profileDir) {
  await execFileAsync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      // Webフォント（Zen Maru Gothic）の読み込みを待ってから撮ります
      '--virtual-time-budget=8000',
      `--user-data-dir=${profileDir}`,
      ...args,
    ],
    { maxBuffer: 1024 * 1024 * 64 },
  );
}

function humanSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 出来上がったPDFの用紙サイズ（MediaBox）をmmで読み取ります。
 * Chrome は @page の用紙名を一部しか解釈しないので（A6 などは無視されて
 * レターサイズになります）、書き出したあとに必ず実寸を確かめています。
 */
async function readPdf(file) {
  const text = (await readFile(file)).toString('latin1');
  const box = text.match(/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
  const count = text.match(/\/Count\s+(\d+)/);
  const ptToMm = (pt) => (Number(pt) * 25.4) / 72;
  return {
    sizeMm: box ? [ptToMm(box[1]), ptToMm(box[2])] : null,
    pages: count ? Number(count[1]) : null,
  };
}

async function main() {
  const chrome = findChrome();
  console.log(`Chrome: ${chrome}\n`);

  await mkdir(OUT, { recursive: true });
  const profileDir = path.join(OUT, '.chrome-profile');

  let warnings = 0;

  for (const t of TARGETS) {
    const src = path.join(DESIGN, t.file);
    if (!existsSync(src)) {
      console.error(`  × ${t.file} が見つかりません`);
      warnings++;
      continue;
    }

    const dest = path.join(OUT, t.out);
    const url = `file://${src}`;

    if (t.mode === 'png') {
      await runChrome(chrome, [`--screenshot=${dest}`, `--window-size=${t.width},${t.height}`, url], profileDir);
    } else {
      // --print-to-pdf は用紙サイズをHTMLの @page から読み取ります
      await runChrome(chrome, [`--print-to-pdf=${dest}`, '--no-pdf-header-footer', url], profileDir);
    }

    if (!existsSync(dest)) {
      console.error(`  × ${t.out} の書き出しに失敗しました`);
      warnings++;
      continue;
    }

    const { size } = await stat(dest);
    let note = '';
    if (t.limit && size > t.limit) {
      note += `  ⚠ LINEの上限 ${humanSize(t.limit)} を超えています。デザインの色数を減らすか、JPEGに変換してください`;
      warnings++;
    }
    if (t.page) {
      const { sizeMm, pages } = await readPdf(dest);
      const sizeOk = sizeMm && Math.abs(sizeMm[0] - t.page[0]) < 1 && Math.abs(sizeMm[1] - t.page[1]) < 1;
      if (sizeOk) {
        note += `  ${t.page[0]}×${t.page[1]}mm`;
      } else {
        const got = sizeMm ? `${sizeMm[0].toFixed(0)}×${sizeMm[1].toFixed(0)}mm` : '読み取れません';
        note += `  ⚠ 用紙サイズが ${t.page[0]}×${t.page[1]}mm になっていません（${got}）。HTMLの @page を確認してください`;
        warnings++;
      }
      // 2ページ以上になっていたら、文字や写真が1枚に収まっていないということ
      if (pages !== 1) {
        note += `  ⚠ ${pages}ページになりました。文字量か大きさを減らして1枚に収めてください`;
        warnings++;
      }
    }
    console.log(`  ✓ ${t.out.padEnd(24)} ${humanSize(size).padStart(8)}${note}`);
  }

  // 一時プロファイルを片付ける（残しておくと out/ が数十MBに膨らみます）
  await rm(profileDir, { recursive: true, force: true });

  // Chrome が古い書式のスクリーンショットを残すことがあるので掃除しておく
  for (const name of await readdir(OUT)) {
    if (name.startsWith('.com.google.Chrome')) await rm(path.join(OUT, name), { force: true });
  }

  console.log(`\n書き出し先: ${path.relative(process.cwd(), OUT)}/`);
  if (warnings > 0) {
    console.log(`${warnings} 件の警告があります。上のログを確認してください。`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
