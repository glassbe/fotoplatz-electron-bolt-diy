const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

// __dirname is already available in CommonJS

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = isDev 
    ? 'http://localhost:5178'  
    : `file://${path.join(__dirname, '../dist/index.html')}`;
    
  console.log('Loading URL:', startUrl);
  console.log('Is Dev Mode:', isDev);
  console.log('__dirname:', __dirname);
  console.log('Dist path:', path.join(__dirname, '../dist/index.html'));
  console.log('Dist path exists:', fs.existsSync(path.join(__dirname, '../dist/index.html')));

  mainWindow.loadURL(startUrl).catch((err) => {
    console.error('Error loading URL:', err);
    // Fallback to a default error page or retry mechanism
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorDescription);
  });

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
    console.log('Select directory called');
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    console.log('Dialog result:', { canceled, filePaths });
    
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
