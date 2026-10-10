'use strict';
const { contextBridge, ipcRenderer } = require('electron');

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
  listVersions: (loader) => ipcRenderer.invoke('versions:list', loader),
  play: (opts) => ipcRenderer.invoke('game:play', opts),
  stop: () => ipcRenderer.invoke('game:stop'),
  openFolder: (o) => ipcRenderer.invoke('folder:open', o),
  onProgress: (cb) => on('game:progress', cb),
  onLog: (cb) => on('game:log', cb),
  onState: (cb) => on('game:state', cb)
});
