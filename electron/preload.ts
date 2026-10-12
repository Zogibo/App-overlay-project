import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  onPythonData: (callback: (data: any) => void) => {
    ipcRenderer.on('python-data', (_event, data) => callback(data))
  },
  onGearShow: (callback: () => void) => {
    ipcRenderer.on('gear-show', () => callback())
  },
  onGearHide: (callback: () => void) => {
    ipcRenderer.on('gear-hide', () => callback())
  },
  pickApp: () => ipcRenderer.invoke('pick-app'),
  launchApp: (path: string) => ipcRenderer.invoke('launch-app', path)
})