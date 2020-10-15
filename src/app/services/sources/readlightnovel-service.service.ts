import { Injectable } from '@angular/core';
import { chapterObj, novelObj } from 'app/resources/types';
import { DatabaseService } from '../database.service';
import { NovelFactoryService } from '../novel-factory.service';
import { sourceService } from './sourceService';

@Injectable({
	providedIn: 'root'
})
export class ReadlightnovelService extends sourceService {

	constructor(public database: DatabaseService, public novelFactory: NovelFactoryService) {
		super(database);
	}

	async searchWIthLink(link: string, source: string, updatingInfo: boolean): Promise<novelObj> {
		this.error = false;
		this.searching = true;

		let novel: novelObj = {};		// Declare novel object

		// Check if the novel exists in the database
		novel = this.database.getNovel(link)
		if (novel && !updatingInfo) {
			this.sourceNovels.unshift(novel);
			return novel;
		} else {
			novel = {};
		}

		try {
			const html = await this.getHtml(link);		// Get HTML from the link

			// Link
			if (!updatingInfo) novel.link = link;

			// Source
			if (!updatingInfo) novel.source = source;

			// InLibrary
			if (!updatingInfo) novel.inLibrary = false;	// Set as false to distinguish between novels already present

			//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

			// Name
			novel.name = html.getElementsByClassName("block-title")[0].getElementsByTagName("h1")[0].innerText;

			// LatestChapter
			try {
				novel.latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();
			} catch (error) {
				novel.latestChapter = "N/A";
				console.log(error);
			}

			// Cover
			novel.cover = html.getElementsByClassName('novel-cover')[0].getElementsByTagName("img")[0].src;

			// FIXME: TotalChapters
			const chapterTabs = html.getElementsByClassName("tab-content")[0].getElementsByClassName("tab-pane");
			let totalChapters = 0;
			for (let i = 0; i < chapterTabs.length; i++) {
				if (chapterTabs[i].getElementsByTagName("li").length !== 0) {
					totalChapters += chapterTabs[i].getElementsByTagName("li").length;
				}
			}
			novel.totalChapters = totalChapters;

			// FIXME: Author(s)
			// Get list of authors
			const authorList = html.getElementsByClassName("novel-left")[0].getElementsByClassName("novel-detail-item")[4].getElementsByTagName("li");
			try {
				let author = ""
				for (let i = 0; i < authorList.length; i++) {
					author += authorList[i].innerText.trim() + ', ';
				}
				novel.author = author.slice(0, -2);
			} catch (error) {
				novel.author = "N/A";
				console.log(error);
			}

			// FIXME: Genre(s)
			const genreList = html.getElementsByClassName("novel-left")[0].getElementsByClassName("novel-detail-item")[1].getElementsByTagName("a");
			try {
				let genre = "";
				for (let i = 0; i < genreList.length; i++) {
					genre += genreList[i].innerText.trim() + ', ';
				}
				novel.genre = genre.slice(0, -2);
			} catch (error) {
				novel.genre = "N/A";
				console.log(error);
			}

			// FIXME: Summary
			const summaryList = html.getElementsByClassName("novel-right")[0].getElementsByClassName("novel-detail-item")[0].getElementsByTagName("p");
			try {
				let summary = "";
				for (let i = 0; i < summaryList.length; i++) {
					summary += summaryList[i].innerText.trim() + "\n";
				}
				novel.summary = summary;
			} catch (error) {
				novel.summary = "N/A";
				console.log(error);
			}

			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

			this.pushOrUpdateNovel(novel, updatingInfo);
		} catch (error) {
			console.log(error);
			this.errorMessage = "ERROR FETCHING NOVEL";
			this.error = true;
		}

		this.searching = false;
		return novel;
	}

	async searchWithName(name: string, source: string): Promise<void> {
		this.errorMessage = "THIS SOURCE REQUIRES A DIRECT LINK TO THE NOVEL YOU WANT TO SEARCH";
		this.error = true;
	}

	async download(novel: novelObj, downloadID: number): Promise<void> {
		let downloadedChapters: chapterObj[] = [];	// List of download chapters

		try {
			const html = await this.getHtml(novel.link);

			//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

			// For each element get the link to the chapter page and the name of the chapter
			let chapterLinks = [];
			let chapterNames = [];
			const chapterVolumes = html.getElementsByClassName("tab-content");
			for (let s = 0; s < chapterVolumes.length; s++) {
				const chapterTabs = chapterVolumes[s].getElementsByClassName("tab-pane");
				for (let i = 0; i < chapterTabs.length; i++) {
					if (chapterTabs[i].getElementsByTagName("li").length !== 0) {
						const chapterHolders = chapterTabs[i].getElementsByTagName("li");
						for (let x = 0; x < chapterHolders.length; x++) {
							chapterLinks.push(chapterHolders[x].getElementsByTagName('a')[0].getAttribute('href'));
							chapterNames.push(chapterHolders[x].innerText);
						}
					}
				}
			}

			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

			const update = this.update(novel, chapterLinks.length);
			if (update.startIndex === -1) {
				this.database.cancelDownload(downloadID);
				this.database.updateDownloading(novel.link, false);
				return;
			}
			else if (update.startIndex !== 0) {
				downloadedChapters = update.updateChapters;
				chapterLinks = chapterLinks.slice(update.startIndex);
				chapterNames = chapterNames.slice(update.startIndex);
			}

			// Download each chapter at a time
			for (let i = 0; i < chapterLinks.length; i++) {
				if (this.database.isCanceled(downloadID)) {
					this.database.updateDownloading(novel.link, false);
					console.log('Download canceled!')
					return;
				}

				const html = await this.getHtml(chapterLinks[i]);

				//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

				// You have the html of the chapter page
				// Get the element that wraps all the paragraphs of the chapter
				const chapterHtml = html.getElementsByClassName('desc')[0].getElementsByClassName("hidden")[0];

				//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

				const chapterTitle = chapterNames[i];

				let chapterBody = "<h3>" + chapterTitle + "</h3>";
				chapterBody += chapterHtml.outerHTML;


				const chapter = this.prepChapter(novel, downloadID, chapterTitle, chapterBody, i, chapterLinks.length);
				downloadedChapters.push(chapter);
			}

			this.novelFactory.generateEpub(novel, downloadedChapters, downloadID);

		} catch (error) {
			this.database.cancelDownload(downloadID);
			this.database.updateDownloading(novel.link, false);
			console.error(error);
		}
	}
}
