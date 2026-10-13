'use strict';
const { contextBridge, ipcRenderer, webFrame } = require('electron');

const on = (ch, cb) => {
  const fn = (_e, p) => cb(p);
  ipcRenderer.on(ch, fn);
  return () => ipcRenderer.removeListener(ch, fn);
};

contextBridge.exposeInMainWorld('zero', {
  win: {
    min: () => ipcRenderer.send('win:min'),
    max: () => ipcRenderer.send('win:max'),
    close: () => ipcRenderer.send('win:close')
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  sysInfo: () => ipcRenderer.invoke('sys:info'),
  setZoom: (f) => webFrame.setZoomFactor(Math.max(0.8, Math.min(1.3, Number(f) || 1))),
  bg: {
    get: () => ipcRenderer.invoke('bg:get'),
    choose: () => ipcRenderer.invoke('bg:choose'),
    clear: () => ipcRenderer.invoke('bg:clear')
  },
  listVersions: (loader) => ipcRenderer.invoke('versions:list', loader),
  mrSearch: (a) => ipcRenderer.invoke('mr:search', a),
  mrInstall: (a) => ipcRenderer.invoke('mr:install', a),
  mrInstalled: (a) => ipcRenderer.invoke('mr:installed', a),
  mrRemove: (a) => ipcRenderer.invoke('mr:remove', a),
  mrUpdates: (a) => ipcRenderer.invoke('mr:updates', a),
  ms: {
    status: () => ipcRenderer.invoke('ms:status'),
    login: () => ipcRenderer.invoke('ms:login'),
    cancel: () => ipcRenderer.invoke('ms:cancel'),
    logout: () => ipcRenderer.invoke('ms:logout'),
    open: () => ipcRenderer.invoke('ms:open'),
    onCode: (cb) => on('ms:code', cb)
  },
  play: (opts) => ipcRenderer.invoke('game:play', opts),
  stop: () => ipcRenderer.invoke('game:stop'),
  openFolder: (o) => ipcRenderer.invoke('folder:open', o),
  onProgress: (cb) => on('game:progress', cb),
  onLog: (cb) => on('game:log', cb),
  onState: (cb) => on('game:state', cb),
  onNotice: (cb) => on('game:notice', cb)
});
