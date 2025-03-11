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

export type DownloadDataT = {
	novel_id: string;
	status: "Downloading" | "Paused" | "Completed" | "Cancelled" | "Error";
	downloaded_chapters_count: number;
	downloaded_chapters?: ChapterT[];
	chapters_saved: boolean;
}
