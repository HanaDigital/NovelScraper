import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { H4 } from "./typography";
import { routes } from "@/lib/routes";
import { SourceIDsT, SOURCES } from "@/lib/sources/sources";
import { Button } from "./ui/button";
import { ChevronLeft } from "@mynaui/icons-react";
import { useAtomValue } from "jotai/react";
import { activeNovelAtom } from "@/lib/store";

export default function Breadcrumbs() {
	const location = useLocation();
	const { history } = useRouter();
	const activeNovel = useAtomValue(activeNovelAtom);

	const routeURLs = routes.map((r) => r.url);

	if (location.pathname === "/novel")
		return <div className="flex items-center gap-2">
			<Button variant="ghost" size="icon" onClick={() => history.go(-1)}><ChevronLeft /></Button>
			<H4 className="text-ellipsis text-nowrap overflow-hidden flex-1">{activeNovel?.title}</H4>
		</div>

	if (routeURLs.includes(location.pathname))
		return <H4>{routes.find((r) => r.url === location.pathname)!.title}</H4>;

	const locationSplit = location.pathname.split("/");
	locationSplit.shift();
	if (locationSplit.length === 2) {
		if (locationSplit[0] === "sources") {
			const source = SOURCES[locationSplit[1] as SourceIDsT];
			if (!source) throw new Error("Source not found");
			return (
				<div className="flex items-center gap-2">
					<Link href="/sources">
						<H4 className="text-muted-foreground hover:underline">Sources</H4>
					</Link>
					<H4 className="text-muted-foreground">/</H4>
					<H4>{source.name}</H4>
				</div>
			);
		} else if (locationSplit[0] === "library") {
			return (
				<div className="flex items-center gap-2">
					<Link href="/library">
						<H4 className="text-muted-foreground hover:underline">Library</H4>
					</Link>
					<H4 className="text-muted-foreground">/</H4>
					<H4>{locationSplit[1]}</H4>
				</div>
			);
		}
	}
	return <H4 className="bg-red-500">UNHANDLED BREADCRUMB ROUTE</H4>
}
