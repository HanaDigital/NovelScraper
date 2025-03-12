import { CardGridUI, CardUI, NovelUpdatingBadge, RemainingChaptersBadge } from "@/components/card";
import Page from '@/components/page';
import SearchBar from "@/components/search-bar";
import { TooltipUI } from "@/components/tooltip";
import { Button } from "@/components/ui/button";
import { fetchMetadataForNovels, getUnCachedFileSrc } from "@/lib/library/library";
import { NovelT } from "@/lib/sources/types";
import { activeNovelAtom, libraryStateAtom } from "@/lib/store";
import { RefreshSolid } from "@mynaui/icons-react";
import { createFileRoute } from '@tanstack/react-router'
import { message } from "@tauri-apps/plugin-dialog";
import { useAtom, useAtomValue, useSetAtom } from "jotai/react";
import { useEffect, useState } from "react";

export const Route = createFileRoute('/library')({
	component: RouteComponent,
})

function RouteComponent() {
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const setActiveNovel = useSetAtom(activeNovelAtom);
	const [filteredNovels, setFilteredNovels] = useState<NovelT[]>(Object.values(libraryState.novels));

	useEffect(() => {
		setFilteredNovels(Object.values(libraryState.novels));
	}, [libraryState.novels]);

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
						subTitle={novel.source}
						onClick={() => setActiveNovel(novel)}
						badges={[
							NovelUpdatingBadge({ isUpdating: novel.isUpdating }),
							RemainingChaptersBadge({ remainingChapters }),
						]}
					/>
				})}
			</CardGridUI>
		</Page>
	);
}
