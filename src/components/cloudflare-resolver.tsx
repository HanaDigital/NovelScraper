import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { CheckSolid, CircleNotch, XSolid } from "@mynaui/icons-react";

export function CloudflareResolverStatus() {
	const [isLoadingDocker, setIsLoadingDocker] = useState(true);
	const [isDockerActive, setIsDockerActive] = useState(false);

	const [isLoadingCloudflareResolver, setIsLoadingCloudflareResolver] = useState(true);
	const [isCloudflareResolverActive, setIsCloudflareResolverActive] = useState(false);

	useEffect(() => {
		initCloudflareResolver();
	}, []);

	const initCloudflareResolver = async () => {
		try {
			await handleCheckDockerStatus();
			await handleStartCloudflareResolver();
		} catch {
			console.error("Failed to start Cloudflare Resolver");
		}
	}

	const handleCheckDockerStatus = async () => {
		setIsLoadingDocker(true);
		try {
			const res = await invoke<boolean>("check_docker_status");
			setIsDockerActive(res);
		} catch (e) {
			console.error(e);
			setIsDockerActive(false);
		}
		setIsLoadingDocker(false);
	}

	const handleStartCloudflareResolver = async () => {
		setIsLoadingCloudflareResolver(true);
		try {
			const res = await invoke<boolean>("start_cloudflare_resolver", {
				port: 3148,
			});
			setIsCloudflareResolverActive(res);
		} catch (e) {
			console.error(e);
			setIsCloudflareResolverActive(false);
			handleCheckDockerStatus();
		}
		setIsLoadingCloudflareResolver(false);
	}

	return (
		<div className="flex gap-2 items-start">
			<StatusBadge
				isLoading={isLoadingDocker}
				isActive={isDockerActive}
				isDisabled={isLoadingDocker || isLoadingCloudflareResolver}
				onCheckStatus={handleCheckDockerStatus}
				text="Docker"
			/>
			<StatusBadge
				isLoading={isLoadingCloudflareResolver}
				isActive={isDockerActive && isCloudflareResolverActive}
				isDisabled={isLoadingDocker || isLoadingCloudflareResolver}
				onCheckStatus={handleStartCloudflareResolver}
				text="CloudFlare Resolver"
			/>
		</div>
	)
}

type StatusBadgeProps = {
	isLoading: boolean;
	isActive: boolean;
	isDisabled: boolean;
	onCheckStatus: () => void;
	text: string;
}
const StatusBadge = ({ isLoading, isActive, isDisabled, onCheckStatus, text }: StatusBadgeProps) => {
	return (
		<button onClick={onCheckStatus} disabled={isLoading || isDisabled}>
			<Badge
				className={`font-bold ${(isLoading || isDisabled)
					? "bg-gray-300 text-gray-900 hover:bg-gray-300"
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

export type CloudflareHeadersT = {
	"upgrade-insecure-requests": string;
	"user-agent": string;
	"sec-ch-ua": string;
	"sec-ch-ua-mobile": string;
	"sec-ch-ua-platform": string;
	"accept-language": string;
	cookie: string;
}
export async function getCloudflareHeaders(url: string) {
	const session = await fetch('http://localhost:3148/cf-clearance-scraper', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			url,
			mode: "waf-session",
		})
	}).then(res => res.json()).catch(err => { console.error(err); return null });

	if (!session || session.code != 200) {
		console.error(session);
		return null;
	}

	return {
		...session.headers,
		cookie: session.cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ')
	} as CloudflareHeadersT;
}
