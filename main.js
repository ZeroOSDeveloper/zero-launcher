'use strict';
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const core = require('./core');
const ms = require('./ms');

const BASE = path.join(app.getPath('appData'), '.zerolauncher');
const SETTINGS = path.join(BASE, 'settings.json');
core.init(BASE);

const defaults = {
  username: 'Player' + Math.floor(Math.random() * 900 + 100),
  ram: 4096,
  loader: 'vanilla',
  mc: null,
  hideOnLaunch: true,
  snapshots: false,
  lang: null,
  theme: 'obsidian',
  accentMode: 'loader',
  accentColor: '#7de2d1',
  bgFile: null,
  bgBright: 45,
  autoUpdate: true,
  playMode: 'offline',
  msClientId: ''
};
let settings = { ...defaults };
try { settings = { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS, 'utf8')) }; } catch {}
const saveSettings = (patch) => {
  settings = { ...settings, ...patch };
  try { fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2)); } catch {}
  return settings;
};

let win;
const send = (ch, payload) => { if (win && !win.isDestroyed()) win.webContents.send(ch, payload); };

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 720,
    minWidth: 1000,
    minHeight: 690,
    frame: false,
    show: false,
    backgroundColor: '#0a0914',
    title: 'Zero Launcher',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(() => { ms.init(BASE); createWindow(); });
app.on('window-all-closed', () => { core.stop(); app.quit(); });

/* Pencere */
ipcMain.on('win:min', () => win.minimize());
ipcMain.on('win:max', () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
ipcMain.on('win:close', () => win.close());

/* Ayarlar */
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:set', (_e, patch) => saveSettings(patch));
ipcMain.handle('sys:info', () => ({ totalMem: Math.floor(os.totalmem() / 1048576), version: app.getVersion(), locale: app.getLocale() }));

/* Arka plan resmi */
const BG_MAX = 8 * 1024 * 1024;
function readBg() {
  if (!settings.bgFile) return null;
  try {
    const p = path.join(BASE, path.basename(settings.bgFile));
    const ext = path.extname(p).slice(1).toLowerCase().replace('jpg', 'jpeg');
    return `data:image/${ext};base64,` + fs.readFileSync(p).toString('base64');
  } catch { return null; }
}
function clearBg() {
  try { for (const f of fs.readdirSync(BASE)) if (/^background\./.test(f)) fs.unlinkSync(path.join(BASE, f)); } catch {}
  saveSettings({ bgFile: null });
}
ipcMain.handle('bg:get', () => readBg());
ipcMain.handle('bg:clear', () => { clearBg(); return true; });
ipcMain.handle('bg:choose', async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  });
  if (r.canceled || !r.filePaths[0]) return { cancelled: true };
  const src = r.filePaths[0];
  if (fs.statSync(src).size > BG_MAX) return { error: 'size' };
  clearBg();
  const name = 'background' + path.extname(src).toLowerCase();
  fs.copyFileSync(src, path.join(BASE, name));
  saveSettings({ bgFile: name });
  return { data: readBg() };
});

/* Microsoft hesabı */
let msLink = null;
ipcMain.handle('ms:status', () => ms.status());
ipcMain.handle('ms:login', async () => {
  try {
    const r = await ms.login(settings.msClientId, (c) => {
      msLink = c.uri;
      send('ms:code', c);
      if (/^https:\/\//.test(c.uri)) shell.openExternal(c.uri);
    });
    return { ok: true, ...r };
  } catch (e) {
    return { ok: false, code: e.code || null, error: e.message };
  }
});
ipcMain.handle('ms:cancel', () => { ms.cancel(); return true; });
ipcMain.handle('ms:logout', () => { ms.logout(); return true; });
ipcMain.handle('ms:open', () => { if (msLink && /^https:\/\//.test(msLink)) shell.openExternal(msLink); return true; });

/* Sürümler */
ipcMain.handle('versions:list', async (_e, loader) => {
  try { return await core.listVersions(loader); }
  catch (e) { return { online: false, versions: [], error: e.message }; }
});

/* Modrinth */
const wrap = (fn) => async (_e, arg) => {
  try { return { ok: true, ...(await fn(arg)) }; }
  catch (e) { return { ok: false, error: e.message }; }
};
ipcMain.handle('mr:search', wrap((a) => core.mrSearch(a)));
ipcMain.handle('mr:install', wrap(async (a) => ({ done: await core.mrInstall(a) })));
ipcMain.handle('mr:installed', wrap((a) => ({ items: core.mrInstalled(a) })));
ipcMain.handle('mr:updates', wrap(async (a) => ({ updates: await core.mrCheckUpdates(a) })));
ipcMain.handle('mr:remove', wrap((a) => { core.mrRemove(a); return {}; }));

/* Oyun */
ipcMain.handle('game:play', async (_e, opts) => {
  try {
    saveSettings({ username: opts.username, ram: opts.ram, loader: opts.loader, mc: opts.mc });

    // Microsoft modu: oturumu yenile. İnternet yoksa çevrimdışı moda düş.
    let auth = null;
    if (settings.playMode === 'microsoft') {
      try {
        auth = await ms.refresh(settings.msClientId);
      } catch (e) {
        if (!ms.isNetworkError(e)) throw e;
        const st = ms.status();
        if (st.name) opts = { ...opts, username: st.name };
        send('game:notice', 'ms.fallback');
        send('game:log', '[Zero] Microsoft unreachable, playing offline.\n');
      }
    }

    await core.play({ ...opts, auth, autoUpdate: settings.autoUpdate }, {
      progress: (label, pct) => send('game:progress', { label, pct }),
      log: (t) => send('game:log', t),
      started: () => {
        send('game:state', { state: 'running' });
        if (settings.hideOnLaunch && win) win.minimize();
      },
      exit: (code) => {
        send('game:state', { state: 'exit', code });
        if (win && !win.isDestroyed() && win.isMinimized()) win.restore();
      }
    });
    return { ok: true };
  } catch (e) {
    send('game:log', `[ERROR] ${e.stack || e.message}\n`);
    return { ok: false, error: e.message };
  }
});
ipcMain.handle('game:stop', () => { core.stop(); return true; });

/* Klasörler */
ipcMain.handle('folder:open', async (_e, { kind, mc, loader }) => {
  let p = BASE;
  if (kind === 'game' || kind === 'mods') {
    p = core.gameDirFor(mc || 'unknown', loader || 'vanilla');
    if (kind === 'mods') p = path.join(p, 'mods');
  }
  fs.mkdirSync(p, { recursive: true });
  return shell.openPath(p);
});
