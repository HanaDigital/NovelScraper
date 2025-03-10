import * as cheerio from 'cheerio';
import { ChapterT, NovelT } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { hashString } from "../utils";
import { NovelSource, NovelSourceProps } from "./template";

export class Novgo extends NovelSource {

	constructor({ id, name, tags, logo, url, cloudflareProtected }: NovelSourceProps) {
		super({ id, name, tags, logo, url, cloudflareProtected });
	}

	async searchNovels(query: string): Promise<NovelT[]> {
		const encodedQuery = encodeURIComponent(query);
		const url = `${this.url}/?s=${encodedQuery}`;
		const html = await this.fetchHTML(url);
		if (!html) throw new Error('Failed to search novels');

		const $ = cheerio.load(html);
		console.log("!!!HTML:", html);
		const novels: NovelT[] = [];
		$(".c-tabs-item .row").each((i, elem) => {
			console.log("!!!ELEMENT:", elem);
			const titleElem = $(elem).find(".post-title h3 a")
			const title = titleElem.text().trim();
			let url = titleElem.attr("href") ?? "";

			const author = $(elem).find(".post-content mg_author .summary-content").text().trim() ?? "Unknown";
			let thumbnailURL = $(elem).find(".tab-thumb img").attr("src");

			const novel: NovelT = {
				id: hashString(url),
				source: this.id,
				url,
				title,
				authors: [author],
				genres: [],
				alternativeTitles: [],
				thumbnailURL,
				downloadedChapters: 0,
				isDownloaded: false,
				isInLibrary: false,
				isFavorite: false,
				isMetadataLoaded: false,
				isUpdating: false
			};
			novels.push(novel);
		});
		return novels;
	}

	async getNovelMetadata(novel: NovelT): Promise<NovelT> {
		return novel;
	}
}