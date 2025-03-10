import { CardUI, CardGridUI } from "@/components/card"
import { CloudflareResolverStatus } from "@/components/cloudflare-resolver"
import Page from '@/components/page'
import SearchBar from "@/components/search-bar"
import { Badge } from "@/components/ui/badge"
import { getUnCachedFileSrc } from "@/lib/library/library"
import { SourceIDsT, SOURCES } from '@/lib/sources/sources'
import { NovelSource } from "@/lib/sources/template"
import { NovelT } from "@/lib/sources/types"
import { activeNovelAtom, libraryStateAtom, searchHistoryAtom } from "@/lib/store"
import { BookmarkSolid } from "@mynaui/icons-react"
import { createFileRoute, useLocation } from '@tanstack/react-router'
import { message } from "@tauri-apps/plugin-dialog"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/sources/$sourceId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { sourceId } = Route.useParams();
	const location = useLocation();

	const [source, setSource] = useState<NovelSource>();
	const [isSearching, setIsSearching] = useState(false);
	const [noSearchResultsFor, setNoSearchResultsFor] = useState<string>();
	const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom);
	const libraryState = useAtomValue(libraryStateAtom);
	const setActiveNovel = useSetAtom(activeNovelAtom);

	useEffect(() => {
		setSource(SOURCES[sourceId as SourceIDsT]);
	}, [sourceId]);

	const handleSearch = async (query: string) => {
		if (!source || !query || isSearching) return;
		try {
			setIsSearching(true);
			setNoSearchResultsFor(undefined);
			await new Promise((resolve) => setTimeout(resolve, 500));
			let searchedNovels = await source.searchNovels(query);
			if (!searchedNovels.length) setNoSearchResultsFor(query);
			searchedNovels = searchedNovels.map((n: NovelT) => libraryState.novels[n.id] ?? n);
			setSearchHistory((state) => {
				let novels = state[sourceId as SourceIDsT];
				searchedNovels.forEach((n: NovelT) => {
					novels = novels.filter((n2) => n2.id !== n.id)
				});
				novels.unshift(...searchedNovels);
				return {
					...state,
					[sourceId as SourceIDsT]: novels,
				};
			});
		} catch (e) {
			console.error(e);
			await message("Couldn't search for novels!", { title: 'NovelScraper Library', kind: 'error' });
		}
		setIsSearching(false);
	}

	const handleClear = () => {
		setNoSearchResultsFor(undefined);
		setSearchHistory((state) => {
			state[sourceId as SourceIDsT] = [];
		});
	}

	if (!source) return <></>
	return (
		<Page>
			{source.cloudflareProtected && <CloudflareResolverStatus />}
			<SearchBar
				handleSearch={handleSearch}
				handleClear={handleClear}
				disabled={isSearching}
			/>

			<div className={`border p-2 px-3 rounded-md bg-yellow-300 text-yellow-900 font-medium overflow-hidden transition-all ${noSearchResultsFor ? "" : "h-0 !p-0 border-none -mt-5"}`}>
				No results found for <b>{noSearchResultsFor}</b>
			</div>

			<CardGridUI>
				{searchHistory[sourceId as SourceIDsT].map((novel) => {
					let coverSrc = novel.coverURL ?? novel.thumbnailURL ?? "";
					if (novel.isInLibrary && novel.localCoverPath) coverSrc = getUnCachedFileSrc(novel.localCoverPath);

					return <CardUI
						key={novel.id}
						href={`/novel?fromRoute=${location.pathname}`}
						imageURL={coverSrc}
						title={novel.title}
						subTitle={novel.authors.join(', ')}
						badges={[
							novel.isInLibrary ?
								<Badge className="text-green-900 p-0">
									<BookmarkSolid width={20} />
								</Badge>
								: null,
						]}
						onClick={() => setActiveNovel(novel)}
					/>
				})}
			</CardGridUI>
		</Page>
	)
}
