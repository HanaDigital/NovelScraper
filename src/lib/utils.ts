import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const hashString = (str: string, seed = 0) => {
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};

export const fetchGithubRelease = async (tag: string) => {
	try {
		const res = await fetch(`https://api.github.com/repos/hanadigital/novelscraper/releases/tags/${tag}`);
		return (await res.json()) as { [key: string]: any };
	} catch (err) {
		console.error(err);
	}
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