import { CardGridUI, CardUI, NovelUpdatingBadge, RemainingChaptersBadge } from "@/components/card";
import { CloudflareResolverStatus } from "@/components/cloudflare-resolver";
import Page from '@/components/page';
import SearchBar from "@/components/search-bar";
import { TooltipUI } from "@/components/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { fetchMetadataForNovels, getUnCachedFileSrc } from "@/lib/library/library";
import { SOURCES } from "@/lib/sources/sources";
import { NovelT } from "@/lib/sources/types";
import { activeNovelAtom, dockerAtom, libraryStateAtom } from "@/lib/store";
import { RefreshSolid } from "@mynaui/icons-react";
import { createFileRoute } from '@tanstack/react-router'
import { message } from "@tauri-apps/plugin-dialog";
import { useAtom, useAtomValue, useSetAtom } from "jotai/react";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute('/library')({
	component: RouteComponent,
})

function RouteComponent() {
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const setActiveNovel = useSetAtom(activeNovelAtom);
	const [filteredNovels, setFilteredNovels] = useState<NovelT[]>(Object.values(libraryState.novels));
	const [isCFAlertOpen, setIsCFAlertOpen] = useState(false);
	const [docker, setDocker] = useAtom(dockerAtom);

	useEffect(() => {
		setFilteredNovels(Object.values(libraryState.novels));
	}, [libraryState.novels]);

	useEffect(() => {
		if (isCFAlertOpen && docker.engineStatus && docker.cfResolverStatus) {
			setIsCFAlertOpen(false);
			handleCheckForUpdates();
		}
	}, [isCFAlertOpen, docker]);

	const handleSearch = async (query: string) => {
		setFilteredNovels(Object.values(libraryState.novels).filter((novel) => {
			return novel.title.toLowerCase().includes(query.toLowerCase());
		}));
	}

	const handleClear = () => {
		setFilteredNovels(Object.values(libraryState.novels));
	}

	const handleCheckForUpdates = async () => {
		try {
			const novels = Object.values(libraryState.novels).filter(novel => !novel.isUpdating);
			if (novels.some(novel => SOURCES[novel.source].cloudflareProtected) && (!docker.engineStatus || !docker.cfResolverStatus)) {
				setIsCFAlertOpen(true);
				return;
			}

			setLibraryState((state) => {
				for (const novel of novels) {
					state.novels[novel.id].isUpdating = true;
				}
			});
			const updatedNovels = await fetchMetadataForNovels(novels);
			setLibraryState((state) => {
				for (const novel of updatedNovels) {
					novel.isUpdating = false;
					state.novels[novel.id] = novel;
				}
			});
		} catch (e) {
			console.error(e);
			await message(`Couldn't check for updates`, { title: "NovelScraper", kind: 'error' });
		}
	}

	return (
		<Page
			titleBarContent={
				<Button size="sm" variant="secondary" onClick={handleCheckForUpdates}>
					<RefreshSolid />
					Update Library
				</Button>
			}
		>
			<SearchBar
				handleSearch={handleSearch}
				handleClear={handleClear}
				searchOnType
			/>
			<CardGridUI>
				{filteredNovels.map((novel) => {
					let coverSrc = novel.coverURL ?? novel.thumbnailURL ?? "";
					if (novel.localCoverPath) coverSrc = getUnCachedFileSrc(novel.localCoverPath);
					const remainingChapters = (novel.totalChapters || 0) - novel.downloadedChapters;

					return <CardUI
						key={novel.id}
						href={`/novel?fromRoute=${location.pathname}`}
						imageURL={coverSrc}
						title={novel.title}
						subTitle={SOURCES[novel.source].name}
						onClick={() => setActiveNovel(novel)}
						badges={[
							NovelUpdatingBadge({ isUpdating: novel.isUpdating }),
							RemainingChaptersBadge({ remainingChapters }),
						]}
					/>
				})}
			</CardGridUI>

			<AlertDialog open={isCFAlertOpen} onOpenChange={setIsCFAlertOpen}>
				{/* <AlertDialogTrigger>Open</AlertDialogTrigger> */}
				<AlertDialogContent>
					<AlertDialogHeader className="relative">
						<AlertDialogTitle>Cloudflare Resolver is offline</AlertDialogTitle>
						<AlertDialogDescription>
							Some of the novels in your library require a Cloudflare resolver to fetch metadata. Please start the Cloudflare resolver to continue.
						</AlertDialogDescription>
						<Button size="icon" variant="secondary" className="absolute -top-2 -right-2 p-0 w-6 h-6" onClick={() => setIsCFAlertOpen(false)}><XIcon /></Button>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex !justify-between">
						<CloudflareResolverStatus />
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	);
}
