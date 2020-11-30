import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { chapterObj, novelObj, sourceObj } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';
import { BoxnovelService } from 'app/services/sources/boxnovel.service';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';
import { sourceService } from 'app/services/sources/sourceService';
import { shell } from 'electron';
import { readFileSync } from 'fs';

@Component({
	selector: 'app-novel',
	templateUrl: './novel.component.html',
	styleUrls: ['./novel.component.scss']
})
export class NovelComponent implements OnInit {

	source: sourceObj = history.state.source;
	novel: novelObj = history.state.novel;
	chapters: chapterObj;
	service: sourceService = history.state.service;

	fromHome: boolean = history.state.fromHome;
	fromLibrary: boolean = history.state.fromLibrary;

	progress = 0;

	downloadID: number;
	checkDownload: NodeJS.Timeout;

	showModal = false;
	loading = false;

	constructor(private router: Router, public database: DatabaseService, public sourceManager: SourceManagerService) {
		if (!this.source) this.source = {
			name: "NovelFull",
			link: "https://novelfull.com",
			icon: "assets/img/sources/novelfull-logo.png"
		};
		if (!this.novel) this.novel = {
			source: "NovelFull",
			link: "https://novelfull.com/tales-of-demons-and-gods.html",
			name: "Tales of Demons and Gods",
			latestChapter: "Chapter 494 - Divine Items",
			cover: "https://novelfull.com/uploads/thumbs/tales-of-demons-and-gods-fceee0fee0-2239c49aee6b961904acf173b7e4602a.jpg",
			totalChapters: 494,
			author: "Mad Snail",
			genre: "Fantasy, Xuanhuan, Action, Adventure, Comedy, Harem, Martial Arts, Romance",
			summary: "Killed by a Sage Emperor and reborn as his 13 year old self, Nie Li was given a second chance at life. A second chance to change everything and save his loved ones and his beloved city. He shall once again battle with the Sage Emperor to avenge his death and those of his beloved . With the vast knowledge of hundred years of life he accumulated in his previous life, wielding the strongest demon spirits, he shall reach the pinnacle of Martial Arts.\nEnmities of the past will be settled in this new lifetime. “Since I’m back, then in this lifetime, I shall become the King of the Gods that dominate everything. Let everything else tremble beneath my feet!”\n",
			downloadedChapters: 494,
			folderPath: "A:\\Downloads\\NovelScraper-Library\\Tales of Demons and Gods",
			downloading: false,
			downloaded: true,
			isUpdated: true,
			inLibrary: true,
			state: []
		}

		if (this.novel.downloaded) {
			this.chapters = JSON.parse(readFileSync(this.novel.folderPath + "\\chapters.json").toString());
		}
	}

	ngOnInit(): void {
		this.service = this.sourceManager.getService(this.source.name);

		const libraryNovel = this.database.getNovel(this.novel.link);
		if (libraryNovel) {
			this.novel = libraryNovel;
			if (this.novel.downloading) {
				this.downloadID = this.database.getDownloadID(this.novel.link);
				console.log(this.downloadID);
				if (this.downloadID !== undefined) {
					this.checkDownload = setInterval(() => {
						if (this.database.isDownloaded(this.downloadID)) {
							this.novel.downloading = false;
							this.novel.downloaded = true;
						}
					}, 1000);
				} else {
					this.novel.downloading = false;
					this.database.updateDownloading(this.novel.link, false);
				}
			}
		}
	}

	addToLibrary(): void {
		this.novel = this.database.addNovel(this.novel);
		this.refresh();
	}

	download(): void {
		this.novel.downloading = true;
		this.database.updateDownloading(this.novel.link, true);

		this.downloadID = this.database.addDownloadTracker(this.novel.link);
		this.service.download(this.novel, this.downloadID);
		this.checkDownload = setInterval(() => {
			if (this.database.isDownloaded(this.downloadID)) {
				this.novel.downloading = false;
				this.novel.downloaded = true;
				clearInterval(this.checkDownload);
			} else if (this.database.isCanceled(this.downloadID)) {
				this.novel.downloading = false;
				clearInterval(this.checkDownload);
			}
		}, 1000);
	}

	refresh(): void {
		this.loading = true;
		this.service.searchWIthLink(this.novel.link, this.novel.source, true).then(novel => {
			this.novel = novel;
			this.loading = false;
		});
	}

	cancelDownload(): void {
		clearInterval(this.checkDownload);
		this.database.cancelDownload(this.downloadID);
		this.novel.downloading = false;
	}

	openFolder(): void {
		shell.openPath(this.novel.folderPath);
	}

	toggleDeleteModal(): void {
		this.showModal = !this.showModal;
	}

	delete(): void {
		this.database.removeNovel(this.novel.link);
		this.novel.inLibrary = false;
		this.toggleDeleteModal();
	}

	goBack(): void {
		if (this.fromLibrary) this.router.navigateByUrl('/library');
		else if (this.fromHome) this.router.navigateByUrl('/');
		else this.router.navigateByUrl('/source', { state: { source: this.source } });
	}

	openInBrowser(): void {
		shell.openExternal(this.novel.link);
	}

	ngOnDestroy(): void {
		clearInterval(this.checkDownload);
	}
}
