import { atomWithImmer } from 'jotai-immer'
import { atom } from 'jotai/vanilla'
import { DownloadDataT, NovelT } from "./sources/types";
import { SourceIDsT, SOURCES } from "./sources/sources";

type DownloadOptionsT = {
	downloadBatchSize: number;
	downloadBatchDelay: number;
}
export const sourceDownloadOptions = Object.fromEntries(Object.keys(SOURCES).map(s => [
	s,
	{
		downloadBatchSize: s === "novelbin" ? 2 : 5,
		downloadBatchDelay: s === "novelbin" ? 1 : 0
	} satisfies DownloadOptionsT
])) as { [key in SourceIDsT]: DownloadOptionsT };
export type AppStateT = {
	key: string;
	version: number;
	isSidePanelOpen: boolean;
	libraryRootPath: string;
	sourceDownloadOptions: {
		[key in SourceIDsT]: DownloadOptionsT;
	}
}
export const appStateAtom = atomWithImmer<AppStateT>({
	key: 'appState',
	version: 2,
	isSidePanelOpen: true,
	libraryRootPath: "",
	sourceDownloadOptions: sourceDownloadOptions
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