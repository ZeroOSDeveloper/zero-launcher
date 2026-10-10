'use strict';
/**
 * Zero Launcher core
 * - Mojang sürüm/kütüphane/asset indirme
 * - Mojang'un resmi Java çalışma ortamını otomatik indirme
 * - Fabric / Forge / NeoForge kurulumu
 * - Çevrimdışı (hesapsız) başlatma
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const AdmZip = require('adm-zip');

const UA = 'ZeroLauncher/1.0';
const URLS = {
  manifest: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
  javaAll: 'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json',
  resources: 'https://resources.download.minecraft.net/',
  libraries: 'https://libraries.minecraft.net/',
  fabricGame: 'https://meta.fabricmc.net/v2/versions/game',
  fabricLoader: 'https://meta.fabricmc.net/v2/versions/loader/',
  forgePromos: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
  forgeMaven: 'https://maven.minecraftforge.net/net/minecraftforge/forge/',
  neoVersions: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge',
  neoMaven: 'https://maven.neoforged.net/releases/net/neoforged/neoforge/'
};
const LOADER_NAMES = { vanilla: 'Vanilla', fabric: 'Fabric', forge: 'Forge', neoforge: 'NeoForge' };

let BASE = '';
let current = null; // çalışan oyun süreci

const dir = (...p) => path.join(BASE, ...p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => fsp.access(p).then(() => true, () => false);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function init(base) {
  BASE = base;
  for (const d of ['versions', 'libraries', 'assets', 'runtime', 'instances', 'cache']) {
    fs.mkdirSync(dir(d), { recursive: true });
  }
}

/* ------------------------------------------------------------------ */
/* Ağ yardımcıları                                                     */
/* ------------------------------------------------------------------ */
async function getJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} - ${url}`);
  return r.json();
}

async function download(url, dest, tries = 3) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const tmp = dest + '.part';
      await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp));
      await fsp.rename(tmp, dest);
      return;
    } catch (e) {
      if (i === tries - 1) throw new Error(`${url} indirilemedi: ${e.message}`);
      await sleep(600 * (i + 1));
    }
  }
}

async function pool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function okFile(p, size) {
  try {
    const s = await fsp.stat(p);
    return size == null || s.size === size;
  } catch {
    return false;
  }
}

// Ağdan dener, olmazsa diskteki önbelleği kullanır (çevrimdışı mod için)
async function cached(name, fetcher) {
  const f = dir('cache', name + '.json');
  try {
    const data = await fetcher();
    await fsp.writeFile(f, JSON.stringify(data));
    return { data, online: true };
  } catch {
    try {
      return { data: JSON.parse(await fsp.readFile(f, 'utf8')), online: false };
    } catch {
      return { data: null, online: false };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Sürüm yardımcıları                                                  */
/* ------------------------------------------------------------------ */
const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);
function cmpVer(a, b) {
  const x = nums(a), y = nums(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

// 1.21.1 -> "21.1." , 1.20 -> "20.0." , 26.1 -> "26.1."
function neoPrefix(mc) {
  const p = mc.split('.');
  if (p[0] === '1') return `${p[1]}.${p[2] || 0}.`;
  return mc.split('-')[0] + '.';
}

function listVersionDirs() {
  try {
    return fs
      .readdirSync(dir('versions'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(dir('versions', d.name, d.name + '.json')))
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function installedLoaderId(loader, mc, names = listVersionDirs()) {
  let m = [];
  if (loader === 'fabric') m = names.filter((n) => n.startsWith('fabric-loader-') && n.endsWith('-' + mc));
  else if (loader === 'forge') m = names.filter((n) => n.startsWith(mc + '-forge'));
  else if (loader === 'neoforge') m = names.filter((n) => n.startsWith('neoforge-' + neoPrefix(mc)));
  return m.sort(cmpVer).pop() || null;
}

async function listVersions(loader) {
  const man = await cached('manifest', () => getJSON(URLS.manifest));
  let online = man.online;
  const names = listVersionDirs();
  let items = man.data ? man.data.versions.map((v) => ({ id: v.id, type: v.type })) : [];

  // Manifest yoksa (çevrimdışı + önbellek yok) diskteki sürümleri göster
  const known = new Set(items.map((i) => i.id));
  for (const n of names) {
    if (known.has(n)) continue;
    try {
      const j = readJson(dir('versions', n, n + '.json'));
      if (!j.inheritsFrom && j.type && j.mainClass && !/^(fabric|neoforge|forge)/i.test(n) && !n.includes('-forge')) {
        items.push({ id: n, type: j.type });
      }
    } catch {}
  }

  let allowed = null;
  if (loader === 'fabric') {
    const g = await cached('fabric-game', () => getJSON(URLS.fabricGame));
    if (g.data) allowed = (id) => g.data.some((x) => x.version === id);
    online = online && g.online;
  } else if (loader === 'forge') {
    const g = await cached('forge-promos', () => getJSON(URLS.forgePromos));
    if (g.data) {
      const set = new Set(Object.keys(g.data.promos).map((k) => k.replace(/-(latest|recommended)$/, '')));
      allowed = (id) => set.has(id);
    }
    online = online && g.online;
  } else if (loader === 'neoforge') {
    const g = await cached('neoforge-versions', () => getJSON(URLS.neoVersions));
    if (g.data) allowed = (id) => g.data.versions.some((v) => v.startsWith(neoPrefix(id)));
    online = online && g.online;
  }

  if (loader !== 'vanilla') {
    items = items.filter((it) => installedLoaderId(loader, it.id, names) || (allowed && allowed(it.id)));
  }

  return {
    online,
    versions: items.map((it) => ({
      ...it,
      installed:
        loader === 'vanilla'
          ? names.includes(it.id) && fs.existsSync(dir('versions', it.id, it.id + '.jar'))
          : !!installedLoaderId(loader, it.id, names)
    }))
  };
}

/* ------------------------------------------------------------------ */
/* Kurallar / kütüphaneler                                             */
/* ------------------------------------------------------------------ */
const OSN = { win32: 'windows', darwin: 'osx', linux: 'linux' }[process.platform] || 'linux';

function ruleOk(rules) {
  if (!rules) return true;
  let allow = false;
  for (const r of rules) {
    let match = true;
    if (r.os) {
      if (r.os.name && r.os.name !== OSN) match = false;
      if (r.os.arch === 'x86' && process.arch !== 'ia32') match = false;
      if (r.os.arch === 'arm64' && process.arch !== 'arm64') match = false;
      if (r.os.version && !new RegExp(r.os.version).test(os.release())) match = false;
    }
    if (r.features) match = false; // demo, çözünürlük, quick-play vb. kapalı
    if (match) allow = r.action === 'allow';
  }
  return allow;
}

function mavenPath(name) {
  const [g, a, v, c] = name.split(':');
  return `${g.replace(/\./g, '/')}/${a}/${v}/${a}-${v}${c ? '-' + c : ''}.jar`;
}

function resolveVersion(id) {
  const child = readJson(dir('versions', id, id + '.json'));
  if (!child.inheritsFrom) return { ...child, _jarId: child.jar || id };
  const parent = resolveVersion(child.inheritsFrom);

  const seen = new Set();
  const libraries = [];
  for (const lib of [...(child.libraries || []), ...(parent.libraries || [])]) {
    const [g, a, , c] = lib.name.split(':');
    const key = `${g}:${a}:${c || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    libraries.push(lib);
  }

  const merged = { ...parent, ...child, libraries, id };
  if (parent.arguments || child.arguments) {
    merged.arguments = {
      game: [...(parent.arguments?.game || []), ...(child.arguments?.game || [])],
      jvm: [...(parent.arguments?.jvm || []), ...(child.arguments?.jvm || [])]
    };
  }
  merged._jarId = child.jar || parent._jarId;
  delete merged.inheritsFrom;
  return merged;
}

