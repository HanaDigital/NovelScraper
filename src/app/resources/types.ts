import { remote } from 'electron';
import * as path from 'path';

// LIBRARY
const libraryFolder = path.join(remote.app.getPath("downloads"), "NovelScraper-Library");

export const newLibraryObj: libraryObj = {
	libraryFolder: libraryFolder,
	compactMode: false,
	novels: [],
	settings: [],
}

export type novelFields =
	"link" |
	"name" |
	"latestChapter" |
	"cover" |
	"totalChapters" |
	"source" |
	"author" |
	"genre" |
	"summary" |
	"cachedCover" |
	"folderPath" |
	"downloaded" |
	"isUpdated" |
	"lastUpdated" |
	"state";

export type novelUpdate = string | number | boolean;

export interface libraryObj {
	libraryFolder: string,
	compactMode: boolean,
	novels: novelObj[],
	settings?: { id: string, value: string }[],
}

export interface novelObj {
	link?: string,
	name?: string,
	latestChapter?: string,
	cover?: string,
	totalChapters?: number,
	downloadedChapters?: number,
	source?: string,
	author?: string,
	genre?: string,
	summary?: string,
	cachedCover?: string,
	folderPath?: string,
	downloading?: boolean,
	downloaded?: boolean,
	isUpdated?: boolean,
	lastUpdated?: string,
	inLibrary?: boolean,
	state?: { id: string, value: string }[],
}

export interface chapterObj {
	title: string,
	data: string,
	read?: boolean,
	scroll?: number
}

// SOURCES

export type sourcesList = sourceObj[];

export interface sourceObj {
	name: string,
	link: string,
	icon: string,
}

export interface downloadTracker {
	link: string,
	downloadID: number,
	width: string,
	cancel: boolean,
	downloaded: boolean
}

export interface update {
	updateChapters: chapterObj[],
	startIndex: number
}

