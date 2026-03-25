import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TvButton } from '../../components/ui/TvButton'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import {
    Play, Pause, RotateCcw, Volume2, Trophy,
    ArrowRight, ShieldAlert, Zap, CheckCircle2,
    XCircle, Music, Power
} from 'lucide-react'
import { useQuizStore, Question } from '../../store/useQuizStore'
import { simulationEngine } from './QuizSimulationEngine'
import { audioEngine } from './AudioEngine'
import { PickNumberGrid } from './PickNumberGrid'
import { cn } from '../../utils/cn'

export function AdminConsoleScreen() {
    const {
        currentState,
        setUiScreen,
        teams,
        config,
        currentRound,
        currentTake,
        currentTeamId,
        currentQuestion,
        timerRemaining,
        isPaused,
        setPaused,
    } = useQuizStore()

    const activeTeam = teams.find(t => t.id === currentTeamId)
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)

    const handleResult = (correct: boolean) => {
        simulationEngine.revealAnswer(correct)
    }

    return (
        <div className="h-screen w-screen bg-tv-background overflow-hidden flex flex-col font-rajdhani text-white relative">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* TOP STATUS BAR */}
            <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-10">
                    <div className="flex flex-col">
                        <TvText variant="label" className="text-[10px] opacity-40">MISSION PHASE</TvText>
                        <TvText variant="h3" className="text-tv-accent tracking-widest uppercase">ROUND {currentRound}</TvText>
                    </div>
                    <div className="flex flex-col">
                        <TvText variant="label" className="text-[10px] opacity-40">ENGAGEMENT TAKE</TvText>
                        <TvText variant="h3" className="text-tv-accent tracking-widest uppercase">TAKE {currentTake}</TvText>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-4">
                        <TvText variant="label" className="text-[10px] opacity-40">ACTIVE OPERATIVE</TvText>
                        <motion.div
                            animate={{ borderColor: activeTeam?.color || '#00E5FF' }}
                            className="px-4 py-1 border-l-2 bg-white/5 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeTeam?.color }} />
                            <TvText variant="h3" className="uppercase tracking-tighter" style={{ color: activeTeam?.color }}>
                                {activeTeam?.name || 'AWAITING NEURAL LINK'}
                            </TvText>
                        </motion.div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-tv-success" />
                        <TvText variant="body" className="text-[10px] font-bold tracking-widest uppercase">
                            LIVE {config?.mode} ENGINE
                        </TvText>
                    </div>
                    <div className="flex gap-2">
                        <TvButton
                            variant="secondary"
                            size="sm"
                            className="bg-tv-panel border-white/10"
                            onClick={() => setPaused(!isPaused)}
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </TvButton>
                        <TvButton
                            variant="secondary"
                            size="sm"
                            className="text-tv-danger hover:bg-tv-danger/10 border-white/10"
                            onClick={() => {
                                if (confirm('ABORT MISSION AND RETURN TO COMMAND CENTER?')) {
                                    setUiScreen('COMMAND_CENTER')
                                }
                            }}
                        >
                            <Power size={16} />
                        </TvButton>
                    </div>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-[300px_1fr_250px] gap-8 p-8 min-h-0 overflow-hidden relative">
                {/* DOCKED SCOREBOARD (LEFT) */}
                <aside className="flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={14} className="text-tv-accent" />
                        <TvText variant="label" className="text-xs uppercase tracking-[0.2em] opacity-60">Operative Standings</TvText>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        <AnimatePresence mode="popLayout">
                            {teams.map((team) => (
                                <motion.div
                                    key={team.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: currentTeamId === team.id ? 1.04 : 1,
                                        boxShadow: currentTeamId === team.id ? `0 0 20px -5px ${team.color}66` : 'none'
                                    }}
                                    className={cn(
                                        "p-4 rounded border-l-4 transition-all flex justify-between items-center relative overflow-hidden",
                                        currentTeamId === team.id ? 'bg-tv-accentSoft border-white/20' : 'bg-tv-panel/40 border-white/5',
                                        team.isEliminated && "opacity-30 grayscale"
                                    )}
                                    style={{ borderLeftColor: team.color }}
                                >
                                    <div className="flex flex-col">
                                        <TvText variant="body" className="text-xs font-black uppercase tracking-wider">{team.name}</TvText>
                                        <div className="w-12 h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                className="h-full"
                                                style={{ backgroundColor: team.color }}
                                            />
                                        </div>
                                    </div>
                                    <TvText variant="h2" className="text-tv-accent">{team.score}</TvText>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* CENTRAL ENGAGEMENT STAGE */}
                <div className="flex flex-col items-center justify-center min-h-0">
                    <AnimatePresence mode="wait">
                        {currentState === 'ARMING' && (
                            <motion.div
                                key="arming"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="flex flex-col items-center gap-10"
                            >
                                <div className="p-12 rounded-full border border-tv-accent/20 bg-tv-accentSoft relative">
                                    <div className="absolute inset-0 border border-tv-accent animate-ping rounded-full opacity-20" />
                                    <Zap size={64} className="text-tv-accent animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <TvText variant="h1" className="text-6xl tracking-[0.2em] font-black italic">ARMING SYSTEM</TvText>
                                    <TvText variant="muted" className="uppercase tracking-[0.4em] opacity-40">Synchronizing Neural Vectors...</TvText>
                                </div>
                                <TvButton variant="primary" size="xl" glow onClick={() => simulationEngine.startSimulation()}>
                                    INITIATE SIMULATION
                                </TvButton>
                            </motion.div>
                        )}

                        {currentState === 'PICKER_PHASE' && (
                            <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                                <PickNumberGrid isAdmin />
                            </motion.div>
                        )}

                        {(currentState === 'QUESTION' || currentState === 'ANSWER_REVEAL') && currentQuestion && (
                            <motion.div
                                key="question"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full flex flex-col gap-12"
                            >
                                <div className="p-1 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
                                    <div className="bg-tv-panel p-10 rounded-xl border border-white/10">
                                        <TvText variant="h2" align="center" className="text-4xl lg:text-5xl leading-tight font-bold text-tv-accent">
                                            {currentQuestion.question}
                                        </TvText>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 w-full">
                                    {(['A', 'B', 'C', 'D'] as const).map(key => (
                                        <OptionControl
                                            key={key}
                                            label={key}
                                            text={currentQuestion.options[key]}
                                            isCorrect={currentQuestion.answer === key}
                                            isRevealed={currentState === 'ANSWER_REVEAL'}
                                            onClick={() => setSelectedAnswer(key)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {currentState === 'WINNER' && (
                            <motion.div key="winner" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-10">
                                <Trophy size={120} className="text-tv-accent drop-shadow-glow animate-bounce" />
                                <TvText variant="h1" className="text-6xl font-black italic">MISSION COMPLETE</TvText>
                                <TvButton variant="ghost" onClick={() => useQuizStore.getState().resetQuiz()}>CLOSE SESSION</TvButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DOCKED TIMER (RIGHT) */}
                <aside className="flex flex-col items-center gap-6 h-full border-l border-white/5 pl-8">
                    <TvText variant="label" className="text-xs uppercase tracking-[0.2em] opacity-60">System Clock</TvText>
                    <div className="relative group mt-4">
                        <TvProgressRing
                            duration={config?.timerSeconds || 30}
                            remaining={timerRemaining}
                            size={180}
                            strokeWidth={10}
                            colorOverride={timerRemaining < 5 ? '#FF3D00' : undefined}
                        />
                        {/* Note: Redundant center text removed as it's handled by TvProgressRing */}
                    </div>

                    <div className="mt-auto w-full space-y-4 pb-8">
                        <div className="p-4 bg-white/5 rounded border border-white/10">
                            <TvText variant="label" className="text-[10px] opacity-40 mb-2">PICKER FOCUS</TvText>
                            <TvText variant="h3" className="text-sm">
                                {currentState === 'PICKER_PHASE' ? activeTeam?.name : 'IDLE'}
                            </TvText>
                        </div>
                    </div>
                </aside>
            </main>

            {/* BOTTOM CONTROL STRIP */}
            <footer className="h-20 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between px-12 z-50">
                <div className="flex gap-4">
                    <TvButton
                        variant="primary"
                        size="md"
                        className="bg-tv-success hover:bg-tv-success/80 border-tv-success px-8"
                        iconLeft={<CheckCircle2 size={18} />}
                        onClick={() => handleResult(true)}
                    >
                        CORRECT (F1)
                    </TvButton>
                    <TvButton
                        variant="danger"
                        size="md"
                        className="px-8"
                        iconLeft={<XCircle size={18} />}
                        onClick={() => handleResult(false)}
                    >
                        WRONG (F2)
                    </TvButton>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        <TvButton variant="ghost" size="sm" iconLeft={<RotateCcw size={16} />} />
                        <TvButton variant="ghost" size="sm" iconLeft={<Music size={16} />} />
                        <TvButton
                            variant="ghost"
                            size="sm"
                            className="text-tv-danger hover:bg-tv-danger/10"
                            iconLeft={<ShieldAlert size={16} />}
                            onClick={() => {
                                if (activeTeam && confirm(`ELIMINATE ${activeTeam.name}?`)) {
                                    useQuizStore.getState().eliminateTeam(activeTeam.id)
                                    simulationEngine.transitionTo('ELIMINATION')
                                }
                            }}
                        />
                    </div>
                    <TvButton
                        variant="secondary"
                        className="border-white/20 px-6"
                        iconRight={<ArrowRight size={16} />}
                        onClick={() => simulationEngine.transitionTo('LEADERBOARD')}
                    >
                        FORCE LEADERBOARD
                    </TvButton>
                </div>
            </footer>
        </div>
    )
}

function OptionControl({ label, text, isCorrect, isRevealed, onClick }: { label: string, text: string, isCorrect: boolean, isRevealed: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-6 rounded border-l-4 text-left flex items-start gap-6 transition-all relative overflow-hidden group",
                isRevealed && isCorrect ? 'bg-tv-success/20 border-tv-success shadow-glow scale-[1.02]' : 'bg-tv-panel border-white/10 hover:border-tv-accent/50',
                isRevealed && !isCorrect ? 'opacity-40 grayscale-[0.5]' : ''
            )}
            style={{ borderLeftColor: isRevealed && isCorrect ? '#00E676' : 'rgba(255,255,255,0.1)' }}
        >
            <TvText variant="h2" className={cn(
                "font-black opacity-30 group-hover:opacity-100 transition-opacity",
                isRevealed && isCorrect ? 'text-tv-success opacity-100' : 'text-white'
            )}>
                {label}
            </TvText>
            <div>
                <TvText variant="body" className="text-xl font-bold uppercase tracking-tight">{text}</TvText>
                {isRevealed && isCorrect && (
                    <TvText variant="label" className="text-[10px] text-tv-success tracking-widest mt-1 block">SYSTEM VERIFIED</TvText>
                )}
            </div>
        </button>
    )
}
