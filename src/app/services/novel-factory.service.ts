import { Injectable } from "@angular/core";
import { DatabaseService } from "./database.service";
import { novelObj, chapterObj } from "../resources/types";
import shellJS from "shelljs"; // For folder creation, idk why I didn't just do it with fs
import { remote } from "electron";
import * as path from "path";
import rimraf from "rimraf"; // For recursive folder deletion
const epubGen = require("nodepub");
import mime from "mime";
import { writeFileSync, createWriteStream, writeFile } from "fs";
import request from "request";

@Injectable({
	providedIn: "root",
})
export class NovelFactoryService {
	// Path to the downloads folder
	downloadFolder = path.join(
		remote.app.getPath("downloads"),
		"NovelScraper-Library"
	);

	constructor(public database: DatabaseService) { }

	async generateEpub(
		novel: novelObj,
		chapters: chapterObj[],
		downloadID: number
	): Promise<void> {
		// Create the folder for storing the novel files
		const novelFile = novel.name.replace(/[/\\?%*:|"<>]/g, "");
		const novelFolder = novel.folderPath;
		await shellJS.mkdir("-p", novelFolder);

		// Save chapters in a json file and set the novel as download
		await this.saveChapters(novel, chapters);

		// Download the cover and get its path
		const coverPath = await this.downloadCover(novel.cover, novelFolder);


		// If the novel doesnt have a genre we default "Unknown"; empty or null will crash the epub creation
		if (novel.genre == null || novel.genre == "")
		{
			novel.genre = 'Unkown'
		}

		// If the novel doesnt have a author we default "Unknown"; empty or null will crash the epub creation
		if (novel.author == null || novel.author == "")
		{
			novel.author = 'Unkown'
		}
		console.log("Creating Epub with metadata");
		console.log(novel)
		// Set some meta data for the epub file
		const metadata = {
			id: "0000-0000-0001",
			cover: coverPath,
			title: novel.name,
			author: novel.author,
			genre: novel.genre,
			language: "en",
			description:
				"This novel was downloaded from a pirate site using NovelScraper." +
				" If possible, please support the author: " +
				novel.author,
			contents: "Table of Contents",
			images: [],
		};

		// Generate the epub file and add the chapters
		const epub = epubGen.document(metadata);
		for (const chapter of chapters)
			epub.addSection(chapter.title, chapter.data);
		setTimeout(async () => {
			await epub.writeEPUB(novelFolder, novelFile);

			this.database.updateDownloading(novel.link, false);
			this.database.updateDownloaded(novel.link, true);
			this.database.updateIsUpdated(novel.link, true);
			this.database.setDownloaded(downloadID);
		}, 2000);
	}

	// Save chapters to a json file so we don't re-download when updating
	async saveChapters(
		novel: novelObj,
		chapters: chapterObj[]
	): Promise<void> {
		// Create the folder for storing the novel files
		const novelFolder = novel.folderPath;
		await shellJS.mkdir("-p", novelFolder);

		const chaptersFile = path.join(novelFolder, "chapters.json");
		const json = JSON.stringify(chapters, null, 4);
		writeFile(chaptersFile, json, (err) => {
			if (err) console.error(err);
			else {
				// Update total chapters of the novel
				novel.downloadedChapters = chapters.length;
				this.database.updateDownloadedChapters(
					novel.link,
					chapters.length
				);
			}
		});
	}

	// Download novel cover and return the path
	async downloadCover(
		novelCover: string,
		novelFolder: string
	): Promise<string> {
		const coverExtension = mime.getExtension(mime.getType(novelCover));
		const coverPath = path.join(novelFolder, "cover." + coverExtension);
		const out = createWriteStream(coverPath);

		const req = await request({ method: "GET", uri: novelCover });
		await req.pipe(out);

		return coverPath;
	}
}
