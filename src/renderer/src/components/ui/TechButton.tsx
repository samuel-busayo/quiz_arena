import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface TechButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    font?: 'orbitron' | 'rajdhani' | 'inter'
}

export function TechButton({
    className,
    variant = 'primary',
    size = 'md',
    font = 'rajdhani',
    ...props
}: TechButtonProps) {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-accent disabled:pointer-events-none disabled:opacity-50 active:scale-95"

    const variants = {
        primary: "bg-primary-accent text-primary-bg hover:bg-opacity-90 shadow-[0_0_15px_rgba(0,229,255,0.3)]",
        secondary: "bg-primary-surface text-primary-text hover:bg-opacity-80 border border-primary-secondary/20",
        outline: "border border-primary-accent text-primary-accent hover:bg-primary-accent hover:text-primary-bg",
        ghost: "text-primary-secondary hover:text-primary-text hover:bg-primary-surface/50",
        danger: "bg-team-red text-white hover:bg-opacity-90 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
    }

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-16 px-8 text-xl"
    }

    const fonts = {
        orbitron: "font-orbitron tracking-widest",
        rajdhani: "font-rajdhani tracking-wider font-semibold",
        inter: "font-inter"
    }

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], fonts[font], className)}
            {...props}
        />
    )
}
