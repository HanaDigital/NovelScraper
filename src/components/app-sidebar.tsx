import {
	Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar"
import { ChevronDoubleRight, CircleNotch, DownloadSolid, FileTextSolid, SquareSolid } from "@mynaui/icons-react";
import { LargeP, P, SmallP, TinyP } from "./typography";
import { Button } from "./ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { app } from "@tauri-apps/api";
import { useAtom, useSetAtom } from "jotai/react";
import { appStateAtom } from "@/lib/store";
import { routes } from "@/lib/routes";
import { invoke } from "@tauri-apps/api/core";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";
import { fetchGithubRelease } from "@/lib/utils";
import DialogUI from "./dialog";
import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";

const analytics = getFirebaseAnalytics();

export function AppSidebar() {
	const { resolvedLocation } = useRouterState();
	const [appState, setAppState] = useAtom(appStateAtom);

	const { toggleSidebar, open } = useSidebar();
	const [version, setVersion] = useState("");
	const [releaseNotes, setReleaseNotes] = useState("");
	const [newVersion, setNewVersion] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [viewedNotes, setViewedNotes] = useState(true);

	useEffect(() => {
		app.getVersion().then(v => setVersion(v));
		handleCheckForUpdates();
	}, []);

	useEffect(() => {
		if (!version) return;
		logEvent(analytics, "started_app", { version });
		getReleaseNotes(version);
	}, [version]);

	useEffect(() => {
		setAppState((state) => {
			state.isSidePanelOpen = open;
			return state;
		});
	}, [open]);

	const handleCheckForUpdates = async () => {
		try {
			const newVersion = await invoke<string>("check_for_update");
			if (newVersion) {
				setNewVersion(newVersion);
				logEvent(analytics, "version_update_request", { version: newVersion });
			}
		} catch (e) {
			console.error(e);
		}
	}

	const handleInstallUpdate = async () => {
		setIsUpdating(true);
		try {
			await invoke("install_update");
		} catch (e) {
			console.error(e);
		}
		setIsUpdating(false);
	}

	const getReleaseNotes = async (tag: string) => {
		const release = await fetchGithubRelease(`v${tag}`);
		if (release) {
			const body = release.body as string;
			const notes = body.replace(/^(.|\n|\r)*### Release Notes\r\n/g, "");
			setReleaseNotes(notes);
		}
	}

	const handleSetReleaseNotesAsViewed = (isOpen: boolean) => {
		if (appState.viewedNotesForVersion === version) return;
		setAppState(state => {
			state.viewedNotesForVersion = version;
		});
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className="flex gap-2 justify-center items-center">
						<SidebarMenuButton size="lg" className="!bg-card !cursor-default">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<SquareSolid className="size-7" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<LargeP className="truncate">NovelScraper</LargeP>
								<TinyP className="truncate">v{version}</TinyP>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{routes.map((item) => (
								<SidebarMenuItem key={item.url}>
									<SidebarMenuButton asChild isActive={resolvedLocation.pathname === "/"
										? item.url === "/"
										: resolvedLocation.pathname.includes(item.url) && item.url !== "/"
									}>
										<Link href={item.url}>
											<item.icon width={24} height={24} />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="flex flex-col items-end gap-4">
				<SidebarMenu className="flex flex-col gap-2">
					{(version && releaseNotes) &&
						<SidebarMenuItem className="flex gap-2 justify-center items-center shadow-lg">
							<DialogUI
								title={`Release Notes (v${version})`}
								trigger={
									<SidebarMenuButton size="lg" className="!bg-card border">
										<FileTextSolid className={`transition-all ml-[0.41rem] ${open && "!size-7 ml-0"}`} />
										<div className="flex-1 text-sm leading-tight flex-col gap-1">
											<P className="truncate">Release Notes</P>
											<TinyP className="truncate">v{version}</TinyP>
										</div>
									</SidebarMenuButton>
								}
								defaultOpen={appState.viewedNotesForVersion !== version}
								onOpenChange={handleSetReleaseNotesAsViewed}
							>
								<div id="markdown">
									<Markdown remarkPlugins={[remarkGfm]}>{releaseNotes}</Markdown>
								</div>
							</DialogUI>
						</SidebarMenuItem>
					}
					{newVersion &&
						<SidebarMenuItem className="flex gap-2 justify-center items-center shadow-lg shadow-green-600 animate-pulse">
							<SidebarMenuButton size="lg" className="!bg-card border border-green-900" onClick={handleInstallUpdate} disabled={isUpdating}>
								{isUpdating
									? <CircleNotch className={`transition-all animate-spin ml-[0.4rem] ${open && "!size-7 ml-0"}`} />
									: <DownloadSolid className={`transition-all ml-[0.41rem] ${open && "!size-7 ml-0"}`} />
								}
								<div className="flex-1 text-sm leading-tight flex-col gap-1">
									<P className="truncate">New Update</P>
									<TinyP className="truncate">v{newVersion}</TinyP>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					}
				</SidebarMenu>
				<Button className="size-8" variant="outline" size="icon" onClick={toggleSidebar}>
					<ChevronDoubleRight className={`transition-transform ${open ? "rotate-180" : ""}`} />
				</Button>
			</SidebarFooter>
		</Sidebar>
	)
}
