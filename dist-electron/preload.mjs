"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  onPythonData: (callback) => {
    electron.ipcRenderer.on("python-data", (_event, data) => callback(data));
  },
  onGearShow: (callback) => {
    electron.ipcRenderer.on("gear-show", () => callback());
  },
  onGearHide: (callback) => {
    electron.ipcRenderer.on("gear-hide", () => callback());
  },
  pickApp: () => electron.ipcRenderer.invoke("pick-app"),
  launchApp: (path) => electron.ipcRenderer.invoke("launch-app", path)
});
