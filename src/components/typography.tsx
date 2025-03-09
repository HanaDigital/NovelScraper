
type TypographyProps = {
    children: React.ReactNode
    className?: string
}

export function H1({ children, className }: TypographyProps) {
    return (
        <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`}>
            {children}
        </h1>
    )
}

export function H2({ children, className }: TypographyProps) {
    return (
        <h2 className={`scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight ${className}`}>
            {children}
        </h2>
    )
}

export function H3({ children, className }: TypographyProps) {
    return (
        <h3 className={`scroll-m-20 text-2xl font-semibold tracking-tight ${className}`}>
            {children}
        </h3>
    )
}

export function H4({ children, className }: TypographyProps) {
    return (
        <h4 className={`scroll-m-20 text-xl font-semibold tracking-tight ${className}`}>
            {children}
        </h4>
    )
}

export function P({ children, className }: TypographyProps) {
    return (
        <p className={`${className}`}>
            {children}
        </p>
    )
}

export function BlockQuote({ children, className }: TypographyProps) {
    return (
        <blockquote className={`mt-6 border-l-2 pl-6 italic ${className}`}>
            {children}
        </blockquote>
    )
}

export function InlineCode({ children, className }: TypographyProps) {
    return (
        <code className={`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${className}`}>
            {children}
        </code>
    )
}

export function LeadP({ children, className }: TypographyProps) {
    return (
        <p className={`text-xl text-muted-foreground ${className}`}>
            {children}
        </p>
    )
}

export function LargeP({ children, className }: TypographyProps) {
    return (
        <div className={`text-lg font-semibold ${className}`}>
            {children}
        </div>
    )
}

export function SmallP({ children, className }: TypographyProps) {
    return (
        <small className={`text-sm font-medium leading-none ${className}`}>
            {children}
        </small>
    )
}

export function TinyP({ children, className }: TypographyProps) {
    return (
        <small className={`text-xs font-medium leading-none ${className}`}>
            {children}
        </small>
    )
}

export function MutedP({ children, className }: TypographyProps) {
    return (
        <p className={`text-sm text-muted-foreground ${className}`}>
            {children}
        </p>
    )
}