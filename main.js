'use strict';
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const core = require('./core');

const BASE = path.join(app.getPath('appData'), '.zerolauncher');
const SETTINGS = path.join(BASE, 'settings.json');
core.init(BASE);

const defaults = {
  username: 'Player' + Math.floor(Math.random() * 900 + 100),
  ram: 4096,
  loader: 'vanilla',
  mc: null,
  hideOnLaunch: true,
  snapshots: false
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
    minHeight: 640,
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { core.stop(); app.quit(); });

/* Pencere */
ipcMain.on('win:min', () => win.minimize());
ipcMain.on('win:max', () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
ipcMain.on('win:close', () => win.close());

/* Ayarlar */
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:set', (_e, patch) => saveSettings(patch));
ipcMain.handle('sys:info', () => ({ totalMem: Math.floor(os.totalmem() / 1048576), version: app.getVersion() }));

/* Sürümler */
ipcMain.handle('versions:list', async (_e, loader) => {
  try { return await core.listVersions(loader); }
  catch (e) { return { online: false, versions: [], error: e.message }; }
});

/* Oyun */
ipcMain.handle('game:play', async (_e, opts) => {
  try {
    saveSettings({ username: opts.username, ram: opts.ram, loader: opts.loader, mc: opts.mc });
    await core.play(opts, {
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
    send('game:log', `[HATA] ${e.stack || e.message}\n`);
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
