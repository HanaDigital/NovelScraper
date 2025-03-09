import { ReactNode } from 'react';
import Breadcrumbs from "./breadcrumbs";

type PageProps = {
	children?: ReactNode;
	className?: string;
	titleBarContent?: ReactNode;
}
export default function Page({ children, className, titleBarContent }: PageProps) {
	return (
		<main className="w-full h-screen flex flex-col gap-2 overflow-hidden">
			<div className="px-4 pr-6 pt-3 flex justify-between items-center">
				<Breadcrumbs />
				{titleBarContent ? titleBarContent : null}
			</div>
			<div className={`px-4 pt-2 pb-6 overflow-auto flex flex-col gap-5 ${className}`}>
				{children}
			</div>
		</main>
	)
}
