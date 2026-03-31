import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'

interface SplashScreenProps {
    onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState('Initializing System...')
    const { systemSettings } = useQuizStore()

    useEffect(() => {
        const statuses = [
            'Loading Core Modules...',
            'Preloading Audio Assets...',
            'Connecting Dual Screen API...',
            'Configuring Render Engine...',
            'System Ready'
        ]

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(onFinish, 1000)
                    return 100
                }

                // Update status based on progress
                const statusIndex = Math.floor((prev / 100) * statuses.length)
                setStatus(statuses[statusIndex])

                return prev + 1
            })
        }, 30)

        return () => clearInterval(interval)
    }, [onFinish])

    return (
        <div className="h-screen w-screen bg-primary-bg flex flex-col items-center justify-center p-8">
            <div className="relative">
                {/* Animated logo/title */}
                <h1 className="text-8xl font-orbitron text-primary-accent tracking-[0.3em] font-bold drop-shadow-[0_0_20px_rgba(0,229,255,0.4)] uppercase">
                    {systemSettings?.organizationName || 'COORDI.TECH'}
                </h1>
                <div className="flex items-center justify-between mt-2">
                    <span className="h-[1px] bg-primary-accent/30 flex-1 mr-4"></span>
                    <span className="font-rajdhani text-primary-secondary tracking-[0.5em] text-xl">QUIZ ARENA</span>
                    <span className="h-[1px] bg-primary-accent/30 flex-1 ml-4"></span>
                </div>
            </div>

            <div className="mt-24 w-96 flex flex-col items-center gap-4">
                <div className="flex justify-between w-full font-rajdhani text-primary-secondary text-xs uppercase tracking-widest">
                    <span>{status}</span>
                    <span className="text-primary-accent font-bold">{progress}%</span>
                </div>

                <div className="w-full h-1 bg-primary-surface rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-primary-accent shadow-[0_0_10px_rgba(0,229,255,0.8)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Binary code scrolling background effect (simulated) */}
                <div className="mt-8 text-[8px] font-mono text-primary-accent/10 h-10 overflow-hidden leading-tight text-center max-w-xs select-none">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`whitespace-nowrap ${i % 2 === 0 ? 'animate-[marquee_10s_linear_infinite]' : 'animate-[marquee-rev_12s_linear_infinite]'}`}>
                            {Array.from({ length: 100 }).map(() => Math.round(Math.random())).join(' ')}
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-12 font-rajdhani text-primary-secondary/30 text-[10px] tracking-widest uppercase">
                Standalone Competitive Software // Build 2026.03.25
            </div>
        </div>
    )
}
