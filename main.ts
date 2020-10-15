import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
const ipc = require('electron').ipcMain;
import { autoUpdater } from 'electron-updater';
autoUpdater.autoDownload = false;
const Splashscreen = require('@trodi/electron-splashscreen');

let status = 0;

let win: BrowserWindow = null;
const args = process.argv.slice(1),
	serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

	// Create the browser window.
	const windowOptions = {
		width: 1090,
		height: 650,
		center: true,
		'minWidth': 1090,
		'minHeight': 650,
		frame: false,
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true,
			allowRunningInsecureContent: (serve) ? true : false,
		}
	};

	autoUpdater.checkForUpdates();

	win = Splashscreen.initSplashScreen({
		windowOpts: windowOptions,
		templateUrl: path.join(__dirname, "rsc/splashScreen.html"),
		delay: 0, // force show immediately since example will load fast
		minVisible: 2000, // show for 1.5s so example is obvious
		splashScreenOpts: {
			height: 500,
			width: 700,
			transparent: true,
		}
	});

	if (serve) {

		win.webContents.openDevTools();

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

	// Emitted when the window is closed.
	win.on('close', function (e) {
		if (status == 0) {
			if (win) {
				e.preventDefault();
				win.webContents.send('app-close');
			}
		}
	});

	return win;
}

try {

	app.allowRendererProcessReuse = false;

	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
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
});

// Download Update
ipc.on('update-app', (event) => {
	autoUpdater.downloadUpdate();
});

// Update available
autoUpdater.on('update-available', (event) => {
	win.webContents.send('update_available');
});

// Update is not available
autoUpdater.on('update-not-available', (event) => {
	console.log("NO DOWNLOAD");
});

// Update has been downloaded
autoUpdater.on('update-downloaded', () => {
	win.webContents.send('update_downloaded');
});

ipc.on('restart_app', () => {
	autoUpdater.quitAndInstall();
});
