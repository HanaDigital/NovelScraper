import NovelFullLogo from '@/assets/store/novelfull-logo.jpg';
import NovelBinLogo from '@/assets/store/novelbin-logo.jpg';
import NovgoLogo from '@/assets/store/novgo-logo.jpg';
import { NovelFull } from './novelfull';
import { NovelBin } from "./novelbin";
import { Novgo } from "./novgo";

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
	"novgo": new Novgo({
		id: 'novgo',
		name: 'Novgo',
		tags: ['Alternative'],
		logo: NovgoLogo,
		url: 'https://novgo.co',
		cloudflareProtected: true,
	}),
} as const;
export type SourceIDsT = keyof typeof SOURCES;
