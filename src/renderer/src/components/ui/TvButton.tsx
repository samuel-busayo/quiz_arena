import React, { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type TvButtonProps = {
    variant?: "primary" | "secondary" | "danger" | "ghost"
    size?: "sm" | "md" | "lg" | "xl"
    glow?: boolean
    iconLeft?: ReactNode
    iconRight?: ReactNode
    disabled?: boolean
    onClick?: () => void
    children?: ReactNode
    className?: string
    type?: "button" | "submit" | "reset"
}

export function TvButton({
    variant = "primary",
    size = "md",
    glow = false,
    iconLeft,
    iconRight,
    disabled = false,
    onClick,
    children,
    className,
    type = "button"
}: TvButtonProps) {
    const variants = {
        primary: "bg-tv-panel border-tv-border text-tv-accent hover:border-tv-accent hover:shadow-glow",
        secondary: "bg-tv-elevated border-tv-border text-tv-textPrimary hover:border-tv-textMuted",
        danger: "bg-tv-panel border-tv-danger/30 text-tv-danger hover:border-tv-danger hover:bg-tv-danger/10",
        ghost: "bg-transparent border-transparent text-tv-textMuted hover:text-tv-accent hover:bg-tv-accentSoft",
    }

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base font-display tracking-wide",
        xl: "px-10 py-5 text-xl font-display tracking-wider",
    }

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md border transition-all duration-200 outline-none focus:ring-1 focus:ring-tv-accent/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                glow && "animate-pulseAccent",
                className
            )}
        >
            {iconLeft && <span className="shrink-0">{iconLeft}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
        </button>
    )
}
