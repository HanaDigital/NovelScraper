import * as cheerio from 'cheerio';
import { NovelT } from "./types";
import { hashString } from "../utils";
import { NovelSource, NovelSourceProps } from "./template";
import { SOURCES } from "./sources";

export class Novgo extends NovelSource {

	constructor({ id, name, tags, logo, url, cloudflareProtected }: NovelSourceProps) {
		super({ id, name, tags, logo, url, cloudflareProtected });
	}

	async searchNovels(query: string): Promise<NovelT[]> {
		const encodedQuery = encodeURIComponent(query);
		const url = `${this.url}/?s=${encodedQuery}&post_type=wp-manga`;
		const html = await this.fetchHTML(url);
		if (!html) throw new Error('Failed to search novels');

		const $ = cheerio.load(html);
		const novels: NovelT[] = [];
		$(".c-tabs-item .row").each((i, elem) => {
			const titleElem = $(elem).find(".post-title h3 a")
			const title = titleElem.text().trim();
			let url = titleElem.attr("href") ?? "";

			const author = $(elem).find(".post-content mg_author .summary-content").text().trim() ?? "Unknown";
			let thumbnailURL = $(elem).find(".tab-thumb img").attr("data-src");

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
		const response = await this.fetchHTML(novel.url);
		if (!response) throw new Error('Failed to fetch novel');
		const $ = cheerio.load(response);

		// Get novel metadata
		const novelInfoElem = $(".col-info-desc");
		const title = novelInfoElem.find(".desc h3.title").first().text().trim();
		const rating = novelInfoElem.find(".desc .rate-info .small span").first().text().trim();
		const coverURL = novelInfoElem.find(".book img").attr("data-src");
		console.log("!!!Cover URL:", coverURL);


		let alternativeTitles: string[] = [];
		for (const elem of novelInfoElem.find(".post-content_item")) {
			const heading = $(elem).find(".summary-heading").first().text().trim();
			if (heading.toLowerCase() === "alternative") {
				alternativeTitles = $(elem).find(".summary-content").first().text().trim().split(/\s*?,\s*?/g).map((s) => s.trim());
				break;
			}
		}

		const authors = null;
		const genres = null;
		// const authors: string[] = [];
		// novelInfoElem.find(".author-content a").each((_, elem) => {
		// 	authors.push($(elem).text().trim());
		// });
		// const genres: string[] = [];
		// novelInfoElem.find(".genres-content a").each((_, elem) => {
		// 	genres.push($(elem).text().trim());
		// });
		// let status = "";
		// for (const elem of novelInfoElem.find(".post-content_item")) {
		// 	const heading = $(elem).find(".summary-heading").first().text().trim();
		// 	if (heading.toLowerCase() === "status") {
		// 		status = $(elem).find(".summary-content").first().text().trim();
		// 		break;
		// 	}
		// }
		const description = $("#tab-description").text().trim();

		const novelId = novel.url.split("/").at(-2);
		if (!novelId) throw new Error("Failed to get novel ID!");
		const chaptersHTML = await this.fetchHTML(`${SOURCES[novel.source].url}/ajax/chapter-archive?novelId=${novelId}`, "GET");
		const $c = cheerio.load(chaptersHTML);
		const chapters = $c(".list-chapter a");
		const totalChapters = chapters.length;
		const latestChapterTitle = chapters.last().text().trim();

		// Update novel
		novel.title = title ?? novel.title;
		novel.authors = authors ?? novel.authors ?? "Unknown";
		novel.genres = genres ?? novel.genres ?? "Unknown";
		novel.alternativeTitles = alternativeTitles ?? novel.alternativeTitles;
		novel.description = description ?? novel.description ?? "No description available.";
		novel.coverURL = coverURL ?? novel.coverURL;
		novel.rating = rating ?? novel.rating ?? "No rating available.";
		novel.latestChapterTitle = latestChapterTitle ?? novel.latestChapterTitle ?? "Unknown";
		novel.totalChapters = totalChapters > 0 ? totalChapters : novel.totalChapters;
		novel.status = status ?? novel.status ?? "Unknown";

		return novel;
	}
}
