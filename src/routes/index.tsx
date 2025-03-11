import Page from '@/components/page';
import { H4, P, TinyP } from "@/components/typography";
import { Card, CardHeader } from "@/components/ui/card";
import { RefreshSolid, SmileGhostSolid, StarSolid } from "@mynaui/icons-react";
import { createFileRoute } from '@tanstack/react-router'
import { message } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import DiscordLogo from "@/assets/ui/discord-logo.svg";
import { BugIcon } from "lucide-react";
import { CardGridUI, CardUI, NovelUpdatingBadge, RemainingChaptersBadge } from "@/components/card";
import { useAtom, useSetAtom } from "jotai/react";
import { activeNovelAtom, libraryStateAtom } from "@/lib/store";
import { fetchMetadataForNovels, getUnCachedFileSrc } from "@/lib/library/library";
import { TooltipUI } from "@/components/tooltip";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { NovelT } from "@/lib/sources/types";

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

function RouteComponent() {
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const setActiveNovel = useSetAtom(activeNovelAtom);

	const [novelUpdates, setNovelUpdates] = useState<NovelT[]>([]);

	useEffect(() => {
		setNovelUpdates(Object.values(libraryState.novels)
			.filter((novel) => (novel.totalChapters || 0) > novel.downloadedChapters)
			.sort((a, b) => new Date(b.updatedChaptersAt || "").getTime() - new Date(a.updatedChaptersAt || "").getTime()))
	}, [libraryState.novels])

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
		<Page className="h-full">
			<div className="flex gap-4 max-w-5xl">
				<HomeCard
					icon={<StarSolid className="text-yellow-400" />}
					title="Star on Github"
					description="Support this project"
					url="https://github.com/HanaDigital/NovelScraper"
				/>
				<HomeCard
					icon={<img src={DiscordLogo} alt="Discord Logo" className="w-8" />}
					title="Join Discord"
					description="Get in touch"
					url="https://discord.gg/Wya4Dst"
				/>
				<HomeCard
					icon={<BugIcon className="text-red-500" />}
					title="Report a Bug"
					description="Squash em!"
					url="https://github.com/HanaDigital/NovelScraper/issues"
				/>
			</div>

			<div className="flex items-center justify-between gap-2">
				<H4 className="-mt-1">Recent Updates</H4>
				<hr className="flex-1" />
				<TooltipUI content="Check for updates" side="bottom" sideOffset={8}>
					<Button size="icon" variant="secondary" onClick={handleCheckForUpdates}><RefreshSolid /></Button>
				</TooltipUI>
			</div>

			{!novelUpdates.length &&
				<P className="flex items-center justify-center gap-1 text-gray-500 h-full">You are all caught up! <SmileGhostSolid /></P>
			}
			<CardGridUI>
				{novelUpdates.map((novel) => {
					let coverSrc = novel.coverURL ?? novel.thumbnailURL ?? "";
					if (novel.localCoverPath) coverSrc = getUnCachedFileSrc(novel.localCoverPath);
					const remainingChapters = (novel.totalChapters || 0) - novel.downloadedChapters;

					return <CardUI
						key={novel.id}
						href={`/novel?fromRoute=${location.pathname}`}
						imageURL={coverSrc}
						title={novel.title}
						subTitle={novel.authors.join(', ')}
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

type HomeCardProps = {
	icon: React.ReactNode,
	title: string,
	description: string,
	url: string,
}
const HomeCard = ({ icon, title, description, url }: HomeCardProps) => {
	const handleOpenInBrowser = async () => {
		try {
			await openUrl(url);
		} catch (e) {
			console.error(e);
			await message(`Couldn't open link in browser`, { title: "NovelScraper", kind: 'error' });
		}
	}

	return (
		<Card onClick={handleOpenInBrowser} className="cursor-pointer flex-1">
			<CardHeader className="flex flex-row gap-2 items-center p-5">
				{icon}
				<div className="flex flex-col">
					<P className="-mt-3">{title}</P>
					<TinyP className="text-gray-500">{description}</TinyP>
				</div>
			</CardHeader>
		</Card>
	)
}
