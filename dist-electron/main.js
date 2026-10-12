import { app, ipcMain, dialog, shell, screen, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { uIOhook, UiohookKey } from "uiohook-napi";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
let win;
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    show: false,
    opacity: 0,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
      //run preload.mjs first
    }
  });
  win.webContents.openDevTools({ mode: "detach" });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
function fadeWindow(show) {
  const step = 0.1;
  const intervalTime = 15;
  if (show) {
    win.showInactive();
  }
  const interval = setInterval(() => {
    const current = win.getOpacity();
    const next = show ? current + step : current - step;
    if (show && next >= 1 || !show && next <= 0) {
      win.setOpacity(show ? 1 : 0);
      clearInterval(interval);
      if (!show) win.hide();
    } else {
      win.setOpacity(next);
    }
  }, intervalTime);
}
app.whenReady().then(() => {
  createWindow();
  const letterbox = spawn("python", [path.join(__dirname$1, "../backend/main.py")]);
  console.log("Spawned python, pid:", letterbox.pid);
  uIOhook.on("keydown", (e) => {
    if (e.keycode === UiohookKey.G && e.ctrlKey && e.shiftKey) {
      fadeWindow(true);
    }
  });
  uIOhook.on("keyup", (e) => {
    if (e.keycode === UiohookKey.G) {
      fadeWindow(false);
    }
  });
  uIOhook.start();
  letterbox.stdout.on("data", (chunk) => {
    const line = chunk.toString().trim();
    console.log("Message: ", line);
    try {
      const msg = JSON.parse(line);
      win.webContents.send("python-data", msg);
    } catch (e) {
      console.error("failed to parse line", line);
    }
  });
  ipcMain.handle("pick-app", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Executables", extensions: ["exe"] }]
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
  ipcMain.handle("launch-app", async (_event, appPath) => {
    const error = await shell.openPath(appPath);
    if (error) console.error("Launch failed", error);
    return error || null;
  });
  letterbox.stderr.on("data", (d) => console.error("python error", d.toString()));
  letterbox.on("error", (err) => console.error("Failed to start python:", err));
});
