import React, { ReactNode } from 'react'

type ProjectionLayoutProps = {
    children: ReactNode
}

export function ProjectionLayout({ children }: ProjectionLayoutProps) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-10 projector-mode">
            {/* 
                Clean, high-contrast container for participants.
                Disabled hover states and admin clutter via CSS.
            */}
            {children}
        </div>
    )
}
