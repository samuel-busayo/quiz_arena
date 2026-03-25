import React, { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type TvPanelProps = {
    elevation?: "base" | "raised" | "floating"
    padding?: "none" | "sm" | "md" | "lg"
    children: ReactNode
    className?: string
}

export function TvPanel({
    elevation = "base",
    padding = "md",
    children,
    className
}: TvPanelProps) {
    const elevations = {
        base: "bg-tv-bg",
        raised: "bg-tv-panel shadow-lg border border-tv-border",
        floating: "bg-tv-elevated shadow-panel border border-tv-border backdrop-blur-md",
    }

    const paddings = {
        none: "",
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
    }

    return (
        <div className={cn(
            elevations[elevation],
            paddings[padding],
            "rounded-md transition-all duration-300",
            className
        )}>
            {children}
        </div>
    )
}
