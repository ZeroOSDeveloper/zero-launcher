(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = 2 * Math.PI * 140;
  const LOADERS = { vanilla: 'Vanilla', fabric: 'Fabric', forge: 'Forge', neoforge: 'NeoForge' };
  const { LANGS, D } = window.I18N_DATA;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const S = {
    cfg: {},
    loader: 'vanilla',
    mc: null,
    list: [],
    filters: { release: true, snapshot: false, old: false },
    q: '',
    phase: 'idle', // idle | busy | running
    logText: '',
    online: null,
    ms: { loggedIn: false, name: null },
    mr: { type: 'mod', mode: 'browse', q: '', sort: 'relevance', offset: 0, total: 0, items: [], installed: [], upd: [], loading: false, error: null, key: '', token: 0, updTok: 0, busy: false }
  };

  /* ================= Dil ================= */
  let LANG = 'en';
  const t = (k, v) => {
    let s = (D[LANG] && D[LANG][k]) ?? D.en[k] ?? k;
    if (typeof s === 'string' && v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] !== undefined ? v[n] : m));
    return s;
  };
  const tl = (k) => (D[LANG] && Array.isArray(D[LANG][k]) ? D[LANG][k] : D.en[k]) || [];

  function applyI18n() {
    document.documentElement.lang = LANG;
    $$('[data-i18n]').forEach((e) => (e.textContent = t(e.dataset.i18n)));
    $$('[data-i18n-ph]').forEach((e) => (e.placeholder = t(e.dataset.i18nPh)));
    $$('[data-i18n-title]').forEach((e) => {
      e.title = t(e.dataset.i18nTitle);
      e.setAttribute('aria-label', e.title);
    });
  }

  /* ================= Yardımcılar ================= */
  let toastT;
  function toast(msg, err = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 4600);
  }
  const save = (patch) => { Object.assign(S.cfg, patch); return zero.setSettings(patch); };

  function log(text) {
    S.logText += text;
    if (S.logText.length > 400000) S.logText = S.logText.slice(-300000);
    const el = $('#log');
    const stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    el.textContent = S.logText;
    if (stick) el.scrollTop = el.scrollHeight;
  }

  function renderNet() {
    const net = $('#net');
    if (S.online === null) { net.className = 'net'; $('#netText').textContent = t('net.check'); return; }
    net.className = 'net ' + (S.online ? 'on' : 'off');
    $('#netText').textContent = S.online ? t('net.on') : t('net.off');
  }

  /* ================= Ana sayfa yazısı ================= */
  let heroI = Math.floor(Math.random() * 5);
  let heroTimer;
  function setHero(h, s, fade = true) {
    const box = $('#heroText');
    const apply = () => { $('#heroH').textContent = h; $('#heroS').textContent = s; box.classList.remove('swap'); };
    if (!fade) return apply();
    box.classList.add('swap');
    setTimeout(apply, 280);
  }
  function heroIdle(fade) {
    const H = tl('hero.h'), Sx = tl('hero.s');
    if (!H.length) return;
    const i = heroI++ % H.length;
    setHero(H[i], Sx[i], fade);
  }
  function startHeroLoop() {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      if (S.phase === 'idle' && !document.hidden && $('#view-play').classList.contains('active')) heroIdle(true);
    }, 8000);
  }

  /* ================= Halka / oyna ================= */
  function subLabel() { $('#playSub').textContent = S.mc ? `${S.mc} ${LOADERS[S.loader]}` : t('play.pick'); }
  function setArc(pct) { $('#arc').style.strokeDashoffset = String(C * (1 - pct / 100)); }

  function setPhase(p) {
    S.phase = p;
    $('#ringWrap').className = 'ring-wrap ' + p;
    $('#loaders').classList.toggle('locked', p !== 'idle');
    if (p === 'idle') {
      $('#playLabel').textContent = t('play.btn');
      setArc(0);
      subLabel();
      heroIdle(false);
    } else if (p === 'busy') {
      setHero(t('hero.busyH'), pick(tl('quips.busy')), false);
    } else if (p === 'running') {
      $('#playLabel').textContent = t('play.running');
      $('#playSub').textContent = t('play.stop');
      setHero(t('hero.runH'), t('play.enjoy'), false);
    }
  }

  function syncNick() {
    const nick = $('#nick');
    const msMode = S.cfg.playMode === 'microsoft' && S.ms.loggedIn;
    nick.readOnly = msMode;
    nick.value = msMode ? S.ms.name : S.cfg.username || 'Player';
  }

  async function onPlay() {
    if (S.phase === 'running') { await zero.stop(); return; }
    if (S.phase === 'busy') return;
    if (S.cfg.playMode === 'microsoft') {
      if (!S.ms.loggedIn) { toast(t('ms.needSignin'), true); return; }
    } else if (!/^[A-Za-z0-9_]{3,16}$/.test($('#nick').value.trim())) {
      const f = $('#nick').closest('.field');
      f.classList.remove('bad'); void f.offsetWidth; f.classList.add('bad');
      toast(t('play.badNick'), true);
      return;
    }
    if (!S.mc) { toast(t('play.noVersion'), true); return; }
    setPhase('busy');
    $('#playLabel').textContent = '0%';
    log(`\n=== ${S.mc} ${LOADERS[S.loader]} ===\n`);
    const res = await zero.play({ mc: S.mc, loader: S.loader, username: $('#nick').value.trim(), ram: +$('#ram').value });
    if (!res.ok) {
      setPhase('idle');
      toast(res.error || t('play.fail'), true);
    }
  }

  /* ================= Sürüm listesi ================= */
  function renderList() {
    const q = S.q.trim().toLowerCase();
    const ul = $('#vList');
    const items = S.list.filter((v) => {
      const group = v.type === 'release' ? 'release' : v.type === 'snapshot' ? 'snapshot' : 'old';
      if (!S.filters[group] && v.id !== S.mc) return false;
      return !q || v.id.toLowerCase().includes(q);
    });
    $('#vCount').textContent = items.length ? t('ver.count', { n: items.length }) : '';
    if (!items.length) { ul.innerHTML = `<li class="empty">${esc(t('ver.empty'))}</li>`; return; }
    ul.innerHTML = items
      .map(
        (v) =>
          `<li data-id="${esc(v.id)}" class="${v.id === S.mc ? 'sel' : ''}"><span class="got ${v.installed ? 'y' : ''}" title="${esc(v.installed ? t('ver.got') : t('ver.not'))}"></span>${esc(v.id)}<span class="tag">${esc(t('tag.' + v.type))}</span></li>`
      )
      .join('');
    const sel = $('li.sel', ul);
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  async function loadVersions() {
    $('#vList').innerHTML = `<li class="empty">${esc(t('ver.loading'))}</li>`;
    const res = await zero.listVersions(S.loader);
    S.list = res.versions || [];
    S.online = !!res.online;
    renderNet();
    const ids = new Set(S.list.map((v) => v.id));
    if (!S.mc || !ids.has(S.mc)) {
      const first = S.list.find((v) => v.type === 'release') || S.list[0];
      S.mc = first ? first.id : null;
    }
    if (S.phase === 'idle') subLabel();
    renderList();
  }

  /* ================= Modrinth ================= */
  const nf = () => new Intl.NumberFormat(LANG, { notation: 'compact', maximumFractionDigits: 1 });
  const mrNeedsLoader = () => S.mr.type === 'mod' && S.loader === 'vanilla';
  const mrKey = () => `${S.mc}|${S.loader}|${S.mr.type}`;
  const mrTypeUpd = () => S.mr.upd.filter((u) => u.type === S.mr.type);

  function iconHtml(icon, title) {
    return icon
      ? `<img class="mr-ico" src="${esc(icon)}" alt="" loading="lazy" data-letter="${esc((title || '?')[0].toUpperCase())}">`
      : `<div class="mr-ico">${esc((title || '?')[0].toUpperCase())}</div>`;
  }

  function mrControls() {
    const m = S.mr;
    const browse = m.mode === 'browse';
    $('#mrSearch').hidden = !browse;
    $('#mrSort').hidden = !browse;
    const n = mrTypeUpd().length;
    const b = $('#mrUpdBadge');
    b.hidden = n === 0;
    b.textContent = String(n);
    const btn = $('#mrUpdAll');
    btn.hidden = browse || n === 0;
    btn.textContent = t('mods.updateAll', { n });
    btn.disabled = m.busy;
    $('#mrTarget').textContent = t('mods.target', { v: `${S.mc || '—'} ${LOADERS[S.loader]}` });
  }

  function mrState(html) { return `<div class="mr-state">${html}</div>`; }

  function mrRender() {
    mrControls();
    const el = $('#mrList');
    const m = S.mr;
    if (mrNeedsLoader()) {
      el.innerHTML = mrState(`<span>${esc(t('mods.needLoader'))}</span><button class="solid" data-act="goplay">${esc(t('mods.goPlay'))}</button>`);
      return;
    }
    if (m.mode === 'installed') {
      if (!m.installed.length) { el.innerHTML = mrState(esc(t('mods.emptyInst'))); return; }
      const upd = Object.fromEntries(mrTypeUpd().map((u) => [u.projectId, u.versionNumber]));
      el.innerHTML = m.installed
        .map((i) => {
          const nv = i.projectId && upd[i.projectId];
          return `<div class="mr-item">${iconHtml(i.icon, i.title)}
            <div class="mr-main">
              <div class="mr-title">${esc(i.title)}${i.version ? `<small>${esc(i.version)}</small>` : ''}${nv ? `<span class="badge">${esc(t('mods.updAvail', { v: nv }))}</span>` : ''}</div>
              <div class="mr-desc">${esc(i.desc || (i.manual ? t('mods.manual') : ''))}</div>
            </div>
            <div class="mr-btns">
              ${nv ? `<button class="solid" data-act="update" data-id="${esc(i.projectId)}">${esc(t('mods.update'))}</button>` : ''}
              <button class="ghost" data-act="remove" data-id="${esc(i.projectId || '')}" data-file="${esc(i.filename)}">${esc(t('mods.remove'))}</button>
            </div></div>`;
        })
        .join('');
      return;
    }
    // Gözat
    if (!m.items.length) {
      el.innerHTML = m.loading ? mrState('…') : mrState(esc(m.error ? t('mods.offline') : t('mods.none')));
      return;
    }
    const have = new Set(m.installed.map((i) => i.projectId));
    const fmt = nf();
    let html = m.items
      .map(
        (h) => `<div class="mr-item">${iconHtml(h.icon, h.title)}
          <div class="mr-main">
            <div class="mr-title">${esc(h.title)}<small>${esc(t('mods.by', { a: h.author }))}</small></div>
            <div class="mr-desc">${esc(h.desc)}</div>
            <div class="mr-meta">${esc(t('mods.dl', { n: fmt.format(h.downloads) }))}</div>
          </div>
          <div class="mr-btns">${
            have.has(h.id)
              ? `<button class="solid" disabled>${esc(t('mods.has'))}</button>`
              : `<button class="solid" data-act="install" data-id="${esc(h.id)}" data-title="${esc(h.title)}">${esc(t('mods.install'))}</button>`
          }</div></div>`
      )
      .join('');
    if (m.loading) html += mrState('…');
    else if (m.items.length < m.total) html += `<button class="ghost mr-more" data-act="more">${esc(t('mods.more'))}</button>`;
    if (m.type === 'shader') html += `<p class="sub" style="text-align:center">${esc(t('mods.shaderNote'))}</p>`;
    el.innerHTML = html;
  }

  async function mrLoadInstalled() {
    if (!S.mc) { S.mr.installed = []; return; }
    const r = await zero.mrInstalled({ mc: S.mc, loader: S.loader, type: S.mr.type });
    S.mr.installed = r.ok ? r.items : [];
  }

  async function mrCheckUpdates() {
    const m = S.mr;
    const tok = ++m.updTok;
    if (!S.mc || !m.installed.some((i) => i.projectId)) { m.upd = []; mrControls(); return; }
    const r = await zero.mrUpdates({ mc: S.mc, loader: S.loader });
    if (tok !== m.updTok) return;
    m.upd = r.ok ? r.updates : [];
    mrRender();
  }

  async function mrSearch(reset) {
    const m = S.mr;
    if (mrNeedsLoader() || !S.mc) { mrRender(); return; }
    if (reset) { m.offset = 0; m.items = []; }
    const tok = ++m.token;
    m.loading = true;
    mrRender();
    const r = await zero.mrSearch({ query: m.q, type: m.type, mc: S.mc, loader: S.loader, sort: m.sort, offset: m.offset });
    if (tok !== m.token) return;
    m.loading = false;
    if (r.ok) { m.error = null; m.total = r.total; m.items = m.items.concat(r.hits); m.offset = m.items.length; }
    else m.error = r.error || 'error';
    mrRender();
  }

  async function mrEnter(force) {
    const key = mrKey();
    if (!force && S.mr.key === key) { mrControls(); return; }
    Object.assign(S.mr, { key, items: [], offset: 0, total: 0, upd: [], error: null });
    await mrLoadInstalled();
    if (S.mr.mode === 'browse') await mrSearch(true);
    else { mrRender(); mrCheckUpdates(); }
  }

  async function mrInstallOne(projectId, title, btn) {
    if (btn) { btn.disabled = true; btn.textContent = t('mods.installing'); }
    const r = await zero.mrInstall({ projectId, type: S.mr.type, mc: S.mc, loader: S.loader });
    if (!r.ok) { toast(r.error || 'Error', true); if (btn) { btn.disabled = false; btn.textContent = t('mods.install'); } return false; }
    const deps = r.done.length - 1;
    const name = title || r.done[0].title;
    toast(deps > 0 ? t('mods.doneDeps', { name, n: deps }) : t('mods.done', { name }));
    return true;
  }

  async function mrUpdateAll() {
    const m = S.mr;
    const list = mrTypeUpd();
    if (!list.length || m.busy) return;
    m.busy = true; mrControls();
    let n = 0;
    for (const u of list) {
      const r = await zero.mrInstall({ projectId: u.projectId, type: u.type, mc: S.mc, loader: S.loader });
      if (r.ok) n++; else toast(r.error, true);
    }
    m.busy = false;
    if (n) toast(t('mods.updated', { n }));
    await mrLoadInstalled();
    await mrCheckUpdates();
    mrRender();
  }

  /* ================= Görünüm (tema) ================= */
  const hex2rgb = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
    const n = m ? parseInt(m[1], 16) : 0x7de2d1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  function applyAppearance() {
    const c = S.cfg;
    const b = document.body;
    b.dataset.theme = c.theme || 'obsidian';
    if (c.accentMode === 'custom') {
      const [r, g, bl] = hex2rgb(c.accentColor);
      b.style.setProperty('--accent', c.accentColor);
      b.style.setProperty('--accent-rgb', `${r}, ${g}, ${bl}`);
      b.style.setProperty('--on-accent', (0.299 * r + 0.587 * g + 0.114 * bl) / 255 > 0.6 ? '#0a0914' : '#ffffff');
      b.dataset.accent = 'custom';
    } else {
      ['--accent', '--accent-rgb', '--on-accent'].forEach((p) => b.style.removeProperty(p));
      delete b.dataset.accent;
    }
    $$('#themes .theme').forEach((x) => x.classList.toggle('on', x.dataset.th === (c.theme || 'obsidian')));
    $('#swAccent').setAttribute('aria-checked', String(c.accentMode !== 'custom'));
    $('#swatches').classList.toggle('off', c.accentMode !== 'custom');
    $$('#swatches button').forEach((x) => x.classList.toggle('on', c.accentMode === 'custom' && x.dataset.c === c.accentColor));
    $('#accentPick').value = c.accentColor || '#7de2d1';
    $('#bgBright').value = String(c.bgBright ?? 45);
    $('#bgBrightVal').textContent = (c.bgBright ?? 45) + '%';
    b.style.setProperty('--bg-bright', String((c.bgBright ?? 45) / 100));
  }

  function setBg(dataUrl) {
    const b = document.body;
    if (dataUrl) { b.style.setProperty('--bg-img', `url("${dataUrl}")`); b.classList.add('has-bg'); }
    else { b.style.removeProperty('--bg-img'); b.classList.remove('has-bg'); }
  }

  /* ================= Microsoft hesabı ================= */
  function renderAcct() {
    const on = S.ms.loggedIn;
    $('#acct').classList.toggle('on', on);
    $('#acctName').textContent = on ? t('ms.signed', { n: S.ms.name }) : t('ms.none');
    $('#msIn').hidden = on;
    $('#msOut').hidden = !on;
    $$('#playMode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === (S.cfg.playMode || 'offline')));
    syncNick();
  }

  async function msLogin() {
    if (!S.cfg.msClientId) { toast(t('ms.needId'), true); $('#clientId').focus(); return; }
    $('#msCode').textContent = '…';
    $('#msModal').hidden = false;
    const off = zero.ms.onCode(({ userCode }) => { $('#msCode').textContent = userCode; });
    const r = await zero.ms.login();
    off();
    $('#msModal').hidden = true;
    if (r.ok) {
      S.ms = { loggedIn: true, name: r.name };
      renderAcct();
      toast(t('ms.ok', { n: r.name }));
    } else if (r.code === 'CANCELLED') {
      /* kullanıcı vazgeçti */
    } else if (r.code === 'NO_GAME') toast(t('ms.noGame'), true);
    else if (r.code === 'NO_CLIENT_ID') toast(t('ms.needId'), true);
    else toast(t('ms.fail', { e: r.error }), true);
  }

  /* ================= Metinleri yenile ================= */
  function refreshTexts() {
    applyI18n();
    renderNet();
    renderList();
    renderAcct();
    mrRender();
    if (S.phase === 'idle') { $('#playLabel').textContent = t('play.btn'); subLabel(); heroIdle(false); }
    else if (S.phase === 'running') setPhase('running');
    $('#about').textContent = t('set.about', { v: S.version });
    $$('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
    if (!S.logText) $('#log').textContent = t('con.empty');
  }

  /* ================= Başlat ================= */
  async function init() {
    S.cfg = await zero.getSettings();
    const info = await zero.sysInfo();
    S.version = info.version;
    const sys = String(info.locale || 'en').slice(0, 2).toLowerCase();
    LANG = S.cfg.lang || (D[sys] ? sys : 'en');
    S.loader = S.cfg.loader || 'vanilla';
    S.mc = S.cfg.mc;
    S.filters.snapshot = !!S.cfg.snapshots;
    S.ms = await zero.ms.status();

    // RAM
    const maxRam = Math.max(2048, Math.min(16384, Math.floor((info.totalMem * 0.75) / 512) * 512));
    const ram = $('#ram');
    ram.max = String(maxRam);
    ram.value = String(Math.min(S.cfg.ram || 4096, maxRam));
    const showRam = () => ($('#ramVal').textContent = `${(ram.value / 1024).toFixed(ram.value % 1024 ? 1 : 0)} GB`);
    ram.addEventListener('input', showRam);
    ram.addEventListener('change', () => save({ ram: +ram.value }));
    showRam();

    $('#nick').addEventListener('change', () => { if (!$('#nick').readOnly) save({ username: $('#nick').value.trim() }); });

    document.body.dataset.loader = S.loader;
    $$('#loaders button').forEach((b) => b.classList.toggle('on', b.dataset.loader === S.loader));
    $$('#chips button').forEach((b) => b.classList.toggle('on', !!S.filters[b.dataset.t]));
    $('#swHide').setAttribute('aria-checked', String(!!S.cfg.hideOnLaunch));
    $('#swUpd').setAttribute('aria-checked', String(S.cfg.autoUpdate !== false));
    $('#clientId').value = S.cfg.msClientId || '';
    $('#langs').innerHTML = LANGS.map((l) => `<button data-lang="${l.code}">${esc(l.name)}</button>`).join('');

    // Pencere
    $('#wMin').onclick = () => zero.win.min();
    $('#wMax').onclick = () => zero.win.max();
    $('#wClose').onclick = () => zero.win.close();

    // Sekmeler
    const goTab = (name) => {
      $$('.tab').forEach((x) => x.classList.toggle('active', x.dataset.view === name));
      $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
      if (name === 'mods') mrEnter(false);
    };
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => goTab(tab.dataset.view)));

    // Mod yükleyici
    $('#loaders').addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b || S.phase !== 'idle') return;
      S.loader = b.dataset.loader;
      $$('#loaders button').forEach((x) => x.classList.toggle('on', x === b));
      document.body.dataset.loader = S.loader;
      save({ loader: S.loader });
      await loadVersions();
      save({ mc: S.mc });
    });

    // Filtre, arama, seçim
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      S.filters[b.dataset.t] = !S.filters[b.dataset.t];
      b.classList.toggle('on', S.filters[b.dataset.t]);
      if (b.dataset.t === 'snapshot') save({ snapshots: S.filters.snapshot });
      renderList();
    });
    $('#search').addEventListener('input', (e) => { S.q = e.target.value; renderList(); });
    $('#vList').addEventListener('click', (e) => {
      const li = e.target.closest('li[data-id]');
      if (!li || S.phase !== 'idle') return;
      S.mc = li.dataset.id;
      save({ mc: S.mc });
      subLabel();
      renderList();
    });

    $('#playBtn').addEventListener('click', onPlay);

    // Modrinth
    $('#mrTypes').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      S.mr.type = b.dataset.type;
      $$('#mrTypes button').forEach((x) => x.classList.toggle('on', x === b));
      mrEnter(true);
    });
    $('#mrMode').addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      S.mr.mode = b.dataset.mode;
      $$('#mrMode button').forEach((x) => x.classList.toggle('on', x === b));
      await mrLoadInstalled();
      if (S.mr.mode === 'installed') { mrRender(); mrCheckUpdates(); }
      else if (!S.mr.items.length) mrSearch(true);
      else mrRender();
    });
    let mrDeb;
    $('#mrSearch').addEventListener('input', (e) => {
      S.mr.q = e.target.value.trim();
      clearTimeout(mrDeb);
      mrDeb = setTimeout(() => mrSearch(true), 380);
    });
    $('#mrSort').addEventListener('change', (e) => { S.mr.sort = e.target.value; mrSearch(true); });
    $('#mrUpdAll').addEventListener('click', mrUpdateAll);
    $('#mrList').addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        const d = document.createElement('div');
        d.className = 'mr-ico';
        d.textContent = e.target.dataset.letter || '?';
        e.target.replaceWith(d);
      }
    }, true);
    $('#mrList').addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'goplay') goTab('play');
      else if (act === 'more') mrSearch(false);
      else if (act === 'install') {
        if (await mrInstallOne(b.dataset.id, b.dataset.title, b)) { await mrLoadInstalled(); mrRender(); }
      } else if (act === 'update') {
        b.disabled = true; b.textContent = t('mods.installing');
        if (await mrInstallOne(b.dataset.id, null, null)) { await mrLoadInstalled(); await mrCheckUpdates(); }
        mrRender();
      } else if (act === 'remove') {
        await zero.mrRemove({ mc: S.mc, loader: S.loader, type: S.mr.type, filename: b.dataset.file, projectId: b.dataset.id || null });
        toast(t('mods.removed'));
        await mrLoadInstalled();
        mrRender();
        mrCheckUpdates();
      }
    });

    // Ayarlar: genel
    const toggle = (id, key) => $(id).addEventListener('click', () => {
      const v = $(id).getAttribute('aria-checked') !== 'true';
      $(id).setAttribute('aria-checked', String(v));
      save({ [key]: v });
    });
    toggle('#swHide', 'hideOnLaunch');
    toggle('#swUpd', 'autoUpdate');
    $('#langs').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      LANG = b.dataset.lang;
      save({ lang: LANG });
      refreshTexts();
    });
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => zero.openFolder({ kind: b.dataset.open, mc: S.mc, loader: S.loader })));

    // Ayarlar: hesap
    $('#playMode').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      save({ playMode: b.dataset.mode });
      renderAcct();
    });
    $('#msIn').addEventListener('click', msLogin);
    $('#msOut').addEventListener('click', async () => {
      await zero.ms.logout();
      S.ms = { loggedIn: false, name: null };
      if (S.cfg.playMode === 'microsoft') save({ playMode: 'offline' });
      renderAcct();
    });
    $('#clientId').addEventListener('change', () => save({ msClientId: $('#clientId').value.trim() }));
    $('#msCancel').addEventListener('click', () => zero.ms.cancel());
    $('#msOpen').addEventListener('click', () => zero.ms.open());
    $('#msCopy').addEventListener('click', () => navigator.clipboard.writeText($('#msCode').textContent));

    // Ayarlar: görünüm
    $('#themes').addEventListener('click', (e) => {
      const b = e.target.closest('.theme');
      if (!b) return;
      save({ theme: b.dataset.th });
      applyAppearance();
    });
    $('#swAccent').addEventListener('click', () => {
      save({ accentMode: S.cfg.accentMode === 'custom' ? 'loader' : 'custom' });
      applyAppearance();
    });
    $('#swatches').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      save({ accentMode: 'custom', accentColor: b.dataset.c });
      applyAppearance();
    });
    $('#accentPick').addEventListener('input', (e) => { save({ accentMode: 'custom', accentColor: e.target.value }); applyAppearance(); });
    $('#bgChoose').addEventListener('click', async () => {
      const r = await zero.bg.choose();
      if (r.error === 'size') toast(t('set.bgBig'), true);
      else if (r.data) setBg(r.data);
    });
    $('#bgRemove').addEventListener('click', async () => { await zero.bg.clear(); setBg(null); });
    $('#bgBright').addEventListener('input', (e) => { save({ bgBright: +e.target.value }); applyAppearance(); });
    $('#resetLook').addEventListener('click', async () => {
      await zero.bg.clear(); setBg(null);
      save({ theme: 'obsidian', accentMode: 'loader', accentColor: '#7de2d1', bgBright: 45 });
      applyAppearance();
    });

    // Konsol
    $('#logClear').onclick = () => { S.logText = ''; $('#log').textContent = ''; };
    $('#logCopy').onclick = () => navigator.clipboard.writeText(S.logText).then(() => toast(t('con.copied')));

    // Ana süreçten gelenler
    zero.onProgress(({ label, pct }) => {
      if (S.phase !== 'busy') return;
      setArc(pct);
      $('#playLabel').textContent = pct + '%';
      $('#playSub').textContent = t(label);
    });
    zero.onLog(log);
    zero.onNotice((key) => toast(t(key), true));
    zero.onState(({ state, code }) => {
      if (state === 'running') setPhase('running');
      if (state === 'exit') {
        setPhase('idle');
        if (code && code !== 0) toast(t('play.exit', { c: code }), true);
      }
    });

    window.addEventListener('online', loadVersions);
    window.addEventListener('offline', () => { S.online = false; renderNet(); });

    applyAppearance();
    zero.bg.get().then(setBg);
    applyI18n();
    $('#log').textContent = t('con.empty');
    syncNick();
    renderAcct();
    $('#about').textContent = t('set.about', { v: S.version });
    $$('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
    renderNet();
    setPhase('idle');
    startHeroLoop();
    await loadVersions();
  }

  init();
})();
