import { CloudflareHeadersT, getCloudflareHeaders } from "@/components/cloudflare-resolver";
import { SourceIDsT } from "./sources";
import { ChapterT, NovelT } from "./types";
import { invoke } from "@tauri-apps/api/core";

export type NovelSourceProps = {
	id: string;
	name: string;
	tags: string[];
	logo: string;
	url: string;
	cloudflareProtected: boolean;
}
export class NovelSource {
	id: SourceIDsT;
	name: string;
	tags: string[];
	logo: string;
	url: string;
	cloudflareProtected: boolean;

	cfHeaders: CloudflareHeadersT | null;
	cfHeadersLastFetchedAt: Date | null;

	constructor({ id, name, tags, logo, url, cloudflareProtected }: NovelSourceProps) {
		this.id = id as SourceIDsT;
		this.name = name;
		this.tags = tags;
		this.logo = logo;
		this.url = url;
		this.cloudflareProtected = cloudflareProtected;

		this.cfHeaders = null;
		this.cfHeadersLastFetchedAt = null;
	}

	async searchNovels(query: string): Promise<NovelT[]> {
		throw new Error(`${this.name}: 'searchNovels' method not implemented.`);
	}

	async getNovelMetadata(novel: NovelT): Promise<NovelT> {
		throw new Error(`${this.name}: 'updateNovelMetadata' method not implemented.`);
	}

	async downloadNovel(novel: NovelT, batchSize: number, batchDelay: number, startFromChapterIndex = 0): Promise<ChapterT[]> {
		const chapters = await this.downloadChapters(novel, batchSize, batchDelay, startFromChapterIndex);
		return chapters;
	}

	async downloadChapters(novel: NovelT, batchSize: number, batchDelay: number, startFromChapterIndex = 0): Promise<ChapterT[]> {
		await this.loadCFHeaders();
		const chapters = await invoke<ChapterT[]>('download_novel_chapters', {
			novel_id: novel.id,
			novel_url: novel.url,
			source_id: this.id,
			source_url: this.url,
			batch_size: batchSize,
			batch_delay: batchDelay,
			start_downloading_from_index: startFromChapterIndex,
			cf_headers: this.cfHeaders,
		});
		return chapters;
	}

	async cancelDownload(novel: NovelT): Promise<void> {
		console.log('Cancelling download for', novel.id);
		await invoke<String>('update_novel_download_status', {
			novel_id: novel.id,
			status: 'Cancelled',
		});
	}

	async fetchHTML(url: string, fetch_type: "GET" | "POST" = "GET"): Promise<string> {
		await this.loadCFHeaders();
		return await invoke<string>('fetch_html', { url, headers: this.cfHeaders, fetch_type });
	}

	async fetchImage(url: string): Promise<ArrayBuffer> {
		await this.loadCFHeaders();
		return await invoke<ArrayBuffer>('fetch_image', { url, headers: this.cfHeaders });
	}

	private async loadCFHeaders() {
		if (this.cloudflareProtected) {
			if (!this.cfHeaders || this.cfHeadersLastFetchedAt && new Date().getTime() - this.cfHeadersLastFetchedAt.getTime() > 1000 * 60 * 60) {
				console.log("Fetching cloudflare headers...");
				this.cfHeaders = await getCloudflareHeaders(this.url);
				this.cfHeadersLastFetchedAt = new Date();
			} else {
				console.log("Using cached cloudflare headers...");
			}
		}
	}
}
