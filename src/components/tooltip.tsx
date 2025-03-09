import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


type TooltipUIProps = {
	children: ReactNode;
	content: ReactNode;
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	className?: string;
}
export function TooltipUI({ children, content, side, sideOffset, className = "" }: TooltipUIProps) {
	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger>{children}</TooltipTrigger>
				<TooltipContent
					className={`bg-background border shadow-lg text-gray-500 font-medium ${className}`}
					side={side} sideOffset={sideOffset}
				>{content}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
