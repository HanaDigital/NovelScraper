import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

type DialogUIProps = {
    children: ReactNode;
    trigger: ReactNode;
    title: string;
    description?: string;
    footer?: ReactNode;
    className?: string;
    defaultOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}
export default function DialogUI({ children, trigger, title, description, footer, className = "", defaultOpen = false, onOpenChange }: DialogUIProps) {

    return (
        <Dialog defaultOpen={defaultOpen} onOpenChange={(isOpen) => onOpenChange && onOpenChange(isOpen)}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[425px] ${className}`}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>
                        {description}
                    </DialogDescription>}
                </DialogHeader>
                {children}
                {footer && <DialogFooter>
                    {footer}
                </DialogFooter>}
            </DialogContent>
        </Dialog>
    )
}