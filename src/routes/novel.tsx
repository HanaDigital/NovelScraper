import Loader from "@/components/loader";
import Page from "@/components/page";
import { SourceIDsT, SOURCES } from "@/lib/sources/sources";
import { DownloadDataT, NovelT } from "@/lib/sources/types";
import { activeNovelAtom, appStateAtom, dockerAtom, downloadStatusAtom, libraryStateAtom, searchHistoryAtom } from "@/lib/store";
import { createFileRoute } from '@tanstack/react-router'
import { useAtom, useAtomValue, useSetAtom } from "jotai/react";
import { useEffect, useState } from "react";
import clone from "clone";
import { Button } from "@/components/ui/button";
import { BookmarkMinusSolid, BookmarkPlusSolid, DownloadSolid, ExternalLink, FolderSolid, ImageSolid, RefreshSolid, XSquareSolid } from "@mynaui/icons-react";
import { deleteNovelData, fetchMetadataForNovel, getNovelChapters, getNovelPath, getNovelStore, getUnCachedFileSrc, saveNovelCover, saveNovelCoverFromLocalFile, saveNovelEpub } from "@/lib/library/library";
import EpubTemplate from "@/lib/library/epub";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { TooltipUI } from "@/components/tooltip";
import { Progress } from "@/components/ui/progress";
import { TinyP } from "@/components/typography";
import { revealItemInDir, openUrl } from '@tauri-apps/plugin-opener';
import MissingImageBanner from "@/assets/ui/missing-image-banner.jpg";
import { CloudflareResolverStatus } from "@/components/cloudflare-resolver";

export const Route = createFileRoute('/novel')({
	component: RouteComponent,
})

