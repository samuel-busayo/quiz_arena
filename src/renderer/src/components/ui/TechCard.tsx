import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface TechCardProps extends React.HTMLAttributes<HTMLDivElement> {
    glow?: boolean
    accent?: boolean
}

export function TechCard({ className, glow, accent, children, ...props }: TechCardProps) {
    return (
        <div
            className={cn(
                "bg-primary-surface border border-primary-secondary/10 rounded-lg p-6 overflow-hidden relative",
                glow && "shadow-[0_0_30px_rgba(0,229,255,0.05)]",
                accent && "border-l-4 border-l-primary-accent",
                className
            )}
            {...props}
        >
            {/* Tech corner accents */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary-accent/20 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary-accent/20 rounded-bl-lg" />

            {children}
        </div>
    )
}
