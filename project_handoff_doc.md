# Hotkey Folder Manager - Project Handoff Documentation

## 📋 Project Overview

A desktop application that provides quick access to frequently used folders through a visual interface and global hotkeys. The application features a 6×2 button grid (ID1-ID12) with user-configurable folder paths stored in JSON format.

### Core Requirements
- **UI Layout**: 6×2 grid of folder buttons (12 total slots)
- **Configuration**: JSON-based folder path and hotkey configuration
- **Hotkeys**: Global hotkey support for instant folder access
- **File Explorer Integration**: Open native file explorer windows
- **Persistence**: Save/load configuration between sessions
- **Export/Import**: Configuration backup and sharing

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│             Electron App                │
├─────────────────────────────────────────┤
│  Main Process (Node.js)                │
│  ├─ Global Hotkey Registration         │
│  ├─ File System Operations             │
│  ├─ Window Management                  │
│  └─ IPC Communication                  │
├─────────────────────────────────────────┤
│  Renderer Process (React)              │
│  ├─ UI Components                      │
│  ├─ Configuration Management           │
│  ├─ Local State Management             │
│  └─ Event Handling                     │
└─────────────────────────────────────────┘
```

## 📁 Recommended File Structure

```
hotkey-folder-manager/
├── package.json
├── electron.js                    # Main Electron process
├── preload.js                     # Secure IPC bridge
├── src/
│   ├── index.html                 # Main application window
│   ├── styles/
│   │   └── main.css              # Application styles
│   └── js/
│       └── app.js                # React application logic
├── assets/
│   └── icons/                    # Application icons
├── config/
│   └── default-config.json       # Default folder configuration
└── dist/                         # Build output directory
```

## 🔧 Implementation Guide

### 1. Package.json Setup

```json
{
  "name": "hotkey-folder-manager",
  "version": "1.0.0",
  "description": "Quick folder access with global hotkeys",
  "main": "electron.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dev": "electron . --dev"
  },
  "dependencies": {
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.6.4"
  },
  "build": {
    "appId": "com.yourcompany.hotkey-folder-manager",
    "productName": "Hotkey Folder Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron.js",
      "preload.js",
      "src/**/*",
      "config/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### 2. Main Electron Process (electron.js)

```javascript
const { app, BrowserWindow, globalShortcut, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class HotkeyFolderManager {
  constructor() {
    this.mainWindow = null;
    this.config = null;
    this.configPath = path.join(app.getPath('userData'), 'config.json');
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
      titleBarStyle: 'hiddenInset', // macOS
      frame: true,
      resizable: true
    });

    await this.mainWindow.loadFile('src/index.html');
    
    // Load and register hotkeys
    await this.loadConfiguration();
    this.registerGlobalHotkeys();

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  async loadConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      // Load default configuration
      const defaultConfigPath = path.join(__dirname, 'config', 'default-config.json');
      try {
        const defaultConfig = await fs.readFile(defaultConfigPath, 'utf8');
        this.config = JSON.parse(defaultConfig);
        await this.saveConfiguration(); // Save default as user config
      } catch (defaultError) {
        console.error('Failed to load default configuration:', defaultError);
        this.config = this.getHardcodedDefaults();
      }
    }
    
    // Send config to renderer
    if (this.mainWindow) {
      this.mainWindow.webContents.send('config-loaded', this.config);
    }
  }

  async saveConfiguration() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  registerGlobalHotkeys() {
    // Unregister existing hotkeys
    globalShortcut.unregisterAll();

    if (!this.config || !this.config.folders) return;

    Object.entries(this.config.folders).forEach(([id, folder]) => {
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
        ID1: { path: "", hotkey: "CommandOrControl+Alt+1", label: "Folder 1" },
        ID2: { path: "", hotkey: "CommandOrControl+Alt+2", label: "Folder 2" },
        ID3: { path: "", hotkey: "CommandOrControl+Alt+3", label: "Folder 3" },
        ID4: { path: "", hotkey: "CommandOrControl+Alt+4", label: "Folder 4" },
        ID5: { path: "", hotkey: "CommandOrControl+Alt+5", label: "Folder 5" },
        ID6: { path: "", hotkey: "CommandOrControl+Alt+6", label: "Folder 6" },
        ID7: { path: "", hotkey: "CommandOrControl+Alt+7", label: "Folder 7" },
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
      this.config = newConfig;
      const success = await this.saveConfiguration();
      if (success) {
        this.registerGlobalHotkeys();
      }
      return success;
    });

    // Handle folder opening requests from renderer
    ipcMain.handle('open-folder', async (event, folderPath, label) => {
      await this.openFolder(folderPath, label);
    });

    // Handle configuration export
    ipcMain.handle('export-config', async () => {
      return this.config;
    });

    // Handle configuration import
    ipcMain.handle('import-config', async (event, importedConfig) => {
      try {
        this.config = importedConfig;
        const success = await this.saveConfiguration();
        if (success) {
          this.registerGlobalHotkeys();
          this.mainWindow?.webContents.send('config-loaded', this.config);
        }
        return success;
      } catch (error) {
        console.error('Import error:', error);
        return false;
      }
    });

    // Send initial config when renderer is ready
    ipcMain.handle('get-config', () => {
      return this.config;
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
```

### 3. Preload Script (preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration management
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: (config) => ipcRenderer.invoke('import-config', config),
  
  // Folder operations
  openFolder: (path, label) => ipcRenderer.invoke('open-folder', path, label),
  
  // Event listeners
  onConfigLoaded: (callback) => {
    ipcRenderer.on('config-loaded', (event, config) => callback(config));
  },
  onFolderOpened: (callback) => {
    ipcRenderer.on('folder-opened', (event, data) => callback(data));
  },
  onFolderError: (callback) => {
    ipcRenderer.on('folder-error', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
```

### 4. Updated React Application (src/js/app.js)

```javascript
// Key changes to the existing React code for Electron integration

// Replace the openFolder function with:
const openFolder = async (id, folder) => {
  if (!folder.path) {
    setStatus(`${id}: No path configured`);
    return;
  }

  setStatus(`Opening ${folder.label}: ${folder.path}`);
  
  try {
    await window.electronAPI.openFolder(folder.path, folder.label);
  } catch (error) {
    setStatus(`Error opening ${folder.label}: ${error.message}`);
  }
};

// Update the configuration loading:
useEffect(() => {
  const loadConfig = async () => {
    try {
      const electronConfig = await window.electronAPI.getConfig();
      if (electronConfig) {
        setConfig(electronConfig);
      }
    } catch (error) {
      console.error('Failed to load Electron config:', error);
      // Fallback to localStorage
      const savedConfig = localStorage.getItem('folderManagerConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }
  };

  loadConfig();

  // Listen for config updates from main process
  window.electronAPI?.onConfigLoaded((newConfig) => {
    setConfig(newConfig);
  });

  // Listen for folder operation results
  window.electronAPI?.onFolderOpened((data) => {
    setStatus(`Opened: ${data.label || data.path}`);
  });

  window.electronAPI?.onFolderError((data) => {
    setStatus(`Error: Could not open ${data.path} - ${data.error}`);
  });

  return () => {
    window.electronAPI?.removeAllListeners('config-loaded');
    window.electronAPI?.removeAllListeners('folder-opened');
    window.electronAPI?.removeAllListeners('folder-error');
  };
}, []);

// Update the saveConfig function:
const saveConfig = useCallback(async (newConfig) => {
  try {
    if (window.electronAPI) {
      const success = await window.electronAPI.saveConfig(newConfig);
      if (success) {
        setConfig(newConfig);
        setStatus("Configuration saved!");
      } else {
        setStatus("Failed to save configuration");
      }
    } else {
      // Fallback for web version
      localStorage.setItem('folderManagerConfig', JSON.stringify(newConfig));
      setConfig(newConfig);
      setStatus("Configuration saved locally!");
    }
  } catch (error) {
    setStatus("Error saving configuration");
    console.error('Save error:', error);
  }
}, []);
```

### 5. Default Configuration (config/default-config.json)

```json
{
  "folders": {
    "ID1": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+1",
      "label": "Documents"
    },
    "ID2": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+2", 
      "label": "Downloads"
    },
    "ID3": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+3",
      "label": "Desktop"
    },
    "ID4": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+4",
      "label": "Projects"
    },
    "ID5": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+5",
      "label": "Pictures"
    },
    "ID6": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+6",
      "label": "Music"
    },
    "ID7": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+7",
      "label": "Videos"
    },
    "ID8": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+8",
      "label": "Folder 8"
    },
    "ID9": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+9",
      "label": "Folder 9"
    },
    "ID10": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+0",
      "label": "Folder 10"
    },
    "ID11": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+Minus",
      "label": "Folder 11"
    },
    "ID12": {
      "path": "",
      "hotkey": "CommandOrControl+Alt+Equal",
      "label": "Folder 12"
    }
  }
}
```

## 🚀 Development Workflow

### Initial Setup
```bash
# 1. Create project directory
mkdir hotkey-folder-manager
cd hotkey-folder-manager

