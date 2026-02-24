/**
 * preload.ts
 *
 * Runs in a privileged context BEFORE the renderer page loads.
 * Use contextBridge to expose safe, limited APIs to your React app.
 * Never expose the full `ipcRenderer` object — only wrap specific channels.
 */
import { contextBridge, ipcRenderer } from 'electron';
// ─── Expose to Renderer ───────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('app:version'),
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
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