function libEntries(v) {
  const out = [];
  for (const lib of v.libraries || []) {
    if (!ruleOk(lib.rules)) continue;
    if (lib.natives) {
      const key = lib.natives[OSN];
      if (!key) continue;
      const cls = key.replace('${arch}', process.arch === 'ia32' ? '32' : '64');
      if (lib.downloads?.artifact) out.push({ ...lib.downloads.artifact, native: false });
      const art = lib.downloads?.classifiers?.[cls];
      if (art) out.push({ ...art, native: true, legacyNative: true });
      else {
        const p = mavenPath(`${lib.name}:${cls}`);
        out.push({ path: p, url: (lib.url || URLS.libraries) + p, native: true, legacyNative: true });
      }
      continue;
    }
    let art = lib.downloads?.artifact;
    if (!art) {
      const p = mavenPath(lib.name);
      art = { path: p, url: (lib.url || URLS.libraries).replace(/\/?$/, '/') + p };
    }
    out.push({ ...art, native: /:natives-/.test(lib.name) });
  }
  return out;
}

function extractNatives(entries, outDir) {
  const marker = path.join(outDir, '.done');
  if (fs.existsSync(marker)) return;
  fs.mkdirSync(outDir, { recursive: true });
  for (const e of entries.filter((x) => x.native)) {
    const file = dir('libraries', e.path);
    if (!fs.existsSync(file)) continue;
    const zip = new AdmZip(file);
    for (const z of zip.getEntries()) {
      if (z.isDirectory || z.entryName.startsWith('META-INF')) continue;
      if (!/\.(dll|so|dylib|jnilib)$/i.test(z.entryName)) continue;
      fs.writeFileSync(path.join(outDir, path.basename(z.entryName)), z.getData());
    }
  }
  fs.writeFileSync(marker, '1');
}