function RouteComponent() {
	const [activeNovel, setActiveNovel] = useAtom(activeNovelAtom);
	const setSearchHistory = useSetAtom(searchHistoryAtom);
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const [novel, setNovel] = useState<NovelT>();
	const [coverSrc, setCoverSrc] = useState<string>();
	const [novelDownloadStatus, setNovelDownloadStatus] = useState<DownloadDataT>();
	const [isLoading, setIsLoading] = useState(false);
	const appState = useAtomValue(appStateAtom);
	const [downloadStatus, setDownloadStatus] = useAtom(downloadStatusAtom);
	const [isDownloading, setIsDownloading] = useState(false);
	const docker = useAtomValue(dockerAtom);
	const [cfReady, setCFReady] = useState(true);

	useEffect(() => {
		loadNovelMetadata();
	}, [activeNovel]);

	useEffect(() => {
		if (!novel) return;
		setCFReady(SOURCES[novel.source].cloudflareProtected ? (docker.engineStatus && docker.cfResolverStatus) : true);
	}, [novel, docker]);

	useEffect(() => {
		if (!activeNovel || !libraryState.novels[activeNovel.id]) return;
		updateState(libraryState.novels[activeNovel.id], false);
	}, [libraryState.novels[activeNovel?.id ?? ""]]);

	useEffect(() => {
		if (!activeNovel) return;
		const status = downloadStatus[activeNovel.id];
		setNovelDownloadStatus(status);
	}, [downloadStatus[activeNovel?.id ?? ""]]);

	const loadNovelMetadata = async (forceFetch = false) => {
		try {
			if (!activeNovel) return;
			setNovel(undefined);
			let _novel = activeNovel;

			if (!_novel.isMetadataLoaded || forceFetch) _novel = await fetchMetadata(_novel);

			if (_novel.localCoverPath) {
				setCoverSrc(getUnCachedFileSrc(_novel.localCoverPath));
			} else if (SOURCES[_novel.source].cloudflareProtected && !_novel.isInLibrary) {
				setCoverSrc("asset://localhost:3000/test.jpg")
			} else {
				setCoverSrc(_novel.coverURL ?? _novel.thumbnailURL);
			}


			updateState(_novel, false);
		} catch (e) {
			console.error(e);
		}
	}

	const fetchMetadata = async (_novel: NovelT) => {
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));
			const updatedNovel = await fetchMetadataForNovel(_novel);
			if (!updatedNovel) throw new Error("Failed to fetch metadata");
			_novel = updatedNovel;
		} catch (e) {
			console.error(e);
			await message(`Couldn't get metadata for ${_novel.title}`, { title: SOURCES[_novel.source].name, kind: 'error' });
		}
		return _novel;
	}

	const handleAddToLibrary = async () => {
		if (!novel) return;
		try {
			setIsLoading(true);
			const libNovel = clone(novel);
			libNovel.isInLibrary = true;
			libNovel.addedToLibraryAt = new Date().toISOString();
			const localCoverPath = await saveNovelCover(libNovel);
			libNovel.localCoverPath = localCoverPath;
			updateState(libNovel, true);
		} catch (e) {
			console.error(e);
			await message(`Couldn't add ${novel.title} to library`, { title: SOURCES[novel.source].name, kind: 'error' });
		}
		setIsLoading(false);
	}

	const handleDownload = async () => {
		if (
			!novel
			|| !novel.isInLibrary
			|| isDownloading
			|| novelDownloadStatus?.status === "Downloading"
		) return;
		setIsDownloading(true);
		try {
			const novelSource = SOURCES[novel.source];
			await new Promise((resolve) => setTimeout(resolve, 500));
			const libNovel = clone(novel);
			const preDownloadedChapters = await getNovelChapters(novel);
			const novelStore = await getNovelStore(novel);
			setDownloadStatus(status => {
				status[novel.id] = {
					novel_id: novel.id,
					status: "Downloading",
					downloaded_chapters_count: preDownloadedChapters.length,
					downloaded_chapters: preDownloadedChapters,
					novelStore,
				};
			});
			const downloadedChapters = await novelSource.downloadNovel(novel, appState.downloadBatchSize, appState.downloadBatchDelay, preDownloadedChapters.length);
			const chapters = [...preDownloadedChapters, ...downloadedChapters];
			console.log("!!!CHAPTERS:", chapters);
			const epub = await EpubTemplate.generateEpub(novel, chapters);
			await saveNovelEpub(novel, epub, appState.libraryRootPath);
			libNovel.downloadedChapters = chapters.length;
			libNovel.isDownloaded = true;
			libNovel.downloadedAt = new Date().toISOString();
			updateState(libNovel, true);
		} catch (e) {
			console.error(e);
			await message(`${e}`, { title: SOURCES[novel.source].name, kind: 'error' });
		}
		setIsDownloading(false);
	}

	const handleCancelDownload = async () => {
		if (!novel) return;
		try {
			const novelSource = SOURCES[novel.source];
			await novelSource.cancelDownload(novel);
		} catch (e) {
			console.error(e);
			await message(`Couldn't cancel download for ${novel.title}`, { title: SOURCES[novel.source].name, kind: 'error' });
		}
	}

	const handleOpenNovelFolder = async () => {
		if (!novel) return;
		try {
			const novelPath = await getNovelPath(novel, appState.libraryRootPath);
			await revealItemInDir(novelPath);
		} catch (e) {
			console.error(e);
			await message(`Couldn't open folder for ${novel.title}`, { title: SOURCES[novel.source].name, kind: 'error' });
		}
	}

	const handleOpenInBrowser = async () => {
		if (!novel) return;
		try {
			await openUrl(novel.url);
		} catch (e) {
			console.error(e);
			await message(`Couldn't open ${novel.title} in browser`, { title: SOURCES[novel.source].name, kind: 'error' });
		}
	}

	const handleRemoveFromLibrary = async () => {
		try {
			if (!novel) return;
			const isSure = await ask(`Are you sure you want to remove ${novel.title} from the library?`, {
				title: 'NovelScraper Library',
				kind: 'warning',
			});
			if (!isSure) return;

			const libNovel = clone(novel);
			libNovel.isInLibrary = false;
			libNovel.addedToLibraryAt = undefined;
			libNovel.updatedMetadataAt = new Date().toISOString();
			libNovel.localCoverPath = undefined;
			libNovel.downloadedChapters = 0;
			libNovel.isFavorite = false;
			libNovel.isDownloaded = false;
			setLibraryState((library) => {
				delete library.novels[libNovel.id];
			});
			setDownloadStatus((status) => {
				delete status[libNovel.id];
			});
			updateState(libNovel, false);
			await deleteNovelData(libNovel);
		} catch (e) {
			console.error(e);
		}
	}

	const updateState = async (_novel: NovelT, saveInLibrary: boolean) => {
		if (saveInLibrary || _novel.isInLibrary) setLibraryState((library) => {
			library.novels[_novel.id] = _novel;
		});
		setSearchHistory((state) => {
			let novels = state[_novel.source as SourceIDsT];
			let novelIndex = novels.findIndex((n) => n.id === _novel.id);
			if (novelIndex < 0) return state;
			novels[novelIndex] = _novel;
		});
		setActiveNovel(_novel);
		setNovel(_novel);
	}

	const handleChangeCover = async () => {
		if (!novel || !novel.isInLibrary) return;
		setIsLoading(true);
		const localCoverPath = await saveNovelCoverFromLocalFile(novel);
		if (localCoverPath) {
			const libNovel = clone(novel);
			libNovel.localCoverPath = localCoverPath;
			updateState(libNovel, true);
			setCoverSrc(getUnCachedFileSrc(localCoverPath));
		}
		setIsLoading(false);
	}

	if (!novel || isLoading) return <Loader />
	return (
		<Page>
			{SOURCES[novel.source].cloudflareProtected && <CloudflareResolverStatus />}
			<div className="flex justify-between items-center">
				<div className="flex gap-2">
					{!novel.isInLibrary && <TooltipUI content="Add to Library" side="bottom" sideOffset={8}>
						<Button size="icon" onClick={handleAddToLibrary} disabled={!cfReady}><BookmarkPlusSolid /></Button>
					</TooltipUI>}
					{novel.isInLibrary && <TooltipUI content="Remove from Library" side="bottom" sideOffset={8}>
						<Button size="icon" variant="destructive" onClick={handleRemoveFromLibrary} disabled={
							novelDownloadStatus?.status === "Downloading"
							|| isDownloading
						}><BookmarkMinusSolid /></Button>
					</TooltipUI>}
					<TooltipUI content="Refresh Metadata" side="bottom" sideOffset={8}>
						<Button size="icon" variant="secondary" onClick={() => loadNovelMetadata(true)} disabled={novel.isUpdating || !cfReady}><RefreshSolid /></Button>
					</TooltipUI>
					<TooltipUI content="Open in Browser" side="bottom" sideOffset={8}>
						<Button size="icon" variant="outline" onClick={handleOpenInBrowser}><ExternalLink /></Button>
					</TooltipUI>
					<TooltipUI content="Change Cover" side="bottom" sideOffset={8}>
						<Button size="icon" variant="outline" onClick={handleChangeCover}><ImageSolid /></Button>
					</TooltipUI>
					{(novel.isInLibrary && novelDownloadStatus?.status !== "Downloading") &&
						<TooltipUI content="Download" side="bottom" sideOffset={8}>
							<Button className="!p-0" size="icon" onClick={handleDownload} disabled={isDownloading || !cfReady}><DownloadSolid /></Button>
						</TooltipUI>}
					{(novel.isInLibrary && novelDownloadStatus?.status === "Downloading") &&
						<TooltipUI content="Cancel Download" side="bottom" sideOffset={8}>
							<Button className="!p-0" size="icon" variant="destructive" onClick={handleCancelDownload}><XSquareSolid /></Button>
						</TooltipUI>}
					{(novel.isInLibrary && novel.isDownloaded) && <TooltipUI content="Open Folder" side="bottom" sideOffset={8}>
						<Button className="!p-0" size="icon" onClick={handleOpenNovelFolder}><FolderSolid /></Button>
					</TooltipUI>}
				</div>

				{novelDownloadStatus &&
					<div className="flex flex-col gap-1 w-72">
						<div className="flex justify-between">
							<TinyP>{novelDownloadStatus.status}</TinyP>
							<TinyP>{novelDownloadStatus.downloaded_chapters_count} / {novel.totalChapters}</TinyP>
						</div>
						<Progress value={((novelDownloadStatus?.downloaded_chapters_count || 0) / (novel.totalChapters || 1)) * 100} content="Downloading" />
					</div>
				}
			</div>

			<div className="grid grid-cols-[250px_auto] gap-4">
				<object className="w-full" data={coverSrc} type="image/jpg">
					<img src={MissingImageBanner} alt="Novel Cover" />
				</object>

				{/* <P><b>Author:</b> {novel.authors.join(', ')}</P>
					<P><b>Genres:</b> {novel.genres.join(', ')}</P>
					<P><b>Alternative Titles:</b> {novel.alternativeTitles.join(', ')}</P>
					<P><b>Total Chapters:</b> {novel.totalChapters}</P>
					<P><b>Downloaded Chapters:</b> {novel.downloadedChapters}</P>
					<P><b>Latest Chapter Title:</b> {novel.latestChapterTitle}</P>
					<P><b>Status:</b> {novel.status}</P>
					<P><b>Rating:</b> {novel.rating}</P> */}

				<div className="grid grid-cols-[200px_auto] gap-2">
					<b>Author</b>
					<div>{novel.authors.join(', ')}</div>
					<b>Genres</b>
					<div>{novel.genres.join(', ')}</div>
					<b>Alternative Titles</b>
					<div>{novel.alternativeTitles.join(', ')}</div>
					<b>Total Chapters</b>
					<div>{novel.totalChapters}</div>
					<b>Downloaded Chapters</b>
					<div>{novel.downloadedChapters}</div>
					<b>Latest Chapter Title</b>
					<div>{novel.latestChapterTitle}</div>
					<b>Status</b>
					<div>{novel.status}</div>
					<b>Rating</b>
					<div>{novel.rating}</div>
					<b>Source</b>
					<div>{SOURCES[novel.source].name}</div>
				</div>
			</div>
			{/* <h1>{novel.title}</h1> */}
			<p>{novel.description}</p>
			{/* <p>Is Downloaded: {novel.isDownloaded}</p>
			<p>Is In Library: {novel.isInLibrary}</p>
			<p>Is Favorite: {novel.isFavorite}</p> */}
		</Page>
	)
}
