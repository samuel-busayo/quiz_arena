import React, { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type TvTextProps = {
    variant?: "h1" | "h2" | "h3" | "body" | "muted" | "timer" | "label"
    children: ReactNode
    className?: string
    align?: "left" | "center" | "right"
    style?: React.CSSProperties
}

export function TvText({
    variant = "body",
    children,
    className,
    align = "left",
    style
}: TvTextProps) {
    const variants = {
        h1: "font-display text-4xl lg:text-5xl text-tv-accent tracking-[0.2em] uppercase leading-tight",
        h2: "font-display text-2xl lg:text-3xl text-tv-textPrimary tracking-[0.1em] uppercase leading-tight",
        h3: "font-display text-lg lg:text-xl text-tv-textPrimary tracking-wide uppercase leading-tight",
        body: "font-body text-base text-tv-textPrimary leading-relaxed",
        muted: "font-body text-sm text-tv-textMuted tracking-wide leading-snug",
        timer: "font-timer text-5xl lg:text-7xl text-tv-accent animate-timerTick text-glow",
        label: "font-display text-[10px] text-tv-textMuted uppercase tracking-[0.4em]",
    }

    const alignment = {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
    }

    return (
        <div
            style={style}
            className={cn(
                variants[variant],
                alignment[align],
                className
            )}
        >
            {children}
        </div>
    )
}
