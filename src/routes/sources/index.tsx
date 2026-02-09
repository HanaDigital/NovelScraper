import { createFileRoute, Link } from '@tanstack/react-router'
import { SOURCES } from '@/lib/sources/sources'
import Page from '@/components/page'
import { CardGridUI, CardUI } from "@/components/card"
import { openUrl } from "@tauri-apps/plugin-opener"
import { message } from "@tauri-apps/plugin-dialog"
import { ExternalLink } from "@mynaui/icons-react"
import { TooltipUI } from "@/components/tooltip"

export const Route = createFileRoute('/sources/')({
	component: RouteComponent,
})

function RouteComponent() {
	const handleOpenInBrowser = async (url: string) => {
		if (!url) return;
		try {
			await openUrl(url);
		} catch (e) {
			console.error(e);
			await message(`Couldn't open ${url} in browser`, { title: "Error", kind: 'error' });
		}
	}

	return (
		<Page>
			<CardGridUI>
				{Object.values(SOURCES).map((s) => (
					<CardUI
						key={s.id}
						href={`/sources/${s.id}`}
						imageURL={s.logo}
						title={s.name}
						subTitle={s.tags.join(', ')}
						badges={[
							<TooltipUI content="Open in Browser" side="bottom" sideOffset={8}>
								<button className="text-xs p-1 bg-gray-800 rounded-lg" onClick={() =>
									handleOpenInBrowser(s.url)
								}><ExternalLink className="size-4" /></button>
							</TooltipUI>
						]}
					/>
				))}
			</CardGridUI>
		</Page>
	)
}
