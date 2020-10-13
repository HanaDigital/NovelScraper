import { Injectable } from '@angular/core';
import { chapterObj, novelObj } from 'app/resources/types';
import { DatabaseService } from '../database.service';
import { NovelFactoryService } from '../novel-factory.service';
import { sourceService } from './sourceService';

@Injectable({
	providedIn: 'root'
})
export class ReadlightnovelService extends sourceService {

	sourceNovels: novelObj[] = [];	// List of all the searched novels

	constructor(public database: DatabaseService, public novelFactory: NovelFactoryService) {
		super(database);
	}

	async searchWIthLink(link: string, source: string, updatingInfo: boolean): Promise<novelObj> {
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
			novel.link = link;

			// Source
			novel.source = source;

			// InLibrary
			if (!updatingInfo) novel.inLibrary = false;	// Set as false to distinguish between novels already present
			else novel.inLibrary = true;

			//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

			// FIXME: Name
			novel.name = html.getElementsByClassName('title')[0].textContent;

			// FIXME: LatestChapter
			novel.latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();

			// FIXME: Cover
			novel.cover = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;

			// FIXME: TotalChapters
			novel.totalChapters = html.getElementsByClassName('wp-manga-chapter').length;

			// FIXME: Author(s)
			novel.author = html.getElementsByClassName('author-content')[0].getElementsByTagName('a')[0].text;

			// FIXME: Genre(s)
			novel.genre = html.getElementsByClassName('genres-content')[0].getElementsByTagName('a')[0].text;

			// FIXME: Summary
			novel.summary = html.getElementsByClassName('summary__content')[0].getElementsByTagName('p')[0].textContent;

			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

			this.pushOrUpdateNovel(novel, updatingInfo);
		} catch (error) {
			console.log(error);
		}

		return novel;
	}

	async searchWithName(name: string, source: string): Promise<void> {

		//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

		// FIXME: Generate the search link from novel name
		name = encodeURI(name.replace(/ /g, '+'));	// Replace spaces in novel name to a + for creating the search link
		const searchLink = "https://mysource.com/?s=" + name;	// Search link that will find the novels of this name

		//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

		const foundNovels: novelObj[] = [];	// Will store the novels found from this name

		try {
			const html = await this.getHtml(searchLink);
			let novel: novelObj;
			//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

			// FIXME: Get the list of all search result elements
			const novelList = html.getElementsByClassName('c-tabs-item__content');

			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

			for (let i = 0; i < novelList.length; i++) {
				novel = {};

				// Source
				novel.source = source;

				//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

				// FIXME: Name
				novel.name = html.getElementsByClassName('title')[0].textContent;

				// FIXME: LatestChapter
				novel.latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();

				// FIXME: Cover
				novel.cover = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;

				// FIXME: TotalChapters
				novel.totalChapters = 0;	// If totalChapters is unknown, set it to 0 as it will not accept a string

				// FIXME: Author(s)
				novel.author = "unknown";

				// FIXME: Genre(s)
				novel.genre = "unknown";

				// FIXME: Summary
				novel.summary = "unknown";

				//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

				// Check if novel is already in the searched novel list and remove it
				this.sourceNovels = this.sourceNovels.filter(sourceNovel => sourceNovel.link !== novel.link);

				// Check if the novel exists in the database
				const libNovel = this.database.getNovel(novel.link);
				if (libNovel) {
					foundNovels.push(libNovel);
					continue;
				} else {
					foundNovels.push(novel);
				}

				// Source
				novel.source = source;
			}
		} catch (error) {
			console.log(error);
		}

		this.sourceNovels = [...foundNovels, ...this.sourceNovels];
	}

	async download(novel: novelObj, downloadID: number): Promise<void> {
		let downloadedChapters: chapterObj[] = [];	// List of download chapters

		try {
			const html = await this.getHtml(novel.link);

			//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

			// FIXME: Get the list of all chapter elements from the html
			const chapters = html.getElementsByClassName('wp-manga-chapter');

			// FIXME: For each element get the link to the chapter page and the name of the chapter
			let chapterLinks = [];
			let chapterNames = [];
			for (let i = 0; i < chapters.length; i++) {
				// FIXME: You will probably only need to update the lines below
				chapterLinks.push(chapters[i].getElementsByTagName('a')[0].getAttribute('href'));
				chapterNames.push(chapters[i].getElementsByTagName('a')[0].innerText.trim().replace(/(\r\n|\n|\r)/gm, ""));
			}
			// FIXME: In some cases the chapters are in descending order, we will reverse the lists to make them ascending
			// FIXME: If your chapters are already in ascending order then remove the two lines below
			chapterLinks.reverse();
			chapterNames.reverse();

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

				// FIXME: you have the html of the chapter page
				// Get the element that wraps all the paragraphs of the chapter
				const chapterHtml = html.getElementsByClassName('entry-content')[0];

				// FIXME: If the chapter element also has the title, you can remove it because we will be using the chapter names we got earlier
				// You can remove the lines below if its not needed
				try {
					chapterHtml.getElementsByClassName("chapter-title")[0].remove();	// Remove h3 tag from chapter
				} catch (error) {
					console.log("Missing 'cha-tit' class at chapter index " + i + "and chapter name " + chapterNames[i]);
				}

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
