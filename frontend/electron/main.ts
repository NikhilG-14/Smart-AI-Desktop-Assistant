import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Environment ──────────────────────────────────────────────────────────────

const isDev  = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5173';

// ─── Window Reference ─────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

// ─── Create Window ────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    // ── Size ────────────────────────────────────────────────────────────────
    width:     1280,
    height:    800,
    minWidth:  900,    // Prevents layout from breaking at small widths
    minHeight: 600,

    // ── Appearance ──────────────────────────────────────────────────────────
    // Match bg-[#080b12] — eliminates white flash before React mounts
    backgroundColor: '#080b12',

    // Set to false and build your own titlebar in React for a seamless look,
    // or keep true for native OS chrome.
    frame:     true,

    // macOS: hides native traffic lights so you can render custom ones
    // titleBarStyle: 'hiddenInset',

    // ── Security / Web ──────────────────────────────────────────────────────
    webPreferences: {
      // SECURITY: never enable nodeIntegration in production
      nodeIntegration:  false,
      // SECURITY: always enable contextIsolation
      contextIsolation: true,
      // Path to your preload script — exposes safe APIs to renderer
      preload: path.join(__dirname, 'preload.js'),
      // Allow DevTools in dev
      devTools: isDev,
      // Disable web security only if you absolutely must (avoid in prod)
      webSecurity: true,
    },

    // ── Show only when ready ─────────────────────────────────────────────
    show: false,
  });

  // Show window once DOM is ready — prevents visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in OS browser, not Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window on dock click if none open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
// Add your main-process IPC handlers here.
// Example: expose system info, file system access, etc.

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());