import { atomWithImmer } from 'jotai-immer'
import { atom } from 'jotai/vanilla'
import { DownloadDataT, NovelT } from "./sources/types";
import { SourceIDsT, SOURCES } from "./sources/sources";

type DownloadOptionsT = {
	downloadBatchSize: number;
	downloadBatchDelay: number;
}
export const getSourceDownloadOptions = (batchSize = 5, batchDelay = 0) => Object.fromEntries(Object.keys(SOURCES).map(s => [
	s,
	{
		downloadBatchSize: s === "novelbin" ? 2 : batchSize,
		downloadBatchDelay: s === "novelbin" ? 1 : batchDelay
	} satisfies DownloadOptionsT
])) as { [key in SourceIDsT]: DownloadOptionsT };
export type AppStateT = {
	key: string;
	version: number;
	viewedNotesForVersion?: string;
	isSidePanelOpen: boolean;
	libraryRootPath: string;
	sourceDownloadOptions: {
		[key in SourceIDsT]: DownloadOptionsT;
	}
}
export const appStateAtom = atomWithImmer<AppStateT>({
	key: 'appState',
	version: 2,
	viewedNotesForVersion: undefined,
	isSidePanelOpen: true,
	libraryRootPath: "",
	sourceDownloadOptions: getSourceDownloadOptions()
})

export type LibraryStateT = {
	key: string;
	novels: { [key: string]: NovelT };
}
export const libraryStateAtom = atomWithImmer<LibraryStateT>({
	key: 'libraryState',
	novels: {},
});


type searchHistoryT = { [key in SourceIDsT]: NovelT[]; }
const searchHistory: searchHistoryT = {} as searchHistoryT;
Object.keys(SOURCES).forEach((s) => {
	searchHistory[s as SourceIDsT] = [];
});
export const searchHistoryAtom = atomWithImmer<searchHistoryT>(searchHistory);

export const activeNovelAtom = atom<NovelT | null>(null);
export const downloadStatusAtom = atomWithImmer<{ [key: string]: DownloadDataT }>({});

export type DockerStatusT = {
	engineStatus: boolean;
	cfResolverStatus: boolean;
}
export const dockerAtom = atomWithImmer<DockerStatusT>({
	engineStatus: false,
	cfResolverStatus: false
});