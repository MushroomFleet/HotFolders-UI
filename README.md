# Hotkey Folder Manager

![Hotkey Folder Manager](https://via.placeholder.com/800x450.png?text=Hotkey+Folder+Manager)

A powerful desktop application that provides quick access to your frequently used folders through a visual interface and global hotkeys. The application features a 6×2 button grid with user-configurable folder paths, making it easy to organize and access your important directories with just a keystroke.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
  - [Main Interface](#main-interface)
  - [Configuration Panel](#configuration-panel)
  - [Using Hotkeys](#using-hotkeys)
  - [Import and Export](#import-and-export)
- [Step-by-Step Examples](#step-by-step-examples)
- [Troubleshooting](#troubleshooting)
- [Advanced Tips](#advanced-tips)
- [Technical Details](#technical-details)

## Features

- **Visual Folder Grid**: 12 configurable folder slots (6×2 grid) for easy access
- **Global Hotkeys**: Open folders directly with keyboard shortcuts from anywhere in Windows
- **Customizable Labels**: Give each folder a meaningful name
- **File Explorer Integration**: Opens the native Windows File Explorer
- **Configuration Import/Export**: Share your setup or back it up easily
- **Persistent Settings**: Your configuration is saved between sessions
- **Portable Application**: No installation required, just run the executable

## Installation

Hotkey Folder Manager is a portable application, which means no installation is required.

1. Download the latest version of `Hotkey Folder Manager.exe` from the dist folder
2. Copy the executable to any location on your computer
3. Double-click the executable to run the application
4. (Optional) Create a shortcut to the executable on your desktop or taskbar for easy access

**System Requirements:**
- Windows 10 or higher
- 100MB of free disk space
- Administrative privileges (for global hotkey registration)

## Getting Started

When you first launch Hotkey Folder Manager, you'll see a grid of 12 empty folder slots. Here's how to get started:

1. Click the **Show Config** button to open the configuration panel
2. Select a folder slot from the dropdown menu
3. Enter a label for the folder (e.g., "Documents")
4. Set the folder path either by typing it manually or using the browse button
5. Verify the hotkey is set to your preference
6. Close the configuration panel by clicking **Hide Config**
7. Test your setup by clicking the folder button or using the assigned hotkey

## Usage Guide

### Main Interface

The main interface consists of:

- **Header**: Displays the application title
- **Control Buttons**: Show/Hide Config, Export Config, Import Config
- **Folder Grid**: 6×2 grid of folder buttons
- **Status Bar**: Displays messages and operation results

Each folder button shows:
- The folder ID (e.g., ID1, ID2)
- The custom label you've assigned
- The folder path (truncated if too long)
- The assigned hotkey in the top-right corner

Buttons with configured paths will appear in green, while unconfigured buttons appear in gray.

### Configuration Panel

To configure a folder:

1. Click **Show Config** to open the configuration panel
2. Select a folder slot from the dropdown menu
3. Configure the following:
   - **Label**: A descriptive name for the folder
   - **Folder Path**: The full path to the folder you want to access
   - **Hotkey**: The keyboard shortcut to open the folder

**Path Input Options:**
- Type the path manually (e.g., `C:\Users\YourName\Documents`)
- Click the folder icon button to browse and select a folder

**Hotkey Format:**
- Hotkeys use the format: `CommandOrControl+Alt+[KEY]`
- Examples:
  - `CommandOrControl+Alt+1` (Uses Ctrl+Alt+1 on Windows)
  - `CommandOrControl+Alt+D` (Uses Ctrl+Alt+D on Windows)
  - `CommandOrControl+Alt+Minus` (Uses Ctrl+Alt+- on Windows)
  - `CommandOrControl+Alt+Equal` (Uses Ctrl+Alt+= on Windows)

The configuration panel also shows all active hotkeys for quick reference.

### Using Hotkeys

Once configured, you can use the assigned hotkeys to open folders from anywhere in Windows, even when the application is minimized or in the background.

- Press the configured hotkey combination (e.g., `Ctrl+Alt+1`)
- The folder will open in a new Windows File Explorer window
- The status bar will update to show which folder was opened

**Note**: If a hotkey isn't working, make sure it doesn't conflict with system hotkeys or hotkeys from other applications.

### Import and Export

You can export your configuration to share it with others or to back it up:

1. Click the **Export Config** button
2. Choose a location and filename for the JSON configuration file
3. Click Save

To import a configuration:

1. Click the **Import Config** button
2. Browse to and select a previously exported JSON configuration file
3. Click Open
4. The configuration will be loaded and applied immediately

## Step-by-Step Examples

### Example 1: Setting Up Your Documents Folder

1. Launch Hotkey Folder Manager
2. Click **Show Config**
3. Select "ID1" from the dropdown
4. Set the Label to "Documents"
5. Click the folder browse button
6. Navigate to your Documents folder and select it
7. Verify the hotkey is set to `CommandOrControl+Alt+1`
8. Click **Hide Config**
9. Test by clicking the button or pressing Ctrl+Alt+1

### Example 2: Creating a Project Workspace

Setting up quick access to multiple project folders:

1. Configure ID4 with:
   - Label: "Current Project"
   - Path: `C:\Projects\CurrentProject`
   - Hotkey: `CommandOrControl+Alt+4`

2. Configure ID5 with:
   - Label: "Resources"
   - Path: `C:\Projects\Resources`
   - Hotkey: `CommandOrControl+Alt+5`

3. Configure ID6 with:
   - Label: "Backups"
   - Path: `C:\Projects\Backups`
   - Hotkey: `CommandOrControl+Alt+6`

Now you can quickly switch between these related folders using the configured hotkeys.

### Example 3: Transferring Your Configuration to Another Computer

1. On your first computer, click **Export Config**
2. Save the configuration file (e.g., `my-folders.json`)
3. Copy the executable and the configuration file to a USB drive
4. On the second computer, copy both files
5. Run the application and click **Import Config**
6. Select your saved configuration file
7. All your folder paths and hotkeys will be loaded

## Troubleshooting

### Common Issues

**Issue**: Hotkey doesn't work
- **Solution**: Ensure the hotkey doesn't conflict with other applications or system shortcuts
- **Solution**: Try restarting the application to refresh the hotkey registration

**Issue**: Path not found error
- **Solution**: Verify the folder path exists on your computer
- **Solution**: If using a network path, ensure you have network connectivity

**Issue**: Configuration won't save
- **Solution**: Ensure you have write permissions to the application directory
- **Solution**: Try running the application as administrator

**Issue**: Export/Import not working
- **Solution**: Ensure you have permission to read/write to the selected location
- **Solution**: Check that the imported file is a valid configuration file

## Advanced Tips

- **Path Variables**: You can use environment variables in paths like `%USERPROFILE%\Documents`
- **Network Folders**: Map network drives for faster access through the application
- **Workflow Optimization**: Group related folders in adjacent slots for logical organization
- **Regular Backups**: Export your configuration regularly to avoid losing your setup

## Technical Details

- Configuration is stored in a JSON file format
- User settings are saved in the AppData directory
- The application uses Electron for cross-platform compatibility
- Global hotkeys are registered at the OS level
- The application implements secure IPC communication between processes

---

Hotkey Folder Manager is designed to make your file navigation faster and more efficient. We hope it helps boost your productivity!
