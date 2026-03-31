import { TechButton } from '../ui/TechButton'
import { Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'

interface TechLayoutProps {
    children: React.ReactNode
    title?: string
    view: 'admin' | 'projector' | 'setup'
}

export function TechLayout({ children, title, view }: TechLayoutProps) {
    const { systemSettings } = useQuizStore()

    return (
        <div className="min-h-screen w-full bg-primary-bg flex flex-col overflow-hidden select-none">
            {/* Header */}
            <header className="h-16 border-b border-primary-surface flex items-center justify-between px-8 bg-black/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-accent flex items-center justify-center rounded">
                        <span className="font-orbitron text-primary-bg font-bold">TV</span>
                    </div>
                    <div>
                        <h1 className="font-orbitron text-lg tracking-widest text-primary-accent leading-none">{systemSettings?.organizationName?.toUpperCase() || 'COORDI.TECH'}</h1>
                        <p className="font-rajdhani text-xs text-primary-secondary uppercase tracking-tighter">Quiz Arena v1.0</p>
                    </div>
                </div>

                {title && (
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <h2 className="font-orbitron text-xl text-primary-text uppercase tracking-[0.2em]">{title}</h2>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {view === 'admin' && (
                        <>
                            <TechButton variant="ghost" size="sm">
                                <Volume2 size={18} />
                            </TechButton>
                            <TechButton variant="ghost" size="sm">
                                <Settings size={18} />
                            </TechButton>
                        </>
                    )}
                    <div className="text-primary-secondary font-rajdhani text-sm">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-auto">
                {/* Subtle grid background */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

                {children}
            </main>

            {/* Footer / Status Bar */}
            <footer className="h-8 border-t border-primary-surface bg-black/40 flex items-center justify-between px-8 text-[10px] text-primary-secondary font-rajdhani tracking-widest uppercase">
                <div className="flex gap-6">
                    <span>System: Online</span>
                    <span>Latency: 2ms</span>
                    <span>Screens: 2 Detected</span>
                </div>
                <div>
                    &copy; 2026 {systemSettings?.organizationName || 'Coordi.Tech'} Education
                </div>
            </footer>
        </div>
    )
}
