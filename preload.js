const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration management
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Folder operations
  openFolder: (path, label) => ipcRenderer.invoke('open-folder', path, label),
  browseFolder: () => ipcRenderer.invoke('browse-folder'),
  
  // Configuration import/export
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  
  // Event listeners
  onConfigLoaded: (callback) => {
    ipcRenderer.on('config-loaded', (event, config) => callback(config));
    return () => ipcRenderer.removeListener('config-loaded', callback);
  },
  onFolderOpened: (callback) => {
    ipcRenderer.on('folder-opened', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('folder-opened', callback);
  },
  onFolderError: (callback) => {
    ipcRenderer.on('folder-error', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('folder-error', callback);
  }
});
