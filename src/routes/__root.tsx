import { Outlet, createRootRoute } from '@tanstack/react-router'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Fragment, useEffect, useState } from 'react';
import { load, Store } from '@tauri-apps/plugin-store';
import { useAtom, useSetAtom } from 'jotai/react';
import { appStateAtom, AppStateT, downloadStatusAtom, libraryStateAtom, LibraryStateT, sourceDownloadOptions } from '@/lib/store';
import Loader from '@/components/loader';
import * as path from '@tauri-apps/api/path';
import { createLibraryDir, saveNovelChapters } from '@/lib/library/library';
import { listen } from "@tauri-apps/api/event";
import { DownloadDataT } from "@/lib/sources/types";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { AppStateV1T } from "@/lib/deprecated";

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent() {
	const [appInitialized, setAppInitialized] = useState(false);
	const [appStore, setAppStore] = useState<Store>();
	const [appState, setAppState] = useAtom(appStateAtom);
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const setDownloadStatus = useSetAtom(downloadStatusAtom);

	useEffect(() => {
		loadStore();

		const closeRequestListenerP = getCurrentWindow().onCloseRequested(async (event) => {
			try {
				const isClosed = await invoke<boolean>("stop_cloudflare_resolver");
			} catch (err) {
				console.error(err);
			}
		});

		const downloadStatusListenerP = listen<DownloadDataT>("download-status", (event) => {
			const data = event.payload;

			setDownloadStatus((state) => {
				state[data.novel_id].status = data.status;
				const novelStore = state[data.novel_id].novelStore;

				if (data.status !== "Error") {
					state[data.novel_id].downloaded_chapters_count = data.downloaded_chapters_count;
					const downloadedChapters = [
						...(state[data.novel_id].downloaded_chapters ?? []),
						...(data.downloaded_chapters ?? [])
					];
					state[data.novel_id].downloaded_chapters = downloadedChapters;


					const novel = libraryState.novels[data.novel_id];
					saveNovelChapters(novelStore as Store, novel, downloadedChapters).then(() => {
						if (data.status !== "Downloading") {
							novelStore.close();
						}
					});
				} else {
					novelStore.close();
				}
			});
		});

		return () => {
			closeRequestListenerP.then(unsub => unsub());
			downloadStatusListenerP.then((unsub) => unsub());
		}
	}, []);

	useEffect(() => {
		if (!appInitialized || !appStore) return;
		appStore.set(appState.key, appState);
	}, [appInitialized, appStore, appState]);

	useEffect(() => {
		if (!appInitialized || !appStore) return;
		appStore.set(libraryState.key, libraryState);
	}, [appInitialized, appStore, libraryState]);

	const loadStore = async () => {
		const store = await load('store.json');
		setAppStore(store);

		try {
			let app = await store.get(appState.key) as AppStateT | undefined;
			if (!app) app = appState;

			if (app.version === 1) {
				delete (app as AppStateV1T).downloadBatchSize;
				delete (app as AppStateV1T).downloadBatchDelay;
				app.sourceDownloadOptions = sourceDownloadOptions;
				app.version = 2;
			}

			if (!app.libraryRootPath) app.libraryRootPath = await path.join(await path.documentDir(), "NovelScraper-Library");

			setAppState(app);

			await createLibraryDir(app.libraryRootPath);
		} catch (e) {
			console.error(e);
		}

		try {
			let library = await store.get(libraryState.key) as LibraryStateT | undefined;
			if (!library) library = libraryState;
			setLibraryState(library);
		} catch (e) {
			console.error(e);
		}

		setAppInitialized(true);
	}

	if (!appInitialized) return <Loader />;
	return (
		<Fragment>
			<SidebarProvider defaultOpen={appState.isSidePanelOpen}>
				<AppSidebar />
				<Outlet />
			</SidebarProvider>
			{/* <TanStackRouterDevtools position='bottom-right' /> */}
		</Fragment>
	)
}
