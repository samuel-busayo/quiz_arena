import React, { ReactNode, useEffect } from 'react'
import { useQuizStore } from '../store/useQuizStore'

type MainShellProps = {
    children: ReactNode
}

export function MainShell({ children }: MainShellProps) {
    const { setPaused, resetQuiz, isPaused, systemSettings } = useQuizStore()

    const themeClass = systemSettings.theme === 'light' ? 'theme-light' : ''

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only global shortcuts for Admin view
            if (window.name === 'admin' || !window.name) {
                if (e.code === 'Space') {
                    e.preventDefault()
                    setPaused(!isPaused)
                }
                if (e.code === 'Escape') {
                    if (window.confirm('Emergency Reset simulation state?')) {
                        resetQuiz()
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isPaused, setPaused, resetQuiz])

    return (
        <div className={`h-screen w-screen tech-surface select-none ${themeClass}`}>
            {/* The .tech-surface class in index.css includes the grid overlay */}
            <main className="relative z-10 h-full w-full overflow-hidden">
                {children}
            </main>
        </div>
    )
}
