import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

type DialogUIProps = {
    children: ReactNode;
    trigger: ReactNode;
    title: string;
    description?: string;
    footer?: ReactNode;
    className?: string;
}
export default function DialogUI({ children, trigger, title, description, footer, className = "" }: DialogUIProps) {

    return (
        <Dialog>
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