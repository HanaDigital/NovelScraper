import { chapterObj, novelObj, update } from "app/resources/types";
import { existsSync, readFileSync } from "fs";
import { DatabaseService } from "../database.service";
const cloudscraper = (<any>window).require("cloudscraper");
import * as path from "path";

export class sourceService {
	sourceNovels: novelObj[] = [];

	searching = false;
	error = false;
	errorMessage = "";

	scrollPos: number;

	constructor(public database: DatabaseService) { }

	async searchWIthLink(
		link: string,
		source: string,
		updatingInfo: boolean
	): Promise<novelObj> {
		return {};
	}

	async searchWithName(name: string, source: string): Promise<void> { }

	async download(novel: novelObj, downloadID: number): Promise<void> { }

	update(novel: novelObj, numOfChapters: number): update {
		if (numOfChapters > novel.totalChapters) {
			novel.totalChapters = numOfChapters;
			this.database.updateTotalChapters(novel.link, numOfChapters);
		}

		const updateFile = path.join(novel.folderPath, "chapters.json");

		if (!existsSync(updateFile)) {
			novel.downloaded = false;
			this.database.updateDownloaded(novel.link, false);
			console.log("[SERVICE]: Missing update file. Downloading again!");
			return { updateChapters: undefined, startIndex: 0 };
		}

		const json: string = readFileSync(updateFile, "utf8");
		const updateChapters: chapterObj[] = JSON.parse(json);

		if (numOfChapters === novel.downloadedChapters) {
			console.log("[SERVICE]: Already up to date!");
			return { updateChapters: undefined, startIndex: -1 };
		}

		return {
			updateChapters: updateChapters,
			startIndex: updateChapters.length,
		};
	}

	pushOrUpdateNovel(novel: novelObj, updatingInfo: boolean): void {
		if (!novel.downloadedChapters) novel.downloadedChapters = 0;
		if (!updatingInfo) {
			this.sourceNovels = this.sourceNovels.filter(
				(sourceNovel) => sourceNovel.link !== novel.link
			);
			this.sourceNovels.unshift(novel);
		} else if (novel.totalChapters > novel.downloadedChapters) {
			this.database.updateNovelObj(novel);
			this.database.updateIsUpdated(novel.link, false);
		}
	}

	prepChapter(
		novel: novelObj,
		downloadID: number,
		title: string,
		chapterBody: string,
		currentPos: number,
		destPos: number
	): chapterObj {
		chapterBody = chapterBody.replace(/<script.*<\/script>/gi, ""); // Remove any script tags usually used with ads (Security+)
		chapterBody = chapterBody.replace(/<iframe.*<\/iframe>/gi, ""); // Remove any iframes usually used with ads
		chapterBody = chapterBody.replace(/< *br *>/gi, "<br/>"); // Make sure all <br/> tags end correctly for xhtml
		chapterBody = chapterBody.replace(/<br *\/ *br *>/gi, ""); // Remove any useless </br> tags
		chapterBody = chapterBody.replace(
			/(<img("[^"]*"|[^\/">])*)>/gi,
			"$1/>"
		); // Make sure img tag ends correctly for xhtml

		chapterBody += this.addPropoganda(novel.author);

		const percentage = ((currentPos / destPos) * 100).toFixed(2);
		this.database.updateDownloadTracker(downloadID, percentage);

		console.log(`Downloaded chapter ${currentPos}`)

		return {
			title: title,
			data: chapterBody,
			read: false,
			scroll: 0,
		} as chapterObj;
	}

	async getHtml(link: string): Promise<HTMLHtmlElement> {
		const stringHtml: string = await cloudscraper(
			{ method: "GET", url: link },
			(error, response, novelHtmlString) => {
				return novelHtmlString;
			}
		);

		const html = document.createElement("html");
		html.innerHTML = stringHtml;
		return html;
	}

	addPropoganda(author: string): string {
		return (
			"<br/><br/>" +
			"<p>This novel was scraped from a pirate site using NovelScraper.</p>" +
			"<p>If possible, please support the author(s) of this novel: " +
			author +
			"</p>"
		);
	}
}