/* ------------------------------------------------------------------ */
/* Vanilla / asset / log yapılandırması                                */
/* ------------------------------------------------------------------ */
async function ensureVanilla(mc) {
  const jp = dir('versions', mc, mc + '.json');
  if (!(await exists(jp))) {
    const m = await cached('manifest', () => getJSON(URLS.manifest));
    const e = m.data?.versions.find((v) => v.id === mc);
    if (!e) throw new Error(`${mc} sürümü bulunamadı. İnternet bağlantısı gerekebilir.`);
    await download(e.url, jp);
  }
  const json = readJson(jp);
  const jar = dir('versions', mc, mc + '.jar');
  const c = json.downloads?.client;
  if (c && !(await okFile(jar, c.size))) await download(c.url, jar);
  return json;
}

async function ensureAssets(v, gameDir, onProg) {
  const ai = v.assetIndex;
  const idxPath = dir('assets', 'indexes', ai.id + '.json');
  if (!(await okFile(idxPath, ai.size))) await download(ai.url, idxPath);
  const idx = readJson(idxPath);
  const objs = Object.entries(idx.objects);
  let done = 0;
  await pool(objs, 32, async ([, o]) => {
    const h = o.hash;
    const p = dir('assets', 'objects', h.slice(0, 2), h);
    if (!(await okFile(p, o.size))) await download(`${URLS.resources}${h.slice(0, 2)}/${h}`, p);
    if (++done % 25 === 0 || done === objs.length) onProg(done / objs.length);
  });

  let gameAssets = dir('assets');
  if (idx.virtual || idx.map_to_resources) {
    const target = idx.map_to_resources ? path.join(gameDir, 'resources') : dir('assets', 'virtual', 'legacy');
    for (const [name, o] of objs) {
      const dest = path.join(target, name);
      if (await exists(dest)) continue;
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.copyFile(dir('assets', 'objects', o.hash.slice(0, 2), o.hash), dest);
    }
    if (idx.virtual) gameAssets = dir('assets', 'virtual', 'legacy');
  }
  return gameAssets;
}

async function ensureLogConfig(v) {
  const f = v.logging?.client?.file;
  if (!f) return null;
  const p = dir('assets', 'log_configs', f.id);
  if (!(await exists(p))) {
    try { await download(f.url, p); } catch { return null; }
  }
  return v.logging.client.argument.replace('${path}', p);
}

