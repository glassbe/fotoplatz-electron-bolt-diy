const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  savePhoto: (data) => ipcRenderer.invoke('save-photo', data),
  selectDirectory: () => ipcRenderer.invoke('select-directory')
});

console.log('Preload script loaded successfully');
