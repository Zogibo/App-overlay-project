import { app, BrowserWindow, screen, shell, dialog, ipcMain } from 'electron' //import app closing and opening function, browser window duh
import { spawn } from 'node:child_process' //import the function to talk to py script
import { fileURLToPath } from 'node:url' //basically os in python
import { uIOhook, UiohookKey } from 'uiohook-napi'
import path from 'node:path' //basically os in python

const __dirname = path.dirname(fileURLToPath(import.meta.url)) //takes the folder of
//this script

let app_array = []
let win: BrowserWindow

function createWindow() {
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize //the function outsputs like a function in python
  // the curly bracelets help you recieve the results easier

  win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    show : false,
    opacity: 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs') //run preload.mjs first
    }
  })
  win.webContents.openDevTools({ mode: 'detach' }) 
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function fadeWindow(show: boolean) {
  const step = 0.1
  const intervalTime = 15

  if( show) {
    win.showInactive()
  }

  const interval = setInterval(() => {
    const current = win.getOpacity()
    const next = show ? current + step : current - step

    if ((show && next >= 1) || (!show && next <= 0)) {
      win.setOpacity(show ? 1: 0)
      clearInterval(interval)
      if (!show) win.hide()
    } else {
  win.setOpacity(next)}
  }, intervalTime)
} //damn i could never write this, kinda clean lowk i would have written two functions for this
//and not be clean

app.whenReady().then(() => { //when start app, electron has to prepare some stuff before
  //browser window can appear, so WHEN the preperations are ready -> 
  createWindow()// THEN start browser window

  const letterbox = spawn('python', [path.join(__dirname, '../backend/main.py')])
  console.log('Spawned python, pid:', letterbox.pid)

  uIOhook.on('keydown', (e) => {
    if (e.keycode === UiohookKey.G && e.ctrlKey && e.shiftKey) {
      fadeWindow(true)
    }
  })
  
  uIOhook.on('keyup', (e) => {
    if (e.keycode === UiohookKey.G) {
      fadeWindow(false)
    }
  })

  uIOhook.start()

  letterbox.stdout.on('data', (chunk) => {
    const line = chunk.toString().trim()
    console.log('Message: ', line)

    try {
      const msg = JSON.parse(line)
      win.webContents.send('python-data', msg)
    } catch (e) {
      console.error('failed to parse line', line)
    }
  })

  ipcMain.handle('pick-app', async() => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions: ['exe']}],
    })
    if (result.canceled) return null
    app_array.push(result)
    return result.filePaths[0]
  })

  ipcMain.handle('launch-app', async (_event, appPath: string) => {
    const error = await shell.openPath(appPath)
    if (error) console.error('Launch failed', error)
    return error || null
  })

  letterbox.stderr.on('data', (d) => console.error('python error', d.toString()))
  letterbox.on('error', (err) => console.error('Failed to start python:', err))
})