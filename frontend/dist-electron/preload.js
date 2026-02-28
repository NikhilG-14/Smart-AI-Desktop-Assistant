"use strict";
/**
 * preload.ts
 *
 * Runs in a privileged context BEFORE the renderer page loads.
 * Use contextBridge to expose safe, limited APIs to your React app.
 * Never expose the full `ipcRenderer` object — only wrap specific channels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ─── Expose to Renderer ───────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        close: () => electron_1.ipcRenderer.invoke('window:close'),
    },
});
// ─── Global Type Augmentation ─────────────────────────────────────────────────
// Add this to a global.d.ts or vite-env.d.ts in your src folder:
//
// declare global {
//   interface Window {
//     electronAPI: import('../electron/preload').ElectronAPI;
//   }
// }
//# sourceMappingURL=preload.js.map