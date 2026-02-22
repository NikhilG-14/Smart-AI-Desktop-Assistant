import { app, BrowserWindow, ipcMain, shell, globalShortcut, systemPreferences } from 'electron';
import path from 'path';

// The Main Process
// This controls the lifecycle of the application and native OS interactions.

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'VANINI',
    frame: true, // We can make this false for a custom UI later
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset', // Mac style
    backgroundColor: '#000000',
  });

  // Load the React app
  // In dev: load from local Vite server
  // In prod: load from index.html
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Global Shortcut for Background Activation
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('activate-mic');
    }
  });
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    const status = await systemPreferences.askForMediaAccess('microphone');
    console.log('Microphone access:', status);
  }
  createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

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
