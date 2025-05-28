const { useState, useEffect, useCallback } = React;

function HotkeyFolderManager() {
    const [config, setConfig] = useState({ folders: {} });
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [status, setStatus] = useState("Ready - Click a folder button or use hotkeys");

    // Load configuration from Electron
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const electronConfig = await window.electronAPI.getConfig();
                if (electronConfig) {
                    setConfig(electronConfig);
                }
            } catch (error) {
                console.error('Failed to load Electron config:', error);
                setStatus("Error loading configuration");
            }
        };

        loadConfig();

        // Set up event listeners
        const removeConfigListener = window.electronAPI.onConfigLoaded((newConfig) => {
            setConfig(newConfig);
            setStatus("Configuration loaded");
        });

        const removeFolderOpenedListener = window.electronAPI.onFolderOpened((data) => {
            setStatus(`Opened: ${data.label || data.path}`);
        });

        const removeFolderErrorListener = window.electronAPI.onFolderError((data) => {
            setStatus(`Error: Could not open ${data.path} - ${data.error}`);
        });

        // Cleanup listeners on unmount
        return () => {
            removeConfigListener && removeConfigListener();
            removeFolderOpenedListener && removeFolderOpenedListener();
            removeFolderErrorListener && removeFolderErrorListener();
        };
    }, []);

    // Open folder function
    const openFolder = async (id, folder) => {
        if (!folder.path) {
            setStatus(`${id}: No path configured`);
            return;
        }

        setStatus(`Opening ${folder.label}: ${folder.path}`);
        
        try {
            await window.electronAPI.openFolder(folder.path, folder.label);
        } catch (error) {
            setStatus(`Error opening ${folder.label}: ${error}`);
        }
    };

    // Update folder configuration
    const updateFolder = (id, updates) => {
        const newConfig = {
            ...config,
            folders: {
                ...config.folders,
                [id]: { ...config.folders[id], ...updates }
            }
        };
        saveConfig(newConfig);
    };

    // Save configuration
    const saveConfig = useCallback(async (newConfig) => {
        try {
            const success = await window.electronAPI.saveConfig(newConfig);
            if (success) {
                setConfig(newConfig);
                setStatus("Configuration saved!");
            } else {
                setStatus("Failed to save configuration");
            }
        } catch (error) {
            setStatus("Error saving configuration");
            console.error('Save error:', error);
        }
    }, []);

    // Browse for folder
    const browseForFolder = async () => {
        if (!selectedFolder) return;
        
        try {
            const folderPath = await window.electronAPI.browseFolder();
            if (folderPath) {
                updateFolder(selectedFolder, { path: folderPath });
            }
        } catch (error) {
            setStatus("Error browsing for folder");
            console.error('Browse error:', error);
        }
    };

    // Export configuration
    const exportConfig = async () => {
        try {
            const success = await window.electronAPI.exportConfig();
            if (success) {
                setStatus("Configuration exported successfully!");
            } else {
                setStatus("Export canceled or failed");
            }
        } catch (error) {
            setStatus("Error exporting configuration");
            console.error('Export error:', error);
        }
    };

    // Import configuration
    const importConfig = async () => {
        try {
            const success = await window.electronAPI.importConfig();
            if (success) {
                setStatus("Configuration imported successfully!");
            } else {
                setStatus("Import canceled or failed");
            }
        } catch (error) {
            setStatus("Error importing configuration");
            console.error('Import error:', error);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-rocket"></i> Hotkey Folder Manager</h1>
                <p>Quick access to your favorite folders with customizable hotkeys</p>
            </div>

            <div className="controls">
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowConfig(!showConfig)}
                >
                    <i className="fas fa-cog"></i>
                    {showConfig ? 'Hide Config' : 'Show Config'}
                </button>
                <button 
                    className="btn btn-secondary"
                    onClick={exportConfig}
                >
                    <i className="fas fa-download"></i>
                    Export Config
                </button>
                <button 
                    className="btn btn-secondary"
                    onClick={importConfig}
                >
                    <i className="fas fa-upload"></i>
                    Import Config
                </button>
            </div>

            <div className="grid-container">
                {Object.entries(config.folders || {}).map(([id, folder]) => (
                    <div
                        key={id}
                        className={`folder-btn ${folder.path ? 'configured' : ''}`}
                        onClick={() => openFolder(id, folder)}
                        title={folder.path || 'Not configured'}
                    >
                        <div className="folder-hotkey">{folder.hotkey}</div>
                        <div className="folder-icon">
                            <i className={folder.path ? "fas fa-folder" : "far fa-folder"}></i>
                        </div>
                        <div className="folder-id">{id}</div>
                        <div className="folder-label">{folder.label}</div>
                        {folder.path && (
                            <div className="folder-path">
                                {folder.path.length > 30 ? 
                                    '...' + folder.path.slice(-27) : 
                                    folder.path
                                }
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showConfig && (
                <div className="config-panel">
                    <h3><i className="fas fa-sliders-h"></i> Configuration Panel</h3>
                    
                    <div style={{marginBottom: '20px'}}>
                        <label style={{marginBottom: '10px', display: 'block'}}>Select Folder to Configure:</label>
                        <select 
                            value={selectedFolder || ''}
                            onChange={(e) => setSelectedFolder(e.target.value || null)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '2px solid #e9ecef',
                                borderRadius: '6px',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="">Choose a folder slot...</option>
                            {Object.keys(config.folders || {}).map(id => (
                                <option key={id} value={id}>
                                    {id} - {config.folders[id].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedFolder && (
                        <div>
                            <div className="form-group">
                                <label>Label:</label>
                                <input
                                    type="text"
                                    value={config.folders[selectedFolder].label}
                                    onChange={(e) => updateFolder(selectedFolder, { label: e.target.value })}
                                    placeholder="Enter folder label"
                                />
                            </div>
                            <div className="form-group">
                                <label>Folder Path:</label>
                                <div className="path-input-container">
                                    <input
                                        type="text"
                                        value={config.folders[selectedFolder].path}
                                        onChange={(e) => updateFolder(selectedFolder, { path: e.target.value })}
                                        placeholder="e.g., C:\\Users\\YourName\\Documents"
                                    />
                                    <button onClick={browseForFolder}>
                                        <i className="fas fa-folder-open"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Hotkey:</label>
                                <input
                                    type="text"
                                    value={config.folders[selectedFolder].hotkey}
                                    onChange={(e) => updateFolder(selectedFolder, { hotkey: e.target.value })}
                                    placeholder="e.g., CommandOrControl+Alt+1"
                                />
                            </div>
                        </div>
                    )}

                    <div className="hotkey-display">
                        <h4><i className="fas fa-keyboard"></i> Active Hotkeys</h4>
                        <div className="hotkey-list">
                            {Object.entries(config.folders || {})
                                .filter(([id, folder]) => folder.path)
                                .map(([id, folder]) => (
                                <div key={id} className="hotkey-item">
                                    <span>{folder.label}</span>
                                    <span className="hotkey-key">{folder.hotkey}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="status-bar">
                <i className="fas fa-info-circle"></i> Status: {status}
            </div>
        </div>
    );
}

ReactDOM.render(<HotkeyFolderManager />, document.getElementById('root'));
