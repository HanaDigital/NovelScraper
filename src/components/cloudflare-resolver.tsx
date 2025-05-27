import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { CheckSolid, CircleNotch, ExternalLink, InfoCircle, PlaySolid, StopSolid, XSolid } from "@mynaui/icons-react";
import { useAtom } from "jotai/react";
import { appStateAtom, dockerAtom } from "@/lib/store";
import { Button } from "./ui/button";
import { TooltipUI } from "./tooltip";
import DialogUI from "./dialog";
import { SmallP } from "./typography";
import { openUrl } from "@tauri-apps/plugin-opener";
import { DialogClose } from "@radix-ui/react-dialog";

export function CloudflareResolverStatus() {
	const [appState, setAppState] = useAtom(appStateAtom);
	const [docker, setDocker] = useAtom(dockerAtom);

	const [isDockerInitializing, setIsDockerInitializing] = useState(false);
	const [isLoadingDocker, setIsLoadingDocker] = useState(false);
	const [isLoadingCloudflareResolver, setIsLoadingCloudflareResolver] = useState(false);

	useEffect(() => {
		// setAppState(state => {
		// 	state.cfDockerInitialized = false;
		// });
		// if (appState.cfDockerInitialized) initCloudflareResolver();
	}, []);

	const initCloudflareResolver = async () => {
		setIsDockerInitializing(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		const status = await handleCheckDockerStatus() && await handleStartCloudflareResolver();
		setIsDockerInitializing(false);
		return status;
	}

	const handleCheckDockerStatus = async () => {
		setIsLoadingDocker(true);
		try {
			const res = await invoke<boolean>("check_docker_status");
			setDocker(d => { d.engineStatus = res });
			setIsLoadingDocker(false);
			return res;
		} catch (e) {
			console.error(e);
			setDocker(d => { d.engineStatus = false });
			setIsLoadingDocker(false);
			return false;
		}
	}

	const handleStartCloudflareResolver = async () => {
		setIsLoadingCloudflareResolver(true);
		try {
			const res = await invoke<boolean>("start_cloudflare_resolver", {
				port: 3148,
			});
			setDocker(d => { d.cfResolverStatus = res });
			setIsLoadingCloudflareResolver(false);
			return res;
		} catch (e) {
			console.error(e);
			setDocker(d => { d.cfResolverStatus = false });
			handleCheckDockerStatus();
			setIsLoadingCloudflareResolver(false);
			return false;
		}
	}

	const handleStopCloudflareResolver = async () => {
		setIsLoadingCloudflareResolver(true);
		try {
			const isClosed = await invoke<boolean>("stop_cloudflare_resolver");
			setDocker(d => { d.cfResolverStatus = !isClosed });
		} catch (e) {
			console.error(e);
			await initCloudflareResolver();
		}
		setIsLoadingCloudflareResolver(false);
	}

	const handleOpenDockerURL = async () => {
		try {
			openUrl("https://www.docker.com/")
		} catch (e) {
			console.error(e);
		}
	}

	return (
		<div className="flex gap-2 items-center">
			{(!docker.engineStatus || !docker.cfResolverStatus)
				? <TooltipUI content="Start Docker" side="bottom">
					<Button size="icon" className="flex items-center gap-1" onClick={initCloudflareResolver} disabled={isDockerInitializing}>
						{isDockerInitializing
							? <CircleNotch className="animate-spin" />
							: <PlaySolid />
						}
					</Button>
				</TooltipUI>
				: <DialogUI
					title="Stop Cloudflare Resolver"
					description="Are you sure you want to do this?"
					className="flex flex-col gap-4"
					trigger={
						<Button size="icon" variant="destructive" className="flex items-center gap-1" disabled={isLoadingCloudflareResolver}>
							{isLoadingCloudflareResolver
								? <CircleNotch className="animate-spin" />
								: <StopSolid />
							}
						</Button>
					}
					footer={
						<div className="flex gap-3">
							<DialogClose asChild>
								<Button variant="secondary">Cancel</Button>
							</DialogClose>
							<DialogClose asChild>
								<Button variant="destructive" onClick={handleStopCloudflareResolver}>Stop Service</Button>
							</DialogClose>
						</div>
					}
				>
					<SmallP className="font-normal text-red-500">This may corrupt any novels currently using this service</SmallP>
				</DialogUI>
			}
			<StatusBadge
				isLoading={isLoadingDocker}
				isActive={docker.engineStatus}
				// isDisabled={isLoadingDocker || isLoadingCloudflareResolver || !appState.cfDockerInitialized}
				// onCheckStatus={handleCheckDockerStatus}
				text="Docker"
			/>
			<StatusBadge
				isLoading={isLoadingCloudflareResolver}
				isActive={docker.engineStatus && docker.cfResolverStatus}
				// isDisabled={isLoadingDocker || isLoadingCloudflareResolver || !appState.cfDockerInitialized}
				// onCheckStatus={handleStartCloudflareResolver}
				text="CloudFlare Resolver"
			/>
			<DialogUI
				title="Docker Info"
				trigger={
					<Button variant="outline" size="icon" className="flex gap-1 items-center text-xs">
						<InfoCircle className="size-4 cursor-pointer" />
					</Button>
				}
			>
				<SmallP className="leading-6 font-normal">This source uses Cloudflare to guard against bots. To access this source, you must install Docker to bypass Cloudflare.</SmallP>
				<SmallP className="leading-6 font-normal text-red-500">Be sure to run the Docker app after installing.</SmallP>
				<DialogClose asChild>
					<Button onClick={handleOpenDockerURL}>
						<ExternalLink />
						Download
					</Button>
				</DialogClose>
			</DialogUI>
		</div>
	)
}

type StatusBadgeProps = {
	isLoading: boolean;
	isActive: boolean;
	isDisabled?: boolean;
	onCheckStatus?: () => void;
	text: string;
}
const StatusBadge = ({ isLoading, isActive, isDisabled = false, onCheckStatus, text }: StatusBadgeProps) => {
	return (
		<button
			className={`h-full ${onCheckStatus ? "cursor-pointer" : "cursor-default"}`}
			onClick={() => onCheckStatus && onCheckStatus()}
			disabled={isLoading || isDisabled}
		>
			<Badge
				className={`h-full font-bold ${(isLoading || isDisabled)
					? "bg-gray-500 text-gray-900 hover:bg-gray-500"
					: isActive
						? "bg-green-300 text-green-900 hover:bg-green-400"
						: "bg-red-300 font-bold text-red-900 hover:bg-red-400"
					}`
				}>
				{isLoading
					? <CircleNotch className="w-4 animate-spin" />
					: isActive
						? <CheckSolid className="w-4" />
						: <XSolid className="w-4" />
				}
				{text}
			</Badge>
		</button>
	)
}