/* ------------------------------------------------------------------ */
/* Java çalışma ortamı                                                 */
/* ------------------------------------------------------------------ */
function platKey() {
  if (process.platform === 'win32') return process.arch === 'x64' ? 'windows-x64' : process.arch === 'arm64' ? 'windows-arm64' : 'windows-x86';
  if (process.platform === 'darwin') return process.arch === 'arm64' ? 'mac-os-arm64' : 'mac-os';
  return process.arch === 'ia32' ? 'linux-i386' : 'linux';
}

function javaBin(component, gui) {
  const base = dir('runtime', component);
  if (process.platform === 'win32') return path.join(base, 'bin', gui ? 'javaw.exe' : 'java.exe');
  if (process.platform === 'darwin') return path.join(base, 'jre.bundle', 'Contents', 'Home', 'bin', 'java');
  return path.join(base, 'bin', 'java');
}

function resolveJava(component, gui) {
  const p = javaBin(component, gui);
  if (fs.existsSync(p)) return p;
  return process.platform === 'win32' && gui ? 'javaw' : 'java'; // sistem Java'sı
}

async function ensureJava(component, onProg) {
  const base = dir('runtime', component);
  if (fs.existsSync(javaBin(component, false)) && fs.existsSync(path.join(base, '.ok'))) return;
  const all = await getJSON(URLS.javaAll);
  const ent = all[platKey()]?.[component]?.[0];
  if (!ent) throw new Error(`Java çalışma ortamı bulunamadı: ${component}`);
  const man = await getJSON(ent.manifest.url);
  const files = Object.entries(man.files).filter(([, f]) => f.type === 'file');
  let done = 0;
  await pool(files, 16, async ([rel, f]) => {
    const dest = path.join(base, rel);
    const raw = f.downloads.raw;
    if (!(await okFile(dest, raw.size))) await download(raw.url, dest);
    if (f.executable && process.platform !== 'win32') await fsp.chmod(dest, 0o755);
    if (++done % 10 === 0 || done === files.length) onProg(done / files.length);
  });
  fs.writeFileSync(path.join(base, '.ok'), '1');
}

