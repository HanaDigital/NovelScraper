import NovelFullLogo from '@/assets/store/novelfull-logo.jpg';
import NovelBinLogo from '@/assets/store/novelbin-logo.jpg';
import NovgoLogo from '@/assets/store/novgo-logo.jpg';
import { NovelFull } from './novelfull';
import { NovelBin } from "./novelbin";
import { Novgo } from "./novgo";

export const SOURCES = {
	"novelfull": new NovelFull({
		id: 'novelfull',
		name: 'NovelFull',
		tags: ['Recommended'],
		logo: NovelFullLogo,
		url: 'https://novelfull.com',
		cloudflareProtected: true,
	}),
	"novgo": new Novgo({
		id: 'novgo',
		name: 'Nov Love',
		tags: ['Requires Docker'],
		logo: NovgoLogo,
		url: 'https://novlove.com',
		cloudflareProtected: true,
	}),
	"novelbin": new NovelBin({
		id: 'novelbin',
		name: 'NovelBin',
		tags: ['Slow'],
		logo: NovelBinLogo,
		url: 'https://novelbin.com',
		cloudflareProtected: true,
	}),
} as const;
export type SourceIDsT = keyof typeof SOURCES;
