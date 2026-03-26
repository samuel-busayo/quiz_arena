import React, { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type TvCardProps = {
    hoverable?: boolean
    animated?: boolean
    selected?: boolean
    children: ReactNode
    className?: string
    onClick?: () => void
    disabled?: boolean
}

export function TvCard({
    hoverable = false,
    animated = false,
    selected = false,
    disabled = false,
    children,
    className,
    onClick
}: TvCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-tv-panel rounded-lg border border-tv-border transition-all duration-300",
                hoverable && !disabled && "hover:border-tv-accent/50 hover:shadow-panel hover:-translate-y-1 cursor-pointer",
                selected && "border-tv-accent shadow-glow bg-tv-accentSoft",
                disabled && "opacity-40 grayscale pointer-events-none border-white/5",
                animated && "animate-rise",
                className
            )}
        >
            {children}
        </div>
    )
}
