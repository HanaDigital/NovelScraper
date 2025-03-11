import { atomWithImmer } from 'jotai-immer'
import { atom } from 'jotai/vanilla'
import { DownloadDataT, NovelT } from "./sources/types";
import { SourceIDsT, SOURCES } from "./sources/sources";

export type AppStateT = {
	key: string;
	version: number;
	isSidePanelOpen: boolean;
	libraryRootPath: string;
	downloadBatchSize: number;
	downloadBatchDelay: number;
}
export const appStateAtom = atomWithImmer<AppStateT>({
	key: 'appState',
	version: 1,
	isSidePanelOpen: true,
	libraryRootPath: "",
	downloadBatchSize: 5,
	downloadBatchDelay: 0,
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