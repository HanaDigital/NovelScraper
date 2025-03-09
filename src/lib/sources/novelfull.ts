import * as cheerio from 'cheerio';
import { NovelT } from "./types";
import { hashString } from "../utils";
import { NovelSource, NovelSourceProps } from "./template";

export class NovelFull extends NovelSource {

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
		$("#list-page .col-truyen-main .row").each((_, elem) => {
			const titleElem = $(elem).find("h3.truyen-title a")
			const title = titleElem.text().trim();
			let url = titleElem.attr("href") ?? "";
			if (url) url = `${this.url}${url}`;

			const author = $(elem).find(".author").text().trim() ?? "Unknown";
			let thumbnailURL = $(elem).find("img").attr("src");
			if (thumbnailURL) thumbnailURL = `${this.url}${thumbnailURL}`;

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
		const rating = novelInfoElem.find(".small").text().trim().replace("Rating: ", "").replace(/from[\S\s]*?(?=\d)/g, "from ");
		const description = novelInfoElem.find(".desc-text").text().trim();
		const latestChapterTitle = novelInfoElem.find(".l-chapter > ul.l-chapters > li").first().text().trim();
		const coverURL = novelInfoElem.find(".info-holder .book img").attr("src");

		const infoHolderElems = $(".info-holder > .info > div");
		const authors = infoHolderElems.eq(0).find("a").map((_, elem) => $(elem).text().trim()).get();
		const alternativeTitles = infoHolderElems.eq(1).text().replace("Alternative names:", "").trim().split(", ");
		const genres = infoHolderElems.eq(2).find("a").map((_, elem) => $(elem).text().trim()).get();
		const status = infoHolderElems.eq(4).find("a").text().trim();

		// Get chapters per page
		const chaptersElem = $("#list-chapter");
		let chaptersPerPage = 0;
		chaptersElem.find("ul.list-chapter").each((_, elem) => {
			chaptersPerPage += $(elem).find("li").length;
		});

		// Get total chapters
		let totalPages = 1;
		let totalChapters = 0;
		const lastPageURL = chaptersElem.find("ul.pagination > li.last").find("a").attr("href");
		if (lastPageURL) {
			totalPages = parseInt(lastPageURL.split("=").pop() ?? "1");
			totalChapters = chaptersPerPage * (totalPages - 1);

			try {
				const lastPageUri = new URL(`${novel.url}?page=${totalPages}`);
				const lastPageRes = await this.fetchHTML(lastPageUri.toString());
				if (!lastPageRes) throw new Error('Failed to fetch last page!');
				const lastPageDocument = cheerio.load(lastPageRes);
				lastPageDocument("ul.list-chapter").each((_, elem) => {
					totalChapters += $(elem).find("li").length;
				});
			} catch (e) {
				console.error(`Failed to get total chapters for ${novel.title}!`, e);
			}
		} else {
			totalChapters = chaptersPerPage;
		}

		// Update novel
		novel.title = title ?? novel.title;
		novel.authors = authors ?? novel.authors;
		novel.genres = genres ?? novel.genres;
		novel.alternativeTitles = alternativeTitles ?? novel.alternativeTitles;
		novel.description = description ?? novel.description ?? "No description available.";
		novel.coverURL = coverURL ? `${this.url}${coverURL}` : novel.coverURL;
		novel.rating = rating ?? novel.rating ?? "No rating available.";
		novel.latestChapterTitle = latestChapterTitle ?? novel.latestChapterTitle;
		novel.totalChapters = totalChapters > 0 ? totalChapters : novel.totalChapters;
		novel.status = status ?? novel.status ?? "Unknown";

		return novel;
	}
}
