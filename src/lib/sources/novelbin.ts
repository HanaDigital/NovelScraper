import * as cheerio from 'cheerio';
import { NovelT } from "./types";
import { hashString } from "../utils";
import { NovelSource, NovelSourceProps } from "./template";

export class NovelBin extends NovelSource {

	constructor({ id, name, tags, logo, url, cloudflareProtected }: NovelSourceProps) {
		super({ id, name, tags, logo, url, cloudflareProtected });
	}

	async searchNovels(query: string): Promise<NovelT[]> {
		const encodedQuery = encodeURIComponent(query);
		const url = `${this.url}/search?keyword=${encodedQuery}`;
		const response = await this.fetchHTML(url);
		if (!response) throw new Error('Failed to search novels');

		const $ = cheerio.load(response);
		const novels: NovelT[] = [];
		$("#list-page .col-novel-main .list-novel .row").each((_, elem) => {
			const titleElem = $(elem).find(".novel-title a")
			const title = titleElem.text().trim();
			let url = titleElem.attr("href") ?? "";

			const author = $(elem).find(".author").text().trim() ?? "Unknown";
			let thumbnailURL = $(elem).find("img").attr("src");

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
				isUpdating: false,
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
		const title = novelInfoElem.find(".desc > h3.title").first().text().trim();
		const rating = novelInfoElem.find(".rate-info .small strong span").first().text().trim();
		const coverURL = novelInfoElem.find(".info-holder .book img").attr("data-src");
		const alternativeTitles = novelInfoElem.find("ul.info li").eq(0).text().replace("Alternative names:", "").trim().split(", ");
		const authors: string[] = [];
		novelInfoElem.find("ul.info li").eq(1).find("a").each((_, elem) => {
			authors.push($(elem).text().trim());
		});
		const genres: string[] = [];
		novelInfoElem.find("ul.info li").eq(2).find("a").each((_, elem) => {
			genres.push($(elem).text().trim());
		});
		const status = novelInfoElem.find("ul.info li").eq(3).find("a").text().trim();

		const latestChapterTitle = $(".l-chapter .item-value").text().trim();
		const description = $("#tab-description").text().trim();

		const novelStrId = novel.url.split("/").pop();
		if (!novelStrId) throw new Error("Failed to get novel ID!");
		const chaptersHTML = await this.fetchHTML(`${this.url}/ajax/chapter-archive?novelId=${novelStrId}`);
		const $c = cheerio.load(chaptersHTML);
		const totalChapters = $c("ul.list-chapter li").length;

		// Update novel
		novel.title = title ?? novel.title;
		novel.authors = authors ?? novel.authors;
		novel.genres = genres ?? novel.genres;
		novel.alternativeTitles = alternativeTitles ?? novel.alternativeTitles;
		novel.description = description ?? novel.description ?? "No description available.";
		novel.coverURL = coverURL ?? novel.coverURL;
		novel.rating = rating ?? novel.rating ?? "No rating available.";
		novel.latestChapterTitle = latestChapterTitle ?? novel.latestChapterTitle;
		novel.totalChapters = totalChapters > 0 ? totalChapters : novel.totalChapters;
		novel.status = status ?? novel.status ?? "Unknown";

		return novel;
	}
}
