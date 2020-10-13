import { Injectable } from '@angular/core';
import { ipcRenderer, remote } from 'electron';
import * as path from 'path';
import { sources, deprecatedSources } from '../resources/sourceList';

import nconf from 'nconf';	// For storing library in a json file
import { writeFile, access, constants, existsSync, mkdirSync } from 'fs';	// For all sorts of file management

import { downloadTracker, newLibraryObj, novelObj, novelUpdate, sourcesList } from '../resources/types';
import { AppConfig } from 'environments/environment';

@Injectable({
	providedIn: 'root'
})
export class DatabaseService {

	loaded = false;

	appFolder = remote.app.getPath('userData');
	libraryFolder = path.join(this.appFolder, 'library');
	cacheFolder = path.join(this.libraryFolder, 'cache');

	novels: novelObj[] = [];

	updateNovels = 0;
	downloadedNovels = 0;

	downloadTrackers: downloadTracker[] = [];

	sources: sourcesList = sources;
	deprecatedSources: sourcesList = deprecatedSources;

	scrollPos: number;

	constructor() {
		// Save the database when the app closes
		ipcRenderer.on('app-close', _ => {
			this.save();
			ipcRenderer.send('closed');
		});

		this.loadDatabase();
	}

	// Add download to the downloadTracker list and return the index
	addDownloadTracker(link: string): number {
		const downloadID = this.downloadTrackers.length;
		this.downloadTrackers.push({ link: link, downloadID: downloadID, width: '0%', cancel: false, downloaded: false });
		return downloadID;
	}

	getDownloadID(link: string): number {
		for (const tracker of this.downloadTrackers) {
			if (tracker.link === link) return tracker.downloadID;
		}
		return undefined;
	}

	// Update downloadTracker with the percentage of the download
	updateDownloadTracker(downloadID: number, percentage: string): void {
		const tracker = this.downloadTrackers[downloadID];
		tracker.width = percentage + '%';
	}

	getPercentage(downloadID: number): string {
		if (this.downloadTrackers[downloadID]) return this.downloadTrackers[downloadID].width;
		else return '0%';
	}

	setDownloaded(downloadID: number): void {
		this.downloadTrackers[downloadID].downloaded = true;
	}

	isDownloaded(downloadID: number): boolean {
		return this.downloadTrackers[downloadID].downloaded;
	}

	// Set the downloadTracker to cancel the download
	cancelDownload(downloadID: number): void {
		this.downloadTrackers[downloadID].cancel = true;
	}

	// Utility function to stop/end a download
	isCanceled(downloadID: number): boolean {
		return this.downloadTrackers[downloadID].cancel;
	}

	// Load an existing database or create a new one
	loadDatabase(): void {
		if (!existsSync(this.libraryFolder)) mkdirSync(this.libraryFolder);
		if (!existsSync(this.cacheFolder)) mkdirSync(this.cacheFolder);

		let databasePath = "";
		if (AppConfig.production) databasePath = path.join(this.libraryFolder, 'library.json');
		else {
			databasePath = path.join(this.libraryFolder, 'library-dev.json');
			console.log("[DATABASE]: Loading database is dev mode...");
		}

		access(databasePath, constants.F_OK, (err) => {
			if (err) {
				console.log("[DATABASE]: No database found. Generating new database...");
				const json = JSON.stringify(newLibraryObj);

				writeFile(databasePath, json, (err) => {
					if (err) return console.log(err);
					console.log("[DATABASE]: Generated a new database.");
					nconf.use('file', { file: databasePath });
					nconf.load();
					console.log('[DATABASE]: Loaded!');
					this.loadNovels();
				});
			} else {
				// Load library.json file
				nconf.use('file', { file: databasePath });
				nconf.load();
				console.log('[DATABASE]: Loaded!');
				this.loadNovels();
			}
		});
	}

	// Loads all the novels into their variables
	loadNovels(): void {
		this.novels = this.getNovels();
		for (const novel of this.novels) {
			if (!novel.isUpdated) this.updateNovels += 1;
			if (novel.downloaded) this.downloadedNovels += 1;
		}
		this.loaded = true;
	}

	// nconf Utility function to set a key:value pair in the library
	set(key: string, value: unknown): void {
		nconf.set(key, value);
		this.save();
	}

	// nconf Utility function to get a value in the library
	get(key: string): unknown {
		return nconf.get(key);
	}

	// nconf Utility function to remove a key:value pair in the library
	remove(key: string): void {
		nconf.set(key, undefined);
		this.save();
	}

	// Fetch all the novels in the library
	getNovels(): novelObj[] {
		return this.get('novels') as novelObj[];
	}

