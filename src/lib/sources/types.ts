import { Store } from "@tauri-apps/plugin-store";
import { SourceIDsT } from "./sources";

export type ChapterT = {
	title: string;
	url: string;
	content?: string;
}

export type NovelT = {
	id: string;
	source: SourceIDsT;
	url: string;
	title: string;
	authors: string[];
	genres: string[];
	alternativeTitles: string[];
	description?: string;
	coverURL?: string;
	thumbnailURL?: string;
	localCoverPath?: string;
	localCoverPathId?: string;
	latestChapterTitle?: string;
	totalChapters?: number;
	status?: string;
	rating?: string;
	downloadedChapters: number;
	isDownloaded: boolean;
	isInLibrary: boolean;
	isFavorite: boolean;
	isMetadataLoaded: boolean;
	addedToLibraryAt?: string;
	updatedMetadataAt?: string;
	updatedChaptersAt?: string;
	downloadedAt?: string;
	isUpdating: boolean;
}

export type DownloadStatus = "Downloading" | "Paused" | "Completed" | "Cancelled" | "Error";
export type DownloadDataT = {
	novel_id: string;
	status: DownloadStatus;
	downloaded_chapters_count: number;
	downloaded_chapters?: ChapterT[];
	novelStore: Store;
}
export type SourceDownloadResult = {
	status: DownloadStatus,
	chapters: ChapterT[]
}
