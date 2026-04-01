import React from 'react'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { SoundSettingsModal } from '../../components/ui/SoundSettingsModal'
import { Database, Play, Settings, History, HelpCircle, Volume2 } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'

export function CommandCenterScreen() {
    const { setUiScreen, loadSession, hasSavedSession, systemSettings } = useQuizStore()
    const [isSoundSettingsOpen, setIsSoundSettingsOpen] = React.useState(false)

    return (
        <div className="h-full w-full flex flex-col items-center justify-between py-12 px-8">
            {/* Header */}
            <div className="w-full relative flex items-center justify-center max-w-6xl">
                <div className="text-center">
                    <TvText variant="h1" className="text-2xl lg:text-3xl tracking-[0.2em] uppercase font-black italic">
                        {systemSettings?.organizationName || 'Coordi.Tech'} Quiz Arena
                    </TvText>
                    <TvText variant="muted" className="text-[10px] mt-2 tracking-widest uppercase opacity-80 block text-tv-accent text-center w-full">
                        Powered by Coordi.Tech
                    </TvText>
                </div>

                <div className="absolute right-0 flex gap-4">
                    <TvButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<Settings size={18} />}
                        onClick={() => setUiScreen('SETTINGS')}
                    />
                    <TvButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<Volume2 size={18} />}
                        onClick={() => setIsSoundSettingsOpen(true)}
                    />
                </div>
            </div>

            {/* Main Action */}
            <div className="flex flex-col items-center gap-10">
                <div className="relative group">
                    {/* Glowing background for the big button */}
                    <div className="absolute inset-0 bg-tv-accent/20 blur-3xl group-hover:bg-tv-accent/40 transition-all duration-700 rounded-full" />
                    <TvButton
                        variant="primary"
                        size="xl"
                        glow
                        className="relative z-10 py-8 px-16 text-2xl border-2"
                        onClick={() => setUiScreen('QUIZ_SETUP')}
                    >
                        START QUIZ SIMULATION
                    </TvButton>
                </div>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                <TvCard
                    hoverable
                    className="p-8 flex items-center gap-6 group"
                    onClick={() => setUiScreen('QUESTION_BANK')}
                >
                    <div className="p-4 rounded-lg bg-tv-accentSoft text-tv-accent group-hover:scale-110 transition-transform">
                        <Database size={32} />
                    </div>
                    <div>
                        <TvText variant="h3">Question Bank</TvText>
                        <TvText variant="muted">Manage collections and questions</TvText>
                    </div>
                </TvCard>

                <TvCard
                    hoverable
                    disabled={!hasSavedSession}
                    className="p-8 flex items-center gap-6 group"
                    onClick={() => loadSession()}
                >
                    <div className="p-4 rounded-lg bg-tv-accentSoft text-tv-accent group-hover:scale-110 transition-transform">
                        <Play size={32} />
                    </div>
                    <div>
                        <TvText variant="h3">LOAD SAVED QUIZ STIMULATION</TvText>
                        <TvText variant="muted">Restore active simulation state</TvText>
                    </div>
                </TvCard>

                <TvCard
                    hoverable
                    className="p-8 flex items-center gap-6 group transition-all"
                    onClick={() => setUiScreen('RESULTS_HISTORY')}
                >
                    <div className="p-4 rounded-lg bg-tv-panel text-tv-textMuted group-hover:text-tv-accent">
                        <History size={32} />
                    </div>
                    <div>
                        <TvText variant="h3">Results History</TvText>
                        <TvText variant="muted">View past leaderboards</TvText>
                    </div>
                </TvCard>

                <TvCard
                    hoverable
                    className="p-8 flex items-center gap-6 group"
                    onClick={() => setUiScreen('HELP_ABOUT')}
                >
                    <div className="p-4 rounded-lg bg-tv-panel text-tv-textMuted group-hover:text-tv-accent">
                        <HelpCircle size={32} />
                    </div>
                    <div>
                        <TvText variant="h3">Help / About</TvText>
                        <TvText variant="muted">System info and guides</TvText>
                    </div>
                </TvCard>
            </div>

            <SoundSettingsModal
                isOpen={isSoundSettingsOpen}
                onClose={() => setIsSoundSettingsOpen(false)}
            />

            {/* Subtle Drift / Particle area is handled by MainShell bg */}
        </div>
    )
}
