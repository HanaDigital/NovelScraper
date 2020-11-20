import { Component, NgZone } from '@angular/core';
import { AppConfig } from '../environments/environment';
import { ipcRenderer, remote } from 'electron';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	version = "UPDATING";
	isUpdate = false;
	isUpdating = false;

	menuButtons: HTMLCollectionOf<Element> = document.getElementsByClassName("button");

	updateData: any;

	constructor(zone: NgZone) {
		console.log('Production: ', AppConfig.production);

		// Load Version Number
		ipcRenderer.send('app_version');
		ipcRenderer.on('app_version', (event, arg) => {
			ipcRenderer.removeAllListeners('app_version');
			console.log(arg.version);
			zone.run(() => {
				this.version = 'V' + arg.version;
			});
		});

		ipcRenderer.on('update_available', () => {
			ipcRenderer.removeAllListeners('update_available');
			console.log("[APP]: Update found!");
			zone.run(() => {
				this.isUpdate = true;
			});
		});

		ipcRenderer.on('download_progress', (event, arg) => {
			this.updateData = arg;
		});

		ipcRenderer.on('update_downloaded', () => {
			ipcRenderer.removeAllListeners('update_downloaded');
			console.log("[APP]: Update downloaded!");
			zone.run(() => {
				ipcRenderer.send('restart_app');
			});
		});
	}

	loadPage(id: string): void {
		for (let i = 0; i < this.menuButtons.length; i++) {
			this.menuButtons[i].classList.remove("active");
			if (this.menuButtons[i].id === id) this.menuButtons[i].classList.add("active");
		}
	}

	downloadUpdate(): void {
		ipcRenderer.send('update-app');
		this.isUpdating = true;
	}

	toggleUpdatePrompt(): void {
		this.isUpdate = !this.isUpdate;
	}

	// Minimize Window
	minWindow(): void {
		remote.getCurrentWindow().minimize();
	}

	// Maximize and unMaximize Window
	maxWindow(): void {
		remote.getCurrentWindow().isMaximized() ?
			remote.getCurrentWindow().unmaximize()
			: remote.getCurrentWindow().maximize();
	}

	// Close Window
	closeWindow(): void {
		remote.getCurrentWindow().close();
	}

	restartApp(): void {
		ipcRenderer.send('restart_app');
	}
}
