import { Link } from "@tanstack/react-router";
import { SmallP, TinyP } from "./typography";
import { ReactNode } from "react";
import MissingImageBanner from "@/assets/ui/missing-image-banner.jpg";
import { RefreshSolid } from "@mynaui/icons-react";

type CardUIProps = {
	href: string;
	imageURL: string;
	title: string;
	subTitle: string;
	badges?: ReactNode[];
	onClick?: () => void;
}
export function CardUI({ href, imageURL, title, subTitle, badges, onClick = () => { } }: CardUIProps) {
	return (
		<Link
			className={`relative flex flex-col gap-3 group rounded-lg bg-card border p-2 pb-3 hover:border-primary`}
			href={href}
			onClick={onClick}
		>
			<div className="flex gap-2 items-center absolute top-3 right-3 z-20">
				{badges && badges?.map(badge => badge)}
			</div>
			<div className="rounded-lg overflow-hidden w-full aspect-auto flex-1 grid place-items-center bg-background border">
				<object className="group-hover:scale-[1.05] transition-transform w-full" data={imageURL} type="image/jpg">
					<img src={MissingImageBanner} alt={`${title}`} />
				</object>
			</div>
			<div className="flex flex-col gap-1">
				<SmallP className="text-ellipsis text-nowrap overflow-hidden">{title}</SmallP>
				<TinyP className="text-muted-foreground text-ellipsis text-nowrap overflow-hidden pb-1">{subTitle}</TinyP>
			</div>
		</Link>
	)
}

type CardGridUIProps = {
	children: ReactNode;
	className?: string;
}
export function CardGridUI({ children, className = "" }: CardGridUIProps) {
	return (
		<div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 ${className}`}>
			{children}
		</div>
	)
}

export type RemainingChaptersBadgeProps = {
	remainingChapters: number;
}
export function RemainingChaptersBadge({ remainingChapters }: RemainingChaptersBadgeProps) {
	if (remainingChapters <= 0) return null;
	return <span className="text-xs p-1 px-2 bg-blue-800 rounded-lg">{remainingChapters}</span>
}

export type NovelUpdatingBadgeProps = {
	isUpdating: boolean;
}
export function NovelUpdatingBadge({ isUpdating }: NovelUpdatingBadgeProps) {
	if (!isUpdating) return null;
	return <span className="text-xs p-1 px-2 bg-green-800 rounded-lg"><RefreshSolid className="size-4" /></span>
}
