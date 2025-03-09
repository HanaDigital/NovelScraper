import NovelFullLogo from '@/assets/store/novelfull-logo.jpg';
import NovelBinLogo from '@/assets/store/novelbin-logo.jpg';
import { NovelFull } from './novelfull';
import { NovelBin } from "./novelbin";

export const SOURCES = {
	"novelbin": new NovelBin({
		id: 'novelbin',
		name: 'NovelBin',
		tags: ['Recommended'],
		logo: NovelBinLogo,
		url: 'https://novelbin.com',
		cloudflareProtected: false,
	}),
	"novelfull": new NovelFull({
		id: 'novelfull',
		name: 'NovelFull',
		tags: ['Chinese'],
		logo: NovelFullLogo,
		url: 'https://novelfull.com',
		cloudflareProtected: false,
	}),
} as const;
export type SourceIDsT = keyof typeof SOURCES;
