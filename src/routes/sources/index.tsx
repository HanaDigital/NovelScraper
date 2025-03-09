import { createFileRoute, Link } from '@tanstack/react-router'
import { SOURCES } from '@/lib/sources/sources'
import Page from '@/components/page'
import { CardGridUI, CardUI } from "@/components/card"

export const Route = createFileRoute('/sources/')({
	component: RouteComponent,
})

function RouteComponent() {
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
					/>
				))}
			</CardGridUI>
		</Page>
	)
}
