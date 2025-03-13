import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  savePhoto: (data) => ipcRenderer.invoke('save-photo', data),
  selectDirectory: () => ipcRenderer.invoke('select-directory')
});
