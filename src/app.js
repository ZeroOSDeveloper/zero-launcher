(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = 2 * Math.PI * 140;
  const LOADERS = { vanilla: 'Vanilla', fabric: 'Fabric', forge: 'Forge', neoforge: 'NeoForge' };
  const TYPE_LABEL = { release: 'sürüm', snapshot: 'snapshot', old_beta: 'beta', old_alpha: 'alfa' };
  const IDLE_QUIPS = [
    'Hesap yok, şifre yok. Sadece oyun.',
    'İnternet koptu mu? Creeper de bağlantı bekler, sen oyna.',
    'Kurulu sürümler çevrimdışı açılır.',
    'Elmas için kazmak serbest, giriş yapmak zorunlu değil.',
    'Bellek arttıkça Steve daha rahat nefes alır.'
  ];
  const BUSY_QUIPS = [
    'Creeper kapının önünden uzaklaştırılıyor',
    'Zombilere "randevusuz giriş yok" yazılıyor',
    'Işıklar yakılıyor, mob doğması engelleniyor',
    'Kazma bileniyor',
    'Piksel piksel dünya kuruluyor'
  ];

  const S = {
    cfg: {},
    loader: 'vanilla',
    mc: null,
    list: [],
    filters: { release: true, snapshot: false, old: false },
    q: '',
    phase: 'idle', // idle | busy | running
    logText: ''
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- Yardımcılar ---------- */
  let toastT;
  function toast(msg, err = false) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 4200);
  }

  function setLoaderTheme(l) {
    document.body.dataset.loader = l;
  }

  function subLabel() {
    $('#playSub').textContent = S.mc ? `${S.mc} ${LOADERS[S.loader]}` : 'Sürüm seç';
  }

  function setArc(pct) {
    $('#arc').style.strokeDashoffset = String(C * (1 - pct / 100));
  }

  function setPhase(p) {
    S.phase = p;
    const w = $('#ringWrap');
    w.className = 'ring-wrap ' + p;
    $('#loaders').classList.toggle('locked', p !== 'idle');
    if (p === 'idle') {
      $('#playLabel').textContent = 'Oyna';
      setArc(0);
      subLabel();
      $('#statusLine').textContent = pick(IDLE_QUIPS);
    } else if (p === 'running') {
      $('#playLabel').textContent = 'Çalışıyor';
      $('#playSub').textContent = 'Durdurmak için tıkla';
      $('#statusLine').textContent = 'İyi eğlenceler! Launcher arka planda bekliyor.';
    }
  }

  /* ---------- Sürüm listesi ---------- */
  function renderList() {
    const q = S.q.trim().toLowerCase();
    const ul = $('#vList');
    const items = S.list.filter((v) => {
      const group = v.type === 'release' ? 'release' : v.type === 'snapshot' ? 'snapshot' : 'old';
      if (!S.filters[group] && v.id !== S.mc) return false;
      return !q || v.id.toLowerCase().includes(q);
    });
    $('#vCount').textContent = items.length ? `${items.length} sürüm` : '';
    if (!items.length) {
      ul.innerHTML = '<li class="empty">Bu filtrede sürüm yok. Arama ya da filtreyi değiştir, ya da internete bağlanıp listeyi yenile.</li>';
      return;
    }
    ul.innerHTML = items
      .map(
        (v) =>
          `<li data-id="${v.id}" class="${v.id === S.mc ? 'sel' : ''}"><span class="got ${v.installed ? 'y' : ''}" title="${v.installed ? 'Kurulu, çevrimdışı oynanır' : 'İlk açılışta indirilecek'}"></span>${v.id}<span class="tag">${TYPE_LABEL[v.type] || v.type}</span></li>`
      )
      .join('');
    const sel = $('li.sel', ul);
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  async function loadVersions() {
    $('#vList').innerHTML = '<li class="empty">Sürümler yükleniyor…</li>';
    const res = await zero.listVersions(S.loader);
    S.list = res.versions || [];
    const net = $('#net');
    net.className = 'net ' + (res.online ? 'on' : 'off');
    $('#netText').textContent = res.online ? 'Çevrimiçi' : 'Çevrimdışı mod';

    const ids = new Set(S.list.map((v) => v.id));
    if (!S.mc || !ids.has(S.mc)) {
      const first = S.list.find((v) => v.type === 'release') || S.list[0];
      S.mc = first ? first.id : null;
    }
    subLabel();
    renderList();
  }

  /* ---------- Oyun ---------- */
  async function onPlay() {
    if (S.phase === 'running') {
      await zero.stop();
      return;
    }
    if (S.phase === 'busy') return;
    const name = $('#nick').value.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
      const f = $('#nick').closest('.field');
      f.classList.remove('bad');
      void f.offsetWidth;
      f.classList.add('bad');
      toast('Takma ad 3-16 karakter olmalı. Harf, rakam ve _ kullanabilirsin.', true);
      return;
    }
    if (!S.mc) {
      toast('Önce bir sürüm seç.', true);
      return;
    }
    setPhase('busy');
    $('#playLabel').textContent = '0%';
    $('#statusLine').textContent = pick(BUSY_QUIPS);
    log(`\n=== ${S.mc} ${LOADERS[S.loader]} ===\n`);
    const res = await zero.play({ mc: S.mc, loader: S.loader, username: name, ram: +$('#ram').value });
    if (!res.ok) {
      setPhase('idle');
      toast(res.error || 'Başlatılamadı. Konsol sekmesine bak.', true);
    }
  }

  /* ---------- Konsol ---------- */
  function log(t) {
    S.logText += t;
    if (S.logText.length > 400000) S.logText = S.logText.slice(-300000);
    const el = $('#log');
    const stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    el.textContent = S.logText;
    if (stick) el.scrollTop = el.scrollHeight;
  }

  /* ---------- Başlat ---------- */
  async function init() {
    S.cfg = await zero.getSettings();
    const info = await zero.sysInfo();
    S.loader = S.cfg.loader || 'vanilla';
    S.mc = S.cfg.mc;
    S.filters.snapshot = !!S.cfg.snapshots;

    const maxRam = Math.max(2048, Math.min(16384, Math.floor((info.totalMem * 0.75) / 512) * 512));
    const ram = $('#ram');
    ram.max = String(maxRam);
    ram.value = String(Math.min(S.cfg.ram || 4096, maxRam));
    const showRam = () => ($('#ramVal').textContent = `${(ram.value / 1024).toFixed(ram.value % 1024 ? 1 : 0)} GB`);
    ram.addEventListener('input', showRam);
    ram.addEventListener('change', () => zero.setSettings({ ram: +ram.value }));
    showRam();

    $('#nick').value = S.cfg.username || 'Player';
    $('#nick').addEventListener('change', () => zero.setSettings({ username: $('#nick').value.trim() }));
    $('#about').textContent = `Zero Launcher v${info.version}. Hesap gerektirmez, çevrimdışı oynatır.`;

    setLoaderTheme(S.loader);
    $$('#loaders button').forEach((b) => b.classList.toggle('on', b.dataset.loader === S.loader));
    $$('#chips button').forEach((b) => b.classList.toggle('on', !!S.filters[b.dataset.t]));
    const sw = $('#swHide');
    sw.setAttribute('aria-checked', String(!!S.cfg.hideOnLaunch));

    // Pencere
    $('#wMin').onclick = () => zero.win.min();
    $('#wMax').onclick = () => zero.win.max();
    $('#wClose').onclick = () => zero.win.close();

    // Sekmeler
    $$('.tab').forEach((t) =>
      t.addEventListener('click', () => {
        $$('.tab').forEach((x) => x.classList.toggle('active', x === t));
        $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + t.dataset.view));
      })
    );

    // Yükleyici
    $('#loaders').addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b || S.phase !== 'idle') return;
      S.loader = b.dataset.loader;
      $$('#loaders button').forEach((x) => x.classList.toggle('on', x === b));
      setLoaderTheme(S.loader);
      zero.setSettings({ loader: S.loader });
      await loadVersions();
      zero.setSettings({ mc: S.mc });
    });

    // Filtre + arama + seçim
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      S.filters[b.dataset.t] = !S.filters[b.dataset.t];
      b.classList.toggle('on', S.filters[b.dataset.t]);
      if (b.dataset.t === 'snapshot') zero.setSettings({ snapshots: S.filters.snapshot });
      renderList();
    });
    $('#search').addEventListener('input', (e) => { S.q = e.target.value; renderList(); });
    $('#vList').addEventListener('click', (e) => {
      const li = e.target.closest('li[data-id]');
      if (!li || S.phase !== 'idle') return;
      S.mc = li.dataset.id;
      zero.setSettings({ mc: S.mc });
      subLabel();
      renderList();
    });

    // Oyna
    $('#playBtn').addEventListener('click', onPlay);

    // Ayarlar
    sw.addEventListener('click', () => {
      const v = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(v));
      zero.setSettings({ hideOnLaunch: v });
    });
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => zero.openFolder({ kind: b.dataset.open, mc: S.mc, loader: S.loader })));

    // Konsol
    $('#logClear').onclick = () => { S.logText = ''; $('#log').textContent = ''; };
    $('#logCopy').onclick = () => navigator.clipboard.writeText(S.logText).then(() => toast('Konsol çıktısı kopyalandı.'));

    // Ana süreçten gelenler
    zero.onProgress(({ label, pct }) => {
      if (S.phase !== 'busy') return;
      setArc(pct);
      $('#playLabel').textContent = pct + '%';
      $('#playSub').textContent = label;
    });
    zero.onLog(log);
    zero.onState(({ state, code }) => {
      if (state === 'running') setPhase('running');
      if (state === 'exit') {
        setPhase('idle');
        if (code && code !== 0) toast(`Oyun hata koduyla kapandı (${code}). Konsol sekmesine bak.`, true);
      }
    });

    window.addEventListener('online', loadVersions);
    window.addEventListener('offline', () => { $('#net').className = 'net off'; $('#netText').textContent = 'Çevrimdışı mod'; });

    setPhase('idle');
    await loadVersions();
  }

  init();
})();