# 2. Initialize npm project
npm init -y

# 3. Install Electron
npm install electron --save-dev
npm install electron-builder --save-dev

# 4. Create file structure
mkdir -p src/js src/styles config assets/icons

# 5. Copy provided files to appropriate locations
```

### Development Commands
```bash
# Run in development mode
npm run dev

# Build for distribution
npm run build

# Start application
npm start
```

### Testing Checklist

#### Functionality Tests
- [ ] All 12 folder buttons display correctly
- [ ] Configuration panel loads and saves settings
- [ ] Hotkeys register and trigger folder opening
- [ ] File explorer opens to correct folders
- [ ] Import/Export functionality works
- [ ] Application persists settings between restarts

#### Cross-Platform Tests
- [ ] Windows: Hotkeys work globally, file explorer opens
- [ ] macOS: Command key combinations work, Finder opens
- [ ] Linux: Hotkeys work, file manager opens

#### Edge Cases
- [ ] Invalid folder paths show appropriate errors
- [ ] Duplicate hotkeys are handled gracefully
- [ ] Large configuration files import correctly
- [ ] Application handles missing permissions

## 🔒 Security Considerations

### Context Isolation
- Use `contextIsolation: true` in webPreferences
- Implement secure IPC communication via preload scripts
- Validate all file paths before opening

### Path Validation
```javascript
const path = require('path');
const fs = require('fs').promises;