	// Add a new novel to the database
	addNovel(novel: novelObj): novelObj {
		novel.downloadedChapters = 0;

		const novelFile = novel.name.replace(/[/\\?%*:|"<>]/g, '');
		const novelFolder = path.join(this.get("libraryFolder") as string, novelFile);
		novel.folderPath = novelFolder;

		novel.downloading = false;
		novel.downloaded = false;
		novel.isUpdated = true;
		novel.inLibrary = true;
		novel.state = [];

		this.novels.push(novel);
		this.set("novels", this.novels);
		return novel;
	}

	// Fetch a novel from the library by their link
	getNovel(link: string): novelObj {
		for (const novel of this.novels) {
			if (novel.link == link)
				return novel;
		}
		return null;
	}

	// Remove a novel from the library
	removeNovel(link: string): void {
		this.novels = this.novels.filter(novel => {
			if (novel.link !== link) return true;
			else if (novel.downloaded) this.downloadedNovels--;
			else if (!novel.isUpdated) this.updateNovels--;
		});
		this.set("novels", this.novels);
	}

	// Fetch novels from the library by their names
	getNovelByName(name: string): novelObj {
		for (const novel of this.novels) {
			if (novel.name.toLowerCase().includes(name)) {
				return novel;
			}
		}
		return null;
	}

	// Utility function to update novel from a novel object
	updateNovelObj(updateNovel: novelObj): void {
		for (const novel of this.novels) {
			if (novel.link === updateNovel.link) {
				novel.name = updateNovel.name;
				novel.latestChapter = updateNovel.latestChapter;
				novel.cover = updateNovel.cover;
				novel.totalChapters = updateNovel.totalChapters;
				novel.source = updateNovel.source;
				novel.author = updateNovel.author;
				novel.genre = updateNovel.genre;
				novel.summary = updateNovel.summary;
				break;
			}
		}
		this.set("novels", this.novels);
	}

	// Utility function for updating any field in a novelObj
	updateNovel(link: string, field: string, update: novelUpdate): void {
		for (const novel of this.novels) {
			if (novel.link === link) {
				if (field === "isUpdated" && novel.isUpdated && !update) this.updateNovels++;
				else if (field === "isUpdated" && !novel.isUpdated && update) this.updateNovels--;
				// TODO: update lastUpdated time

				if (field === "downloaded" && !novel.downloaded && update) this.downloadedNovels++;
				else if (field === "downloaded" && novel.downloaded && !update) this.downloadedNovels--;

				novel[field] = update;
				break;
			}
		}
		this.set("novels", this.novels);
	}

	// Utility function to update link of the novel by their link
	updateLink(link: string, update: string): void {
		this.updateNovel(link, "link", update);
	}

	// Utility function to update name of the novel by their link
	updateName(link: string, update: string): void {
		this.updateNovel(link, "name", update);
	}

	// Utility function to update latestChapter of the novel by their link
	updateLatestChapter(link: string, update: string): void {
		this.updateNovel(link, "latestChapter", update);
	}

	// Utility function to update cover of the novel by their link
	updateCover(link: string, update: string): void {
		this.updateNovel(link, "cover", update);
	}

	// Utility function to update cached cover of the novel by their link
	updateCachedCover(link: string, update: string): void {
		this.updateNovel(link, "cachedCover", update);
	}

	// Utility function to update totalChapters of the novel by their link
	updateTotalChapters(link: string, update: number): void {
		this.updateNovel(link, "totalChapters", update);
	}

	// Utility function to update totalChapters of the novel by their link
	updateDownloadedChapters(link: string, update: number): void {
		this.updateNovel(link, "downloadedChapters", update);
	}

	// Utility function to update source of the novel by their link
	updateSource(link: string, update: string): void {
		this.updateNovel(link, "source", update);
	}

	// Utility function to update author of the novel by their link
	updateAuthor(link: string, update: string): void {
		this.updateNovel(link, "author", update);
	}

	// Utility function to update genre of the novel by their link
	updateGenre(link: string, update: string): void {
		this.updateNovel(link, "genre", update);
	}

	// Utility function to update summary of the novel by their link
	updateSummary(link: string, update: string): void {
		this.updateNovel(link, "summary", update);
	}

	// Utility function to update folderPath of the novel by their link
	updateFolderPath(link: string, update: string): void {
		this.updateNovel(link, "folderPath", update);
	}

	// Utility function to update downloading state of the novel by their link
	updateDownloading(link: string, update: boolean): void {
		this.updateNovel(link, "downloading", update);
	}

	// Utility function to update downloaded state of the novel by their link
	updateDownloaded(link: string, update: boolean): void {
		this.updateNovel(link, "downloaded", update);
	}

	// Utility function to update isUpdated state of the novel by their link
	updateIsUpdated(link: string, update: boolean): void {
		this.updateNovel(link, "isUpdated", update);
	}

	// Utility function to update lastUpdated time of the novel by their link
	updateLastUpdated(link: string, update: string): void {
		this.updateNovel(link, "lastUpdated", update);
	}

	// Utility function to update inLibrary state of the novel by their link
	updateInLibrary(link: string, update: boolean): void {
		this.updateNovel(link, "inLibrary", update);
	}

	// nconf Utility function to save the library to a file
	// the save function is set to be thread controlled to avoid overrides.
	wait = false;
	save(): void {
		const id = setInterval(() => {
			if (!this.wait) {
				console.log("[DATABASE]: Saving...");
				this.wait = true;
				nconf.save(function (err) {
					if (err) {
						console.error(err.message);
						return;
					}
					console.log('[DATABASE]: Saved!');
				});
				this.wait = false;
				clearInterval(id);
			} else {
				console.log('[DATABASE]: Waiting to save...');
			}
		}, 500);
	}
}
