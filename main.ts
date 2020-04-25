import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as url from 'url';
const ipc = require('electron').ipcMain;
const { autoUpdater } = require('electron-updater');

var status = 0;
let win: BrowserWindow = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1060,
    height: 600,
    'minWidth': 1060,
    'minHeight': 500,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
    },
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closing.
  win.on('close', function (e) {
    if (status == 0) {
      if (win) {
        e.preventDefault();
        win.webContents.send('app-close');
      }
    }
  });

  // win.once('ready-to-show', () => {
  //   console.log('Checking for updates...');
  //   autoUpdater.checkForUpdatesAndNotify();
  // });

  return win;
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

ipc.on('closed', _ => {
  status = 1;
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

ipc.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
  console.log('Checking for updates...');
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  console.log('Updating...');
  win.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  win.webContents.send('update_downloaded');
});

ipc.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
