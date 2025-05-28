const { app, BrowserWindow, globalShortcut, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

class HotkeyFolderManager {
  constructor() {
    this.mainWindow = null;
    this.config = null;
    this.store = new Store({
      name: 'hotkey-folder-config',
      defaults: this.getHardcodedDefaults()
    });
  }

  async createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
      show: false
    });

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    await this.mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    // Load and register hotkeys
    await this.loadConfiguration();
    this.registerGlobalHotkeys();

    if (process.argv.includes('--dev')) {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  async loadConfiguration() {
    try {
      this.config = this.store.get('folders');
      
      if (!this.config) {
        throw new Error('No configuration found');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      
      // Load default configuration
      try {
        const defaultConfigPath = path.join(__dirname, 'config', 'default-config.json');
        const defaultConfigData = await fs.readFile(defaultConfigPath, 'utf8');
        const defaultConfig = JSON.parse(defaultConfigData);
        this.config = defaultConfig.folders;
        
        // Save default as user config
        this.store.set('folders', this.config);
      } catch (defaultError) {
        console.error('Failed to load default configuration:', defaultError);
        this.config = this.getHardcodedDefaults().folders;
        this.store.set('folders', this.config);
      }
    }
    
    // Send config to renderer
    if (this.mainWindow) {
      this.mainWindow.webContents.send('config-loaded', { folders: this.config });
    }
  }

  async saveConfiguration(newConfig) {
    try {
      this.config = newConfig.folders;
      this.store.set('folders', this.config);
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  registerGlobalHotkeys() {
    // Unregister existing hotkeys
    globalShortcut.unregisterAll();

    if (!this.config) return;

    Object.entries(this.config).forEach(([id, folder]) => {
      if (folder.hotkey && folder.path) {
        try {
          const success = globalShortcut.register(folder.hotkey, () => {
            this.openFolder(folder.path, folder.label);
          });
          
          if (!success) {
            console.warn(`Failed to register hotkey: ${folder.hotkey} for ${id}`);
          }
        } catch (error) {
          console.error(`Error registering hotkey ${folder.hotkey}:`, error);
        }
      }
    });
  }

  async openFolder(folderPath, label = '') {
    try {
      // Validate path exists
      await fs.access(folderPath);
      
      // Open in file explorer
      const result = await shell.openPath(folderPath);
      
      if (result) {
        console.error('Failed to open folder:', result);
        this.mainWindow?.webContents.send('folder-error', {
          path: folderPath,
          error: result
        });
      } else {
        console.log(`Opened folder: ${folderPath}`);
        this.mainWindow?.webContents.send('folder-opened', {
          path: folderPath,
          label: label
        });
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      this.mainWindow?.webContents.send('folder-error', {
        path: folderPath,
        error: error.message
      });
    }
  }

  getHardcodedDefaults() {
    return {
      folders: {
        ID1: { path: "", hotkey: "CommandOrControl+Alt+1", label: "Documents" },
        ID2: { path: "", hotkey: "CommandOrControl+Alt+2", label: "Downloads" },
        ID3: { path: "", hotkey: "CommandOrControl+Alt+3", label: "Desktop" },
        ID4: { path: "", hotkey: "CommandOrControl+Alt+4", label: "Projects" },
        ID5: { path: "", hotkey: "CommandOrControl+Alt+5", label: "Pictures" },
        ID6: { path: "", hotkey: "CommandOrControl+Alt+6", label: "Music" },
        ID7: { path: "", hotkey: "CommandOrControl+Alt+7", label: "Videos" },
        ID8: { path: "", hotkey: "CommandOrControl+Alt+8", label: "Folder 8" },
        ID9: { path: "", hotkey: "CommandOrControl+Alt+9", label: "Folder 9" },
        ID10: { path: "", hotkey: "CommandOrControl+Alt+0", label: "Folder 10" },
        ID11: { path: "", hotkey: "CommandOrControl+Alt+Minus", label: "Folder 11" },
        ID12: { path: "", hotkey: "CommandOrControl+Alt+Equal", label: "Folder 12" }
      }
    };
  }

  setupIPC() {
    // Handle configuration updates from renderer
    ipcMain.handle('save-config', async (event, newConfig) => {
      const success = await this.saveConfiguration(newConfig);
      if (success) {
        this.registerGlobalHotkeys();
      }
      return success;
    });

    // Handle folder opening requests from renderer
    ipcMain.handle('open-folder', async (event, folderPath, label) => {
      await this.openFolder(folderPath, label);
      return true;
    });

    // Handle folder browsing
    ipcMain.handle('browse-folder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      });
      
      if (result.canceled) {
        return null;
      }
      return result.filePaths[0];
    });

    // Handle configuration export
    ipcMain.handle('export-config', async () => {
      const savePath = await dialog.showSaveDialog(this.mainWindow, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        defaultPath: 'hotkey-folder-config.json'
      });
      
      if (savePath.canceled) {
        return false;
      }
      
      try {
        const configData = JSON.stringify({ folders: this.config }, null, 2);
        await fs.writeFile(savePath.filePath, configData);
        return true;
      } catch (error) {
        console.error('Export error:', error);
        return false;
      }
    });

    // Handle configuration import
    ipcMain.handle('import-config', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      });
      
      if (result.canceled) {
        return false;
      }
      
      try {
        const configData = await fs.readFile(result.filePaths[0], 'utf8');
        const importedConfig = JSON.parse(configData);
        
        if (importedConfig.folders) {
          this.config = importedConfig.folders;
          this.store.set('folders', this.config);
          this.registerGlobalHotkeys();
          this.mainWindow?.webContents.send('config-loaded', { folders: this.config });
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Import error:', error);
        return false;
      }
    });

    // Send initial config when renderer is ready
    ipcMain.handle('get-config', () => {
      return { folders: this.config };
    });
  }
}

// Application lifecycle
const manager = new HotkeyFolderManager();

app.whenReady().then(() => {
  manager.setupIPC();
  manager.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      manager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
