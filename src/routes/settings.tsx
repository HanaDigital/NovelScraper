import { createFileRoute } from '@tanstack/react-router'
import { P, SmallP, TinyP } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { open } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useAtom } from 'jotai/react';
import { appStateAtom } from '@/lib/store';
import * as path from '@tauri-apps/api/path';
import Page from '@/components/page';
import { createLibraryDir } from '@/lib/library/library';
import { InfoCircle, Minus, Plus } from '@mynaui/icons-react';
import { TooltipUI } from "@/components/tooltip";

export const Route = createFileRoute('/settings')({
	component: RouteComponent,
})

function RouteComponent() {
	const [appState, setAppState] = useAtom(appStateAtom);

	const handleSavePath = async () => {
		const libraryParentPath = await path.resolve(appState.libraryRootPath, "..");
		const dir = await open({
			multiple: false,
			directory: true,
			recursive: true,
			defaultPath: libraryParentPath,
			title: "Select a directory",
		});
		if (!dir) return;
		const newLibraryRootPath = await path.join(dir, "NovelScraper-Library");
		await createLibraryDir(newLibraryRootPath);
		setAppState((state) => {
			state.libraryRootPath = newLibraryRootPath;
			return state;
		});
	}

	const handleIncreaseBatchSize = async () => {
		if (appState.downloadBatchSize >= 5) return;
		setAppState((state) => {
			state.downloadBatchSize += 1;
			return state;
		});
	}

	const handleDecreaseBatchSize = async () => {
		if (appState.downloadBatchSize <= 1) return;
		setAppState((state) => {
			state.downloadBatchSize -= 1;
			return state;
		});
	}

	const handleIncreaseBatchDelay = async () => {
		if (appState.downloadBatchDelay >= 10) return;
		setAppState((state) => {
			state.downloadBatchDelay += 1;
			return state;
		});
	}

	const handleDecreaseBatchDelay = async () => {
		if (appState.downloadBatchDelay <= 0) return;
		setAppState((state) => {
			state.downloadBatchDelay -= 1;
			return state;
		});
	}

	const handleWriteFile = async () => {
		const contents = JSON.stringify({ notifications: true });
		const filePath = await path.join(appState.libraryRootPath, "config.json");
		await writeTextFile(filePath, contents);
	}

	return (
		<Page className="gap-8">
			<div className="flex flex-col gap-2">
				<TinyP className="">Library Root Path</TinyP>
				<div className="flex items-center bg-card border rounded pl-2">
					<P className='flex-1'>{appState.libraryRootPath}</P>
					<Button onClick={handleSavePath}>Change Path</Button>
				</div>
				<TinyP className="text-muted-foreground flex gap-1 items-center">
					<InfoCircle className="w-4 h-4" />
					The <b><i>NovelScraper-Library</i></b> folder will be created in the selected path.
				</TinyP>
			</div>

			<div className="relative border p-4 pt-5 rounded-lg flex flex-col gap-4">
				<SmallP className="absolute -top-2 left-2 bg-background px-2">Downloads</SmallP>

				<CounterUI
					title="Batch Size"
					count={appState.downloadBatchSize}
					onIncrease={handleIncreaseBatchSize}
					onDecrease={handleDecreaseBatchSize}
					info="The number of chapters to download in a single batch. Makes downloading faster but may result in a ban."
					minCount={1}
					maxCount={5}
				/>
				<CounterUI
					title="Batch Delay"
					count={appState.downloadBatchDelay}
					onIncrease={handleIncreaseBatchDelay}
					onDecrease={handleDecreaseBatchDelay}
					info="A delay in seconds between each batch. Makes downloading slower but may help against getting a ban."
					minCount={0}
					maxCount={10}
				/>
			</div>
		</Page>
	);
}

type CounterUIProps = {
	title: string;
	count: number;
	onIncrease: () => void;
	onDecrease: () => void;
	info?: string;
	maxCount?: number;
	minCount?: number;
}
function CounterUI({ title, count, onIncrease, onDecrease, info, maxCount, minCount }: CounterUIProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-1 items-center">
				<TinyP>{title}</TinyP>
				{info &&
					<TooltipUI
						className="max-w-72"
						side="right"
						content={info}
					>
						<InfoCircle className="w-3 h-3 text-gray-400" />
					</TooltipUI>
				}
			</div>
			<div className="flex items-stretch">
				<P className='bg-card border rounded px-4 flex-1 flex items-center'>{count}</P>
				<div className="flex flex-col bg-primary rounded-r-lg overflow-hidden">
					<button
						className="flex-1 text-black grid place-items-center px-3 border-b disabled:bg-green-900"
						disabled={(!!maxCount || maxCount === 0) && count >= maxCount}
						onClick={onIncrease}
					>
						<Plus className="w-3" />
					</button>
					<button
						className="flex-1 text-black grid place-items-center px-3 disabled:bg-green-900"
						disabled={(!!minCount || minCount === 0) && count <= minCount}
						onClick={onDecrease}
					>
						<Minus className="w-3" />
					</button>
				</div>
			</div>
		</div>
	);
}
