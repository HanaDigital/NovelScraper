import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Fragment, useEffect, useState } from 'react';
import { load, Store } from '@tauri-apps/plugin-store';
import { useAtom, useSetAtom } from 'jotai/react';
import { appStateAtom, AppStateT, downloadStatusAtom, libraryStateAtom, LibraryStateT } from '@/lib/store';
import Loader from '@/components/loader';
import * as path from '@tauri-apps/api/path';
import { createLibraryDir, saveNovelChapters } from '@/lib/library/library';
import { listen } from "@tauri-apps/api/event";
import { DownloadDataT } from "@/lib/sources/types";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent() {
	const [appInitialized, setAppInitialized] = useState(false);
	const [appStore, setAppStore] = useState<Store>();
	const [appState, setAppState] = useAtom(appStateAtom);
	const [libraryState, setLibraryState] = useAtom(libraryStateAtom);
	const [downloadStatus, setDownloadStatus] = useAtom(downloadStatusAtom);

	const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ [key: string]: "save" }>({});

	useEffect(() => {
		loadStore();

		const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
			try {
				const isClosed = await invoke<boolean>("stop_cloudflare_resolver");
			} catch (err) {
				console.error(err);
				event.preventDefault();
			}
		});

		return () => {
			unlisten.then(off => off());
		}
	}, []);

	useEffect(() => {
		if (!appInitialized || !appStore) return;
		appStore.set(appState.key, appState);
	}, [appInitialized, appStore, appState]);

	useEffect(() => {
		if (!appInitialized || !appStore) return;
		appStore.set(libraryState.key, libraryState);

		const downloadStatusListenerP = listen<DownloadDataT>("download-status", (event) => {
			const data = event.payload;

			setDownloadStatus((state) => {
				state[data.novel_id].status = data.status;

				if (data.status === "Downloading") {
					state[data.novel_id].status = data.status;
					state[data.novel_id].downloaded_chapters_count = data.downloaded_chapters_count;
					state[data.novel_id].downloaded_chapters = [
						...(state[data.novel_id].downloaded_chapters ?? []),
						...(data.downloaded_chapters ?? [])
					];
				} else {
					setPendingStatusUpdate(updates => ({ ...updates, [data.novel_id]: "save" }));
				}
			});
		});

		return () => {
			downloadStatusListenerP.then((unsub) => unsub());
		}
	}, [appInitialized, appStore, libraryState]);

	useEffect(() => {
		if (!appInitialized || !appStore) return;
		Object.keys(pendingStatusUpdate).forEach((novel_id) => {
			const status = pendingStatusUpdate[novel_id];
			if (status === "save") {
				const data = downloadStatus[novel_id];
				if (!data || data.status === "Downloading") return;
				saveNovelChapters(libraryState.novels[novel_id], data.downloaded_chapters ?? []).then(() => {
					setPendingStatusUpdate((updates) => {
						delete updates[novel_id];
						return updates;
					});
				});
			}
		});
	}, [downloadStatus, pendingStatusUpdate]);

	const loadStore = async () => {
		const store = await load('store.json');
		setAppStore(store);

		try {
			let app = await store.get(appState.key) as AppStateT | undefined;
			if (!app) app = appState;

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