/* ------------------------------------------------------------------ */
/* Mod yükleyicileri                                                   */
/* ------------------------------------------------------------------ */
function runInstaller(javaExe, jar, log) {
  return new Promise((resolve, reject) => {
    const prof = dir('launcher_profiles.json');
    if (!fs.existsSync(prof)) fs.writeFileSync(prof, JSON.stringify({ profiles: {}, settings: {}, version: 3 }));
    const p = spawn(javaExe, ['-jar', jar, '--installClient', BASE], { cwd: BASE });
    p.stdout.on('data', (d) => log(d.toString()));
    p.stderr.on('data', (d) => log(d.toString()));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Kurulum programı hata kodu ile çıktı: ${code}`))));
  });
}

async function installFabric(mc) {
  const have = installedLoaderId('fabric', mc);
  if (have) return have;
  const list = await getJSON(URLS.fabricLoader + mc);
  if (!list.length) throw new Error(`${mc} için Fabric yok.`);
  const lv = (list.find((x) => x.loader.stable) || list[0]).loader.version;
  const prof = await getJSON(`${URLS.fabricLoader}${mc}/${lv}/profile/json`);
  const jp = dir('versions', prof.id, prof.id + '.json');
  await fsp.mkdir(path.dirname(jp), { recursive: true });
  await fsp.writeFile(jp, JSON.stringify(prof, null, 2));
  return prof.id;
}

async function installForge(mc, java, log) {
  const have = installedLoaderId('forge', mc);
  if (have) return have;
  const promos = (await getJSON(URLS.forgePromos)).promos;
  const ver = promos[`${mc}-recommended`] || promos[`${mc}-latest`];
  if (!ver) throw new Error(`${mc} için Forge yok.`);
  const jar = dir('cache', 'installers', `forge-${mc}-${ver}-installer.jar`);
  if (!(await exists(jar))) {
    let ok = false;
    for (const c of [`${mc}-${ver}`, `${mc}-${ver}-${mc}`]) {
      try {
        await download(`${URLS.forgeMaven}${c}/forge-${c}-installer.jar`, jar, 1);
        ok = true;
        break;
      } catch {}
    }
    if (!ok) throw new Error('Forge kurulum dosyası indirilemedi.');
  }
  log(`[Zero] Forge ${ver} kuruluyor...\n`);
  await runInstaller(java, jar, log);
  const id = installedLoaderId('forge', mc);
  if (!id) throw new Error('Forge kurulumu tamamlanamadı.');
  return id;
}

async function installNeoForge(mc, java, log) {
  const have = installedLoaderId('neoforge', mc);
  if (have) return have;
  const data = await getJSON(URLS.neoVersions);
  const f = data.versions.filter((v) => v.startsWith(neoPrefix(mc)));
  if (!f.length) throw new Error(`${mc} için NeoForge yok (NeoForge 1.20.2 ve üzerini destekler).`);
  const stable = f.filter((v) => !/alpha|beta/i.test(v));
  const ver = (stable.length ? stable : f).sort(cmpVer).pop();
  const jar = dir('cache', 'installers', `neoforge-${ver}-installer.jar`);
  if (!(await exists(jar))) await download(`${URLS.neoMaven}${ver}/neoforge-${ver}-installer.jar`, jar);
  log(`[Zero] NeoForge ${ver} kuruluyor...\n`);
  await runInstaller(java, jar, log);
  const id = installedLoaderId('neoforge', mc);
  if (!id) throw new Error('NeoForge kurulumu tamamlanamadı.');
  return id;
}

/* ------------------------------------------------------------------ */
/* Çevrimdışı kimlik                                                   */
/* ------------------------------------------------------------------ */
function offlineUUID(name) {
  const b = crypto.createHash('md5').update('OfflinePlayer:' + name).digest();
  b[6] = (b[6] & 0x0f) | 0x30;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* ------------------------------------------------------------------ */
/* Komut satırı                                                        */
/* ------------------------------------------------------------------ */
function buildArgs(v, c) {
  const vars = {
    auth_player_name: c.username,
    version_name: c.versionName,
    game_directory: c.gameDir,
    assets_root: dir('assets'),
    game_assets: c.gameAssets,
    assets_index_name: v.assetIndex?.id || v.assets,
    auth_uuid: c.uuid,
    auth_access_token: '0',
    auth_session: `token:0:${c.uuid}`,
    clientid: '0',
    auth_xuid: '0',
    user_type: 'legacy',
    version_type: 'Zero Launcher',
    user_properties: '{}',
    natives_directory: c.natives,
    launcher_name: 'ZeroLauncher',
    launcher_version: '1.0.0',
    classpath: c.classpath,
    classpath_separator: path.delimiter,
    library_directory: dir('libraries')
  };
  const sub = (s) => s.replace(/\$\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const flat = (list) =>
    list.flatMap((a) => {
      if (typeof a === 'string') return [sub(a)];
      if (!ruleOk(a.rules)) return [];
      return (Array.isArray(a.value) ? a.value : [a.value]).map(sub);
    });

  let jvm, game;
  if (v.arguments) {
    jvm = flat(v.arguments.jvm || []);
    game = flat(v.arguments.game || []);
  } else {
    jvm = [`-Djava.library.path=${c.natives}`];
    game = (v.minecraftArguments || '').split(' ').filter(Boolean).map(sub);
  }
  if (!jvm.includes('-cp') && !jvm.includes('-classpath')) jvm.push('-cp', c.classpath);

  const pre = [
    `-Xmx${c.ram}M`,
    `-Xms${Math.min(512, c.ram)}M`,
    '-Dfml.ignoreInvalidMinecraftCertificates=true',
    '-Dfml.ignorePatchDiscrepancies=true'
  ];
  if (process.platform === 'darwin') pre.push('-XstartOnFirstThread');
  if (c.logArg) pre.push(c.logArg);
  return [...pre, ...jvm, v.mainClass, ...game];
}

/* ------------------------------------------------------------------ */
/* Oyna                                                                */
/* ------------------------------------------------------------------ */
function makeProgress(emit) {
  const stages = [['game', 8], ['java', 14], ['loader', 18], ['libs', 18], ['assets', 38], ['start', 4]];
  const off = {};
  let acc = 0;
  for (const [n, w] of stages) { off[n] = [acc, w]; acc += w; }
  return (stage, frac, label) => {
    const [o, w] = off[stage];
    emit(label, Math.round(o + w * Math.max(0, Math.min(1, frac))));
  };
}

function gameDirFor(mc, loader) {
  return dir('instances', loader === 'vanilla' ? mc : `${mc}-${loader}`);
}

async function play({ mc, loader, username, ram }, hooks) {
  if (current) throw new Error('Oyun zaten çalışıyor.');
  const prog = makeProgress(hooks.progress);
  const log = hooks.log;

  prog('game', 0, 'Sürüm bilgisi hazırlanıyor');
  const vjson = await ensureVanilla(mc);
  prog('game', 1, 'Sürüm hazır');

  const comp = vjson.javaVersion?.component || 'jre-legacy';
  try {
    await ensureJava(comp, (f) => prog('java', f, 'Java hazırlanıyor'));
  } catch (e) {
    if (!fs.existsSync(javaBin(comp, false))) log(`[Zero] Java indirilemedi (${e.message}). Sistemdeki Java denenecek.\n`);
  }
  prog('java', 1, 'Java hazır');

  let id = mc;
  if (loader !== 'vanilla') {
    prog('loader', 0.1, `${LOADER_NAMES[loader]} kuruluyor`);
    const javaCli = resolveJava(comp, false);
    if (loader === 'fabric') id = await installFabric(mc);
    else if (loader === 'forge') id = await installForge(mc, javaCli, log);
    else id = await installNeoForge(mc, javaCli, log);
  }
  prog('loader', 1, 'Mod yükleyici hazır');

  const v = resolveVersion(id);
  const entries = libEntries(v);
  let done = 0;
  await pool(entries, 16, async (e) => {
    const p = dir('libraries', e.path);
    if (!(await okFile(p, e.size)) && e.url) {
      try { await download(e.url, p); } catch (err) { if (!(await exists(p))) throw err; }
    }
    prog('libs', ++done / entries.length, 'Kütüphaneler kontrol ediliyor');
  });

  const gameDir = gameDirFor(mc, loader);
  fs.mkdirSync(gameDir, { recursive: true });
  const gameAssets = await ensureAssets(v, gameDir, (f) => prog('assets', f, 'Oyun dosyaları indiriliyor'));

  const natives = dir('versions', id, 'natives');
  extractNatives(entries, natives);
  const logArg = await ensureLogConfig(v);

  const cp = [
    ...new Set(
      [...entries.filter((e) => !e.legacyNative).map((e) => dir('libraries', e.path)), dir('versions', v._jarId, v._jarId + '.jar')].filter((p) => fs.existsSync(p))
    )
  ].join(path.delimiter);

  const args = buildArgs(v, {
    username,
    uuid: offlineUUID(username),
    versionName: id,
    gameDir,
    gameAssets,
    natives,
    classpath: cp,
    ram: Math.max(512, Number(ram) || 2048),
    logArg
  });

  prog('start', 0.5, 'Oyun başlatılıyor');
  const javaExe = resolveJava(comp, true);
  log(`[Zero] ${javaExe}\n[Zero] ${mc} / ${LOADER_NAMES[loader]} / ${username}\n`);
  const child = spawn(javaExe, args, { cwd: gameDir });
  current = child;
  child.stdout.on('data', (d) => log(d.toString()));
  child.stderr.on('data', (d) => log(d.toString()));
  child.on('error', (e) => { current = null; log(`[HATA] ${e.message}\n`); hooks.exit(-1); });
  child.on('close', (code) => { current = null; hooks.exit(code); });
  prog('start', 1, 'Oyun çalışıyor');
  hooks.started();
}

function stop() {
  if (current) current.kill();
}

module.exports = { init, listVersions, play, stop, gameDirFor, isRunning: () => !!current };
