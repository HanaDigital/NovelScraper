import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { novelObj, sourceObj } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';
import { BoxnovelService } from 'app/services/sources/boxnovel.service';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';
import { sourceService } from 'app/services/sources/sourceService';
import { shell } from 'electron';

@Component({
	selector: 'app-novel',
	templateUrl: './novel.component.html',
	styleUrls: ['./novel.component.scss']
})
export class NovelComponent implements OnInit {

	source: sourceObj = history.state.source;
	novel: novelObj = history.state.novel;
	service: sourceService = history.state.service;

	fromHome: boolean = history.state.fromHome
	fromLibrary: boolean = history.state.fromLibrary

	progress: number = 0;

	downloadID: number;
	checkDownload: NodeJS.Timeout;

	showModal: boolean = false;
	loading: boolean = false;

	constructor(private router: Router, public database: DatabaseService, public sourceManager: SourceManagerService) {
		if (!this.source) this.source = {
			name: "BoxNovel",
			link: "https://boxnovel.com",
			icon: "assets/img/sources/boxnovel-logo.png"
		};
		if (!this.novel) this.novel = {
			author: "Baby Piggie, 猪宝宝萌萌哒 Baby Piggie, 猪宝宝萌萌哒 Baby Piggie, 猪宝宝萌萌哒 Baby Piggie, 猪宝宝萌萌哒 Baby Piggie, 猪宝宝萌萌哒 Baby Piggie, 猪宝宝萌萌哒 Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years ",
			cover: "https://boxnovel.com/wp-content/uploads/2018/10/My-Youth-Began-With-Him-193x278.jpg",
			genre: "Romance",
			latestChapter: "Chapter 3644 - Birthday Banquet 14 Chapter 3644 - Birthday Banquet 14 Chapter 3644 - Birthday Banquet 14",
			totalChapters: 300,
			link: "https://boxnovel.com/novel/my-youth-began-with-him-webnovel/",
			name: "My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel My Youth Began With Him-Webnovel",
			source: "BoxNovel",
			summary: "Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years Seven years ",
			inLibrary: true,
			downloading: false,
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
