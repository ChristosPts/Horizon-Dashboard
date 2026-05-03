import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize:    () => ipcRenderer.send('window:minimize'),
  maximize:    () => ipcRenderer.send('window:maximize'),
  close:       () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // electron-store persistence
  storeGet:    (key)        => ipcRenderer.invoke('store:get', key),
  storeSet:    (key, value) => ipcRenderer.invoke('store:set', key, value),
  storeDelete: (key)        => ipcRenderer.invoke('store:delete', key),
  storeClear:  ()           => ipcRenderer.invoke('store:clear'),

  // Shell
  openExternal: (url) => ipcRenderer.send('shell:openExternal', url),

  // Window material (acrylic toggle)
  setWindowMaterial: (material) => ipcRenderer.send('window:setMaterial', material),

  // Gmail OAuth + API (all sensitive work happens in main process)
  gmail: {
    authenticate:  (accountId)           => ipcRenderer.invoke('gmail:authenticate', accountId),
    fetchEmails:   (opts)                => ipcRenderer.invoke('gmail:fetchEmails', opts),
    revokeAccount: (accountId)           => ipcRenderer.invoke('gmail:revokeAccount', accountId),
  },
})
