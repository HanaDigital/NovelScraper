import { CloudflareHeadersT, getCloudflareHeaders } from "../utils";
import { SourceIDsT } from "./sources";
import { NovelT, SourceDownloadResult } from "./types";
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

	async downloadNovel(novel: NovelT, batchSize: number, batchDelay: number, preDownloadedChaptersCount = 0): Promise<SourceDownloadResult> {
		const result = await this.downloadChapters(novel, batchSize, batchDelay, preDownloadedChaptersCount);
		return result;
	}

	async downloadChapters(novel: NovelT, batchSize: number, batchDelay: number, preDownloadedChaptersCount = 0): Promise<SourceDownloadResult> {
		await this.loadCFHeaders();
		const result = await invoke<SourceDownloadResult>('download_novel_chapters', {
			novel_id: novel.id,
			novel_title: novel.title,
			novel_url: novel.url,
			source_id: this.id,
			source_url: this.url,
			batch_size: batchSize,
			batch_delay: batchDelay,
			pre_downloaded_chapters_count: preDownloadedChaptersCount,
			cf_headers: this.cfHeaders,
		});
		return result;
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
