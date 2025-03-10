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
		const novelInfoElem = $(".profile-manga");
		const title = novelInfoElem.find(".post-title h1").first().text().trim();
		const rating = novelInfoElem.find(".post-rating .score").first().text().trim();
		const coverURL = novelInfoElem.find(".summary_image img").attr("data-src");


		let alternativeTitles: string[] = [];
		for (const elem of novelInfoElem.find(".post-content_item")) {
			const heading = $(elem).find(".summary-heading").first().text().trim();
			if (heading.toLowerCase() === "alternative") {
				alternativeTitles = $(elem).find(".summary-content").first().text().trim().split(/\s*?,\s*?/g).map((s) => s.trim());
				break;
			}
		}

		const authors: string[] = [];
		novelInfoElem.find(".author-content a").each((_, elem) => {
			authors.push($(elem).text().trim());
		});
		const genres: string[] = [];
		novelInfoElem.find(".genres-content a").each((_, elem) => {
			genres.push($(elem).text().trim());
		});
		let status = "";
		for (const elem of novelInfoElem.find(".post-content_item")) {
			const heading = $(elem).find(".summary-heading").first().text().trim();
			if (heading.toLowerCase() === "status") {
				status = $(elem).find(".summary-content").first().text().trim();
				break;
			}
		}
		console.log("!!!C-PAGE:", $(".c-page .description-summary"));
		const description = $(".c-page .description-summary .summary__content").text().trim();

		const chaptersHTML = await this.fetchHTML(`${novel.url}ajax/chapters`, "POST");
		const $c = cheerio.load(chaptersHTML);
		const chapters = $c("li.wp-manga-chapter a");
		const totalChapters = chapters.length;
		const latestChapterTitle = chapters.first().text().trim();

		// Update novel
		novel.title = title ?? novel.title;
		novel.authors = authors ?? novel.authors;
		novel.genres = genres ?? novel.genres;
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
