import { Injectable } from "@angular/core";
import { chapterObj, novelObj } from "app/resources/types";
import { DatabaseService } from "../database.service";
import { NovelFactoryService } from "../novel-factory.service";
import { sourceService } from "./sourceService";

@Injectable({
	providedIn: "root",
})
export class BoxnovelService extends sourceService {
	constructor(
		public database: DatabaseService,
		public novelFactory: NovelFactoryService
	) {
		super(database);
	}

	async searchWIthLink(
		link: string,
		source: string,
		updatingInfo: boolean
	): Promise<novelObj> {
		this.error = false;
		this.searching = true;

		let novel: novelObj = {}; // Declare novel object

		// Check if the novel exists in the database
		novel = this.database.getNovel(link);
		if (novel && !updatingInfo) {
			this.sourceNovels.unshift(novel);
			return novel;
		} else if (!updatingInfo) {
			novel = {};
		}

		try {


			const html = await this.getHtml(link); // Get HTML from the link

			// Link
			if (!updatingInfo) novel.link = link;

			//boxnovel uses some lower level ajax call now to store the chapters.
			if (!updatingInfo || novel.chapter_link == null) novel.chapter_link = link + (link.slice(-1) == '/' ? "":"/") + "ajax/chapters/";

			const chapters = await this.postHtml(novel.chapter_link) // we get the subpage listing all the chapters.



			// Source
			if (!updatingInfo) novel.source = source;

			// InLibrary
			if (!updatingInfo) novel.inLibrary = false; // Set as false to distinguish between novels already present

			// Name
			const title = html.getElementsByClassName("post-title")[0];
			try {
				title.getElementsByTagName("span")[0].remove();
			} catch (error) {
				console.log("[SERVICE]: Title span warning.");
			}
			novel.name = title.textContent.trim();

			// LatestChapter
			novel.latestChapter = chapters
				.getElementsByClassName("wp-manga-chapter")[0]
				.getElementsByTagName("a")[0]
				.innerText.trim();

			// Cover
			novel.cover = html
				.getElementsByClassName("summary_image")[0]
				.getElementsByTagName("img")[0].src;

			// TotalChapters
			novel.totalChapters = chapters.getElementsByClassName(
				"wp-manga-chapter"
			).length;

			// Author(s)
			const authorList = html
				.getElementsByClassName("author-content")[0]
				.getElementsByTagName("a");
			try {
				let author = "";
				for (let i = 0; i < authorList.length; i++) {
					author += authorList[i].innerText.trim() + ", ";
				}
				novel.author = author.slice(0, -2);
			} catch (error) {
				novel.author = "N/A";
				console.log(error);
			}

			// Genre(s)
			const genreList = html
				.getElementsByClassName("genres-content")[0]
				.getElementsByTagName("a");
			try {
				let genre = "";
				for (let i = 0; i < genreList.length; i++) {
					genre = genreList[i].innerText.trim() + ", ";
				}
				novel.genre = genre.slice(0, -2);
			} catch (error) {
				novel.genre = "N/A";
				console.log(error);
			}

			// Summary
			const summaryList = html
				.getElementsByClassName("summary__content")[0]
				.getElementsByTagName("p");
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

			console.log(novel, updatingInfo);
			this.pushOrUpdateNovel(novel, updatingInfo);
		} catch (error) {
			console.error(error);
			this.errorMessage = "ERROR FETCHING NOVEL";
			this.error = true;
		}

		this.searching = false;
		return novel;
	}

