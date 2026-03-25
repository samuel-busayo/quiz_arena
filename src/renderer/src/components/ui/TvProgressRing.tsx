import React from 'react'

type TvProgressRingProps = {
    duration: number
    remaining: number
    dangerZone?: number
    size?: number
    strokeWidth?: number
}

export function TvProgressRing({
    duration,
    remaining,
    dangerZone = 5,
    size = 120,
    strokeWidth = 8
}: TvProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const progress = Math.max(0, Math.min(1, remaining / duration))
    const offset = circumference - progress * circumference

    const isDanger = remaining <= dangerZone

    return (
        <div className="relative flex items-center justify-center animate-rise" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90 transition-all duration-1000 ease-linear"
            >
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-tv-panel"
                />
                {/* Progress Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-linear ${isDanger ? 'text-tv-danger animate-pulse' : 'text-tv-accent'}`}
                />
            </svg>
            <div className={`absolute font-timer text-glow transition-colors duration-500 ${isDanger ? 'text-tv-danger' : 'text-tv-accent'}`} style={{ fontSize: size * 0.35 }}>
                {Math.ceil(remaining)}
            </div>
        </div>
    )
}