async function validatePath(folderPath) {
  try {
    const resolvedPath = path.resolve(folderPath);
    await fs.access(resolvedPath);
    return { valid: true, path: resolvedPath };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

## 📦 Distribution

### Build Configuration
The provided `package.json` includes electron-builder configuration for:
- **Windows**: NSIS installer
- **macOS**: DMG package  
- **Linux**: AppImage

### Release Process
1. Update version in `package.json`
2. Run `npm run build`
3. Test built application on target platforms
4. Distribute via appropriate channels

## 🐛 Known Issues & Limitations

### Current Limitations
- Maximum 12 folder slots (easily expandable)
- Global hotkeys may conflict with other applications
- File paths must be manually entered (no folder picker yet)

### Future Enhancements
- Folder picker dialog integration
- Drag-and-drop folder configuration  
- Custom hotkey recording interface
- Folder usage analytics
- Theme customization options

## 📞 Support & Handoff Notes

### Key Integration Points
1. **Main Process**: Handles global hotkeys and file operations
2. **Renderer Process**: Manages UI and configuration
3. **IPC Bridge**: Secure communication between processes
4. **Configuration**: JSON-based with automatic persistence

### Development Environment
- Node.js 18+ recommended
- Electron 28+ for latest security features
- Test on all target platforms before release

### Additional Resources
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Integration Guide](https://www.electronjs.org/docs/tutorial/tutorial-react)
- [Global Shortcuts API](https://www.electronjs.org/docs/api/global-shortcut)

The provided working HTML prototype contains the complete UI implementation and can be directly integrated into the Electron application with minimal modifications.