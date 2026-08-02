/* =====================================================================
   お芋やとろり — 画面の組み立て
   content.js の SITE を読んで DOM を作ります。
   ふだんの更新で、このファイルを触る必要はありません。
   ===================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const setText = (sel, text) => {
    const n = $(sel);
    if (n) n.textContent = text || '';
  };

  /* ---------------------------------------------------------------
     写真プレースホルダ：assets/ に画像があれば自動で差し替える
     （無ければイラスト風のグラデーションのまま）
  --------------------------------------------------------------- */
  function tryPhoto(box) {
    const src = box.dataset.photo;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      box.innerHTML = '';
      img.alt = '';
      box.appendChild(img);
    };
    img.src = src;
  }

  /* --------------------------- 日付まわり --------------------------- */
  const DOW = ['日', '月', '火', '水', '木', '金', '土'];
  const parseDate = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const todayStart = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  /* ============================ ヒーロー ============================ */
  function renderHero() {
    document.title = `${SITE.shop.name} | ${SITE.shop.tagline}`;
    setText('#heroLead', SITE.shop.lead);

    const words = [
      SITE.shop.tagline,
      '低温でじっくり',
      'とろける蜜芋',
      SITE.shop.name,
      '週末は公園で',
      'ONLINE STORE OPEN',
    ];
    const track = $('#marquee');
    if (track) {
      const line = words.map((w) => `<span>${esc(w)}</span>`).join('');
      track.innerHTML = line + line; // 半分でループさせるため2回並べる
    }
  }

  /* ============================= ABOUT ============================= */
  function renderAbout() {
    const a = SITE.about;
    setText('#aboutSub', a.subheading);
    setText('#aboutHeading', a.heading);

    const body = $('#aboutBody');
    if (body) body.innerHTML = a.body.map((p) => `<p>${esc(p)}</p>`).join('');

    const ul = $('#points');
    if (!ul) return;
    ul.innerHTML = a.points
      .map(
        (p) => `<li data-reveal>
            <i>${esc(p.icon)}</i>
            <b>${esc(p.title)}</b>
            <p>${esc(p.text)}</p>
          </li>`
      )
      .join('');
  }

  /* ============================== SHOP ============================== */
  function renderShop() {
    const s = SITE.shopSection;
    setText('#shopSub', s.subheading);
    setText('#shopHeading', s.heading);
    setText('#shopLead', s.lead);

    const ul = $('#products');
    if (ul) {
      ul.innerHTML = s.products
        .map((p, i) => {
          const ready = !!p.url;
          const cta = ready
            ? `<a class="btn btn--primary btn--block" href="${esc(p.url)}" target="_blank" rel="noopener">この商品を買う</a>`
            : `<span class="btn btn--block" aria-disabled="true">準備中</span>`;
          return `<li class="product product--${esc(p.theme || 'honey')}" data-reveal style="transition-delay:${i * 70}ms">
              <div class="product__thumb" data-photo="assets/product-${i + 1}.jpg">
                ${p.badge ? `<span class="product__badge">${esc(p.badge)}</span>` : ''}
              </div>
              <div class="product__body">
                <h3 class="product__name">${esc(p.name)}</h3>
                <p class="product__price">${esc(p.price)}</p>
                <p class="product__desc">${esc(p.desc)}</p>
                ${cta}
              </div>
            </li>`;
        })
        .join('');
    }

    const notes = $('#shopNotes');
    if (notes) notes.innerHTML = s.notes.map((n) => `<li>${esc(n)}</li>`).join('');
  }

  /* ============================ SCHEDULE ============================ */
  function renderSchedule() {
    const s = SITE.scheduleSection;
    setText('#schedSub', s.subheading);
    setText('#schedHeading', s.heading);
    setText('#schedLead', s.lead);

    const today = todayStart();
    const upcoming = (s.events || [])
      .map((e) => ({ ...e, _d: parseDate(e.date) }))
      .filter((e) => e._d && e._d >= today)
      .sort((a, b) => a._d - b._d);

    const list = $('#schedule-list');
    if (list) {
      if (!upcoming.length) {
        list.innerHTML =
          '<li class="schedule__empty">次回の出店が決まりしだい、こちらとLINEでお知らせします。</li>';
      } else {
        list.innerHTML = upcoming
          .map((e, i) => {
            const d = e._d;
            const dow = DOW[d.getDay()];
            const dowCls = d.getDay() === 0 ? ' dow--sun' : d.getDay() === 6 ? ' dow--sat' : '';
            return `<li class="${i === 0 ? 'is-next' : ''}" data-reveal style="transition-delay:${i * 60}ms">
                <div class="sched__date">
                  <em>${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}</em>
                  <b>${d.getDate()}</b>
                  <i class="${dowCls}">${dow}曜</i>
                </div>
                <div class="sched__info">
                  ${i === 0 ? '<span class="sched__next-tag">NEXT</span>' : ''}
                  <b>${esc(e.place)}</b>
                  <span>${esc(e.area)}</span><span>${esc(e.time)}</span>
                  ${e.note ? `<p>${esc(e.note)}</p>` : ''}
                </div>
              </li>`;
          })
          .join('');
      }
    }

    // ヒーローの「次回出店」バッジ
    const badge = $('#heroNext');
    if (badge && upcoming.length) {
      const n = upcoming[0];
      badge.innerHTML =
        `<span class="tag">NEXT</span>` +
        `<span>${n._d.getMonth() + 1}/${n._d.getDate()}（${DOW[n._d.getDay()]}）` +
        `<b>${esc(n.place)}</b></span>`;
    }

    // LINE CTA（URLが設定されているときだけ出す）
    const cta = $('#lineCta');
    if (cta && SITE.links.line) {
      cta.hidden = false;
      $('#lineBtn').href = SITE.links.line;
    }
  }

  /* ============================== HOWTO ============================= */
  function renderHowto() {
    const h = SITE.howto;
    setText('#howtoSub', h.subheading);
    setText('#howtoHeading', h.heading);
    const ul = $('#howto-list');
    if (!ul) return;
    ul.innerHTML = h.steps
      .map(
        (s, i) => `<li data-reveal style="transition-delay:${i * 60}ms">
            <span class="howto__num">0${i + 1}</span>
            <b>${esc(s.title)}</b>
            <p>${esc(s.text)}</p>
          </li>`
      )
      .join('');
  }

  /* ============================== OWNER ============================= */
  function renderOwner() {
    const o = SITE.owner;
    setText('#ownerSub', o.subheading);
    setText('#ownerHeading', o.heading);
    setText('#ownerName', o.name);
    setText('#ownerRole', o.role);
    const body = $('#ownerBody');
    if (body) body.innerHTML = o.body.map((p) => `<p>${esc(p)}</p>`).join('');
  }

  /* =============================== FAQ ============================== */
  function renderFaq() {
    const f = SITE.faq;
    setText('#faqSub', f.subheading);
    setText('#faqHeading', f.heading);
    const box = $('#faq-list');
    if (!box) return;
    box.innerHTML = f.items
      .map(
        (it) => `<details>
            <summary>${esc(it.q)}</summary>
            <p>${esc(it.a)}</p>
          </details>`
      )
      .join('');
  }

  /* ============================== LEGAL ============================= */
  function renderLegal() {
    setText('#legalHeading', SITE.legal.heading);
    const rows = $('#legalRows');
    if (rows) {
      rows.innerHTML = SITE.legal.rows
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join('');
    }
    setText('#privacyHeading', SITE.privacy.heading);
    const pb = $('#privacyBody');
    if (pb) pb.innerHTML = SITE.privacy.body.map((p) => `<p>${esc(p)}</p>`).join('');
  }

  /* ============================= FOOTER ============================= */
  function renderFooter() {
    setText('#footerCatch', SITE.shop.catch);
    setText('#year', new Date().getFullYear());

    const defs = [
      ['line', 'LINE公式アカウント'],
      ['instagram', 'Instagram'],
      ['x', 'X'],
    ];
    const ul = $('#social');
    if (!ul) return;
    const items = defs
      .filter(([k]) => SITE.links[k])
      .map(
        ([k, label]) =>
          `<li><a href="${esc(SITE.links[k])}" target="_blank" rel="noopener">${esc(label)}</a></li>`
      );
    if (SITE.links.email && !/TODO/.test(SITE.links.email)) {
      items.push(
        `<li><a href="mailto:${esc(SITE.links.email)}">${esc(SITE.links.email)}</a></li>`
      );
    }
    ul.innerHTML = items.join('');
  }

  /* ============================ UI 挙動 ============================= */
  function initUI() {
    // 写真の自動差し替え
    document.querySelectorAll('[data-photo]').forEach(tryPhoto);

    // スクロールで出現
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n));

    // ヘッダーの影 / スマホ固定CTA
    const header = $('#header');
    const dock = $('#dock');
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-stuck', y > 12);
      if (dock) dock.classList.toggle('is-on', y > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ハンバーガーメニュー
    const burger = $('#burger');
    const nav = $('.header__nav');
    if (burger && nav) {
      burger.addEventListener('click', () => {
        const open = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!open));
        burger.setAttribute('aria-label', open ? 'メニューを開く' : 'メニューを閉じる');
        nav.classList.toggle('is-open', !open);
      });
      nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          burger.setAttribute('aria-expanded', 'false');
          nav.classList.remove('is-open');
        }
      });
    }
  }

  /* ============================== 起動 ============================== */
  function boot() {
    if (typeof SITE === 'undefined') {
      console.error('content.js が読み込まれていません');
      return;
    }
    renderHero();
    renderAbout();
    renderShop();
    renderSchedule();
    renderHowto();
    renderOwner();
    renderFaq();
    renderLegal();
    renderFooter();
    initUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
