import { message } from "@tauri-apps/plugin-dialog";
import { exists, mkdir, open, remove, writeFile } from "@tauri-apps/plugin-fs";
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import * as path from '@tauri-apps/api/path';
import { ChapterT, NovelT } from "../sources/types";
import { SOURCES } from "../sources/sources";
import { load, Store } from "@tauri-apps/plugin-store";
import { convertFileSrc } from "@tauri-apps/api/core";
import clone from "clone";

export const createLibraryDir = async (libraryRootPath: string, subDir = "") => {
	try {
		const dir = await path.join(libraryRootPath, subDir);
		const dirExists = await exists(dir);
		if (!dirExists) await mkdir(dir, { recursive: true });
	} catch (e) {
		console.error(e);
		await message("Couldn't create library root folder!", { title: 'NovelScraper Library', kind: 'error' });
	}
}

export const saveNovelEpub = async (novel: NovelT, epub: Uint8Array, libraryRootPath: string) => {
	try {
		const epubPath = await getNovelPath(novel, libraryRootPath);
		await writeFile(epubPath, epub);
	} catch (e) {
		console.error(e);
		await message(`Couldn't save novel epub for ${novel.title}!`, { title: 'NovelScraper Library', kind: 'error' });
	}
}

export const getNovelPath = async (novel: NovelT, libraryRootPath: string) => {
	const source = SOURCES[novel.source];
	const dir = await path.join(libraryRootPath, source.name);
	const dirExists = await exists(dir);
	if (!dirExists) await mkdir(dir, { recursive: true });

	const novelFilename = getFilenameFromStr(novel.title) + ".epub";
	const novelPath = await path.join(dir, novelFilename);
	return novelPath;
}

export const saveNovelCover = async (novel: NovelT) => {
	try {
		const coverURL = novel.coverURL ?? novel.thumbnailURL;
		if (!coverURL) return;
		const novelDir = await getNovelDataDir(novel);

		const source = SOURCES[novel.source];
		const coverBuff = new Uint8Array(await source.fetchImage(coverURL));
		const coverPath = await path.join(novelDir, "cover.png");
		await writeFile(coverPath, coverBuff);
		return coverPath;
	} catch (e) {
		console.error(e);
		await message(`Couldn't save novel cover for ${novel.title}!`, { title: 'NovelScraper Library', kind: 'error' });
	}
}

export const saveNovelCoverFromLocalFile = async (novel: NovelT) => {
	try {
		const coverLocalPath = await dialogOpen({
			defaultPath: await path.downloadDir(),
			filters: [{
				name: 'Image',
				extensions: ['png', 'jpeg', 'jpg']
			}]
		});
		if (!coverLocalPath) return;

		const file = await open(coverLocalPath, {
			read: true,
		});
		const stat = await file.stat();
		const coverBuff = new Uint8Array(stat.size);
		await file.read(coverBuff);
		await file.close();

		const novelDir = await getNovelDataDir(novel);
		const coverPath = await path.join(novelDir, "cover.png");
		await writeFile(coverPath, coverBuff);
		return coverPath;
	} catch (e) {
		console.error(e);
		await message(`Couldn't change cover for ${novel.title}`, { title: SOURCES[novel.source].name, kind: 'error' });
	}
}

export const getUnCachedFileSrc = (filePath: string) => {
	const src = convertFileSrc(filePath) + "?t=" + (new Date).getMilliseconds();
	return src;
}

export const saveNovelChapters = async (novelStore: Store, novel: NovelT, chapters: ChapterT[]) => {
	try {
		await novelStore.set("chapters", chapters);
		await novelStore.save();
	} catch (e) {
		console.error("saveNovelChapters:", e);
		// await message(`Couldn't save novel chapters for ${novel.title}!`, { title: 'NovelScraper Library', kind: 'error' });
	}
}

export const getNovelChapters = async (novel: NovelT) => {
	try {
		const novelStore = await getNovelStore(novel);
		const chapters = await novelStore.get("chapters") as ChapterT[] || undefined;
		await novelStore.close();
		return chapters ?? [];
	} catch (e) {
		console.error(e);
		await message(`Couldn't get novel chapters for ${novel.title}!`, { title: 'NovelScraper Library', kind: 'error' });
	}
	return [];
}

export const deleteNovelData = async (novel: NovelT) => {
	try {
		const novelDir = await getNovelDataDir(novel);
		await remove(novelDir, { recursive: true });
	} catch (e) {
		console.error(e);
		await message(`Couldn't delete novel data for ${novel.title}!`, { title: 'NovelScraper Library', kind: 'error' });
	}
}

export const getFilenameFromStr = (str: string) => {
	return str.replace(/[^a-zA-Z0-9]/g, "_");
}

const getNovelDataDir = async (novel: NovelT) => {
	const dir = await path.appDataDir();
	const novelDir = await path.join(dir, "novel-data", novel.source as string, novel.id);
	const dirExists = await exists(novelDir);
	if (!dirExists) await mkdir(novelDir, { recursive: true });
	return novelDir;
}

export const getNovelStore = async (novel: NovelT) => {
	const novelDir = await getNovelDataDir(novel);
	const novelStore = await load(`${novelDir}/${novel.id}-store.json`, { autoSave: false });
	return novelStore;
}

export const fetchMetadataForNovel = async (novel: NovelT) => {
	try {
		const novelSource = SOURCES[novel.source];
		const _novel = await novelSource.getNovelMetadata(clone(novel));
		_novel.isMetadataLoaded = true;
		_novel.updatedMetadataAt = new Date().toISOString();
		_novel.updatedChaptersAt = new Date().toISOString();
		return _novel;
	} catch (e) {
		console.error(e);
		return novel;
	}
}

export const fetchMetadataForNovels = async (novels: NovelT[]) => {
	const updatedNovels: NovelT[] = [];

	const sourceGroup: { [key: string]: NovelT[] } = {};
	for (const novel of novels) {
		const source = SOURCES[novel.source];
		if (!sourceGroup[source.name]) sourceGroup[source.name] = [];
		sourceGroup[source.name].push(novel);
	}

	const fetchSourceMetadata = async (source: string) => {
		for (let novel of sourceGroup[source]) {
			const _novel = await fetchMetadataForNovel(novel);
			updatedNovels.push(_novel);
		}
	}

	await Promise.all(Object.keys(sourceGroup).map(fetchSourceMetadata));
	return updatedNovels;
}
