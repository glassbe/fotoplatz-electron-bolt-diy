import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
    
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle saving photos
ipcMain.handle('save-photo', async (event, { dataUrl, fileName, directory }) => {
  try {
    let saveDirectory = directory;
    
    // If no directory is specified, ask the user
    if (!saveDirectory) {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      
      if (canceled) {
        return { success: false, message: 'Operation cancelled' };
      }
      
      saveDirectory = filePaths[0];
    }
    
    // Convert data URL to buffer
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Ensure filename has .jpg extension
    const finalFileName = fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`;
    const filePath = path.join(saveDirectory, finalFileName);
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    return { 
      success: true, 
      message: 'Photo saved successfully', 
      path: filePath,
      directory: saveDirectory
    };
  } catch (error) {
    console.error('Error saving photo:', error);
    return { 
      success: false, 
      message: `Error saving photo: ${error.message}` 
    };
  }
});

// Handle selecting directory
ipcMain.handle('select-directory', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (canceled) {
      return { success: false, message: 'Operation cancelled' };
    }
    
    return { 
      success: true, 
      directory: filePaths[0]
    };
  } catch (error) {
    console.error('Error selecting directory:', error);
    return { 
      success: false, 
      message: `Error selecting directory: ${error.message}` 
    };
  }
});