	async searchWithName(name: string, source: string): Promise<void> {
		this.error = false;
		this.searching = true;

		name = encodeURI(name.replace(/ /g, "+")); // Replace spaces in novel name to a + for creating the search link
		const searchLink =
			"https://boxnovel.com/?s=" + name + "&post_type=wp-manga"; // Search link that will find the novels of this name

		const foundNovels: novelObj[] = []; // Will store the novels found from this name

		try {
			const html = await this.getHtml(searchLink);
			let novel: novelObj;

			const novelList = html.getElementsByClassName(
				"c-tabs-item__content"
			);

			for (let i = 0; i < novelList.length; i++) {
				novel = {};

				// Link
				novel.link = novelList[i]
					.getElementsByClassName("post-title")[0]
					.getElementsByTagName("a")[0].href;

				novel.chapter_link = novel.link + (novel.link.slice(-1) == '/' ? "":"/") + "ajax/chapters/";

				// Source
				novel.source = source;

				// Name
				novel.name = novelList[i]
					.getElementsByClassName("post-title")[0]
					.getElementsByTagName("a")[0]
					.innerText.trim();

				// Latest Chapter
				novel.latestChapter = novelList[i]
					.getElementsByClassName("chapter")[0]
					.getElementsByTagName("a")[0]
					.innerText.trim();

				// Total Chapters
				novel.totalChapters = 0; // Total chapters don't show when searching for novels

				// Cover
				novel.cover = novelList[i]
					.getElementsByClassName("tab-thumb")[0]
					.getElementsByTagName("img")[0].src;

				// Author(s)
				const authorList = novelList[i]
					.getElementsByClassName("mg_author")[0]
					.getElementsByTagName("a");
				try {
					let author: string;
					for (let i = 0; i < authorList.length; i++) {
						author = authorList[i].innerText.trim() + ", ";
					}
					novel.author = author.slice(0, -2);
				} catch (error) {
					novel.author = "N/A";
					console.error(error);
				}

				// Genre(s)
				const genreList = novelList[i]
					.getElementsByClassName("mg_genres")[0]
					.getElementsByTagName("a");
				try {
					let genre: string;
					for (let i = 0; i < genreList.length; i++) {
						genre = genreList[i].innerText.trim() + ", ";
					}
					novel.genre = genre.slice(0, -2);
				} catch (error) {
					novel.genre = "N/A";
					console.log(error);
				}

				// Summary
				novel.summary = "N/A";

				// Check if novel is already in the searched novel list and remove it
				this.sourceNovels = this.sourceNovels.filter(
					(sourceNovel) => sourceNovel.link !== novel.link
				);

				// Check if the novel exists in the database
				const libNovel = this.database.getNovel(novel.link);
				if (libNovel) {
					foundNovels.push(libNovel);
					continue;
				} else {
					foundNovels.push(novel);
				}
			}
		} catch (error) {
			console.error(error);
			this.errorMessage = "ERROR SEARCHING FOR NOVEL";
			this.error = true;
		}

		this.searching = false;
		this.sourceNovels = [...foundNovels, ...this.sourceNovels];
	}

	async download(novel: novelObj, downloadID: number): Promise<void> {
		let downloadedChapters: chapterObj[] = []; // List of download chapters

		try {
			const html = await this.getHtml(novel.link);

			const chapter_html = await this.postHtml(novel.chapter_link) // we get the subpage listing all the chapters.

			const chapters = chapter_html.getElementsByClassName("wp-manga-chapter");

			// Get chapter links and names
			let chapterLinks = [];
			let chapterNames = [];
			for (let i = 0; i < chapters.length; i++) {
				chapterLinks.push(
					chapters[i]
						.getElementsByTagName("a")[0]
						.getAttribute("href")
				);
				chapterNames.push(
					chapters[i]
						.getElementsByTagName("a")[0]
						.innerText.trim()
						.replace(/(\r\n|\n|\r)/gm, "")
				);
			}
			chapterLinks.reverse();
			chapterNames.reverse();

			const update = this.update(novel, chapterLinks.length);
			if (update.startIndex === -1) {
				this.database.cancelDownload(downloadID);
				this.database.updateDownloading(novel.link, false);
				return;
			} else if (update.startIndex !== 0) {
				downloadedChapters = update.updateChapters;
				chapterLinks = chapterLinks.slice(update.startIndex);
				chapterNames = chapterNames.slice(update.startIndex);
			}

			const totalLength = downloadedChapters.length + chapterLinks.length;
			let canceled = false;

			try {
				// Download each chapter at a time
				for (let i = 0; i < chapterLinks.length; i++) {
					if (this.database.isCanceled(downloadID)) {
						this.database.updateDownloading(novel.link, false);
						console.log("Download canceled!");
						canceled = true;
						return;
					}

					const html = await this.getHtml(chapterLinks[i]);
					const chapterHtml = html.getElementsByClassName(
						"entry-content"
					)[0];
					try {
						chapterHtml.getElementsByClassName("cha-tit")[0].remove(); // Remove h3 tag from chapter
					} catch (error) {
						console.log(
							"Missing 'cha-tit' class at chapter index " +
							i +
							"and chapter name " +
							chapterNames[i]
						);
					}

					const chapterTitle = chapterNames[i];

					let chapterBody = "<h3>" + chapterTitle + "</h3>";
					chapterBody += chapterHtml.outerHTML;

					const chapter = this.prepChapter(novel, downloadID, chapterTitle, chapterBody, downloadedChapters.length, totalLength);
					downloadedChapters.push(chapter);
				}

				if (!canceled) this.novelFactory.generateEpub(novel, downloadedChapters, downloadID);
			} catch (error) {
				canceled = true;
				console.error("Error downloading the complete novel. Retry.");
				console.error(error);
			}

			if (canceled) {
				this.novelFactory.saveChapters(
					novel,
					downloadedChapters
				);
				this.database.cancelDownload(downloadID);
				this.database.updateDownloading(novel.link, false);
				this.database.updateDownloadedChapters(novel.link, downloadedChapters.length);
				this.database.updateDownloaded(novel.link, true);
				this.database.updateIsUpdated(novel.link, false);
			}

		} catch (error) {
			this.database.cancelDownload(downloadID);
			this.database.updateDownloading(novel.link, false);
			console.error(error);
		}
	}
}
