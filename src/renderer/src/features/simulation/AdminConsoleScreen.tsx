import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TvButton } from '../../components/ui/TvButton'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import {
    Play, Pause, RotateCcw, Volume2, Trophy,
    ArrowRight, ShieldAlert, Zap, CheckCircle2,
    XCircle, Music, Power, ArrowLeft, ShieldCheck, Database
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
        selectedOption,
        isConfirming,
        isLocked,
        setCurrentState,
        uiOverlay,
        eliminatedOptions,
        resetQuiz,
        saveSession,
        deleteSession
    } = useQuizStore()

    const [isSaving, setIsSaving] = React.useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        await saveSession()
        setTimeout(() => setIsSaving(false), 1000)
    }

    const activeTeam = teams.find(t => t.id === currentTeamId)
    const [displayInfo, setDisplayInfo] = useState({ count: 1, primaryRes: '...', secondaryRes: '...', isProjectorAlive: false })

    useEffect(() => {
        const updateInfo = async () => {
            const info = await window.api.getDisplayInfo()
            setDisplayInfo(info)
        }
        updateInfo()
        const timer = setInterval(updateInfo, 2000)
        return () => clearInterval(timer)
    }, [])

    // KEYBOARD INPUT ENGINE
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (currentState !== 'QUESTION' || isConfirming || isLocked) return

            const key = e.key.toLowerCase()
            if (key === 'a') simulationEngine.selectAnswer('A')
            if (key === 'b') simulationEngine.selectAnswer('B')
            if (key === 'c') simulationEngine.selectAnswer('C')
            if (key === 'd') simulationEngine.selectAnswer('D')
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentState, isConfirming, isLocked])

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
                            <TvText
                                variant="h3"
                                className={cn(
                                    "uppercase tracking-tighter truncate max-w-[200px]",
                                    (activeTeam?.name?.length || 0) > 15 ? "text-sm" : (activeTeam?.name?.length || 0) > 12 ? "text-base" : "text-lg"
                                )}
                                style={{ color: activeTeam?.color }}
                            >
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
                            className={cn(
                                "border-white/10 px-4",
                                uiOverlay === 'leaderboard' ? "bg-tv-accent text-black" : "bg-tv-panel text-tv-accent"
                            )}
                            onClick={() => uiOverlay === 'leaderboard' ? simulationEngine.hideLeaderboard() : simulationEngine.showLeaderboard()}
                        >
                            {uiOverlay === 'leaderboard' ? 'HIDE STANDINGS' : 'VIEW STANDINGS'}
                        </TvButton>

                        <TvButton
                            variant="secondary"
                            size="sm"
                            className="bg-tv-panel border-white/10"
                            disabled={uiOverlay === 'leaderboard'}
                            onClick={() => isPaused ? simulationEngine.resumeTimer() : simulationEngine.pauseTimer()}
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </TvButton>
                        <TvButton
                            variant="secondary"
                            size="sm"
                            iconLeft={<Database size={16} />}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'SYNCING...' : 'SAVE MISSION'}
                        </TvButton>
                        <TvButton
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                                if (window.confirm("CRITICAL: This will terminate the current mission and CLEAR all progress (including saved session). Proceed?")) {
                                    await deleteSession()
                                    resetQuiz()
                                }
                            }}
                        >
                            ABORT MISSION
                        </TvButton>
                    </div>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-[max(250px,20vw)_1fr_max(220px,18vw)] gap-[2vw] p-[2vw] min-h-0 overflow-hidden relative">
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
                                        "p-[1vw] rounded border-l-4 transition-all flex justify-between items-center relative overflow-hidden",
                                        currentTeamId === team.id ? 'bg-tv-accentSoft border-white/20' : 'bg-tv-panel/40 border-white/5',
                                        team.isEliminated && "opacity-30 grayscale"
                                    )}
                                    style={{ borderLeftColor: team.color }}
                                >
                                    <div className="flex flex-col min-w-0">
                                        <TvText
                                            variant="body"
                                            className={cn(
                                                "font-black uppercase tracking-wider truncate",
                                                team.name.length > 15 ? "text-[10px]" : team.name.length > 12 ? "text-[11px]" : "text-xs"
                                            )}
                                        >
                                            {team.name}
                                        </TvText>
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
                                className="flex flex-col items-center gap-[4vh]"
                            >
                                <div className="p-[2vw] rounded-full border border-tv-accent/20 bg-tv-accentSoft relative">
                                    <div className="absolute inset-0 border border-tv-accent animate-ping rounded-full opacity-20" />
                                    <Zap size={48} className="text-tv-accent animate-pulse" />
                                </div>
                                <div className="text-center space-y-1">
                                    <TvText align="center" variant="h1" className="text-[clamp(2rem,8vh,5rem)] tracking-[0.2em] font-black italic leading-none">ARMING SYSTEM</TvText>
                                    <TvText align="center" variant="muted" className="uppercase tracking-[0.4em] opacity-40 text-xs">Synchronizing Neural Vectors...</TvText>
                                </div>
                                <div className="flex gap-4">
                                    <TvButton variant="ghost" iconLeft={<ArrowLeft size={18} />} onClick={() => {
                                        setUiScreen('QUIZ_SETUP')
                                        setCurrentState('STANDBY')
                                    }}>
                                        BACK TO SETUP
                                    </TvButton>
                                    <TvButton variant="primary" size="lg" glow onClick={() => simulationEngine.startSimulation()}>
                                        INITIATE NEURAL LINK
                                    </TvButton>
                                </div>
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
                                className="w-full flex flex-col gap-[3vh]"
                            >
                                <div className="p-1 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
                                    <div className="bg-tv-panel p-[2vw] rounded-xl border border-white/10">
                                        <TvText variant="h2" align="center" className="text-[clamp(1.5rem,4.5vh,3.5rem)] leading-[1.1] font-bold text-tv-accent">
                                            {currentQuestion.question}
                                        </TvText>
                                    </div>
                                </div>

                                {config?.lifelineConfig.enabled && currentState === 'QUESTION' && (
                                    <div className="flex justify-center -mt-2">
                                        <TvButton
                                            variant="secondary"
                                            size="sm"
                                            className={cn(
                                                "border-tv-accent/20 px-6 py-2 bg-tv-accentSoft text-tv-accent font-bold tracking-widest",
                                                (eliminatedOptions.length > 0 || (activeTeam?.lifelineRemaining || 0) <= 0 || isLocked) && "opacity-40 grayscale pointer-events-none"
                                            )}
                                            glow={eliminatedOptions.length === 0 && (activeTeam?.lifelineRemaining || 0) > 0 && !isLocked}
                                            iconLeft={<ShieldCheck size={16} />}
                                            onClick={() => simulationEngine.activate5050()}
                                        >
                                            {eliminatedOptions.length > 0 ? '50/50 ACTIVE' :
                                                (activeTeam?.lifelineRemaining || 0) > 0 ? `ACTIVATE 50/50 (${activeTeam?.lifelineRemaining} LEFT)` :
                                                    'NO LIFELINE REMAINING'}
                                        </TvButton>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-[2vh] w-full">
                                    {(['A', 'B', 'C', 'D'] as const).map(key => (
                                        <OptionControl
                                            key={key}
                                            label={key}
                                            text={currentQuestion.options[key]}
                                            isCorrect={currentQuestion.answer === key}
                                            isRevealed={currentState === 'ANSWER_REVEAL'}
                                            onClick={() => simulationEngine.selectAnswer(key)}
                                            isSelected={selectedOption === key}
                                            disabled={isLocked || uiOverlay === 'leaderboard'}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {currentState === 'LEADERBOARD' && (
                            <motion.div key="leaderboard" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-[4vh]">
                                <Trophy size={80} className="text-tv-accent drop-shadow-glow animate-pulse" />
                                <div className="text-center space-y-2">
                                    <TvText variant="h1" className="text-5xl font-black italic">ROUND COMPLETE</TvText>
                                    <TvText variant="muted" className="uppercase tracking-[0.4em] opacity-40 text-xs text-center block">Standings Synchronized with Projector</TvText>
                                </div>
                                <TvButton
                                    variant="primary"
                                    size="lg"
                                    glow
                                    iconRight={<ArrowRight size={20} />}
                                    onClick={() => simulationEngine.startNextRound()}
                                >
                                    START NEXT ROUND
                                </TvButton>
                            </motion.div>
                        )}

                        {currentState === 'WINNER' && (
                            <motion.div key="winner" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-[4vh]">
                                <Trophy size={80} className="text-tv-accent drop-shadow-glow animate-bounce" />
                                <TvText variant="h1" className="text-[clamp(2rem,6vh,4rem)] font-black italic leading-none">MISSION COMPLETE</TvText>
                                <TvButton variant="ghost" size="sm" onClick={() => useQuizStore.getState().resetQuiz()}>CLOSE SESSION</TvButton>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ADMIN CONFIRMATION MODAL */}
                    <AnimatePresence>
                        {isConfirming && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                            >
                                <TvPanel className="max-w-md w-full p-8 border-tv-accent/30 shadow-[0_0_50px_rgba(0,229,255,0.2)]">
                                    <div className="flex flex-col items-center gap-6 text-center">
                                        <div className="w-16 h-16 rounded-full bg-tv-accentSoft flex items-center justify-center border border-tv-accent/50 mb-2">
                                            <TvText variant="h1" className="text-tv-accent">{selectedOption}</TvText>
                                        </div>

                                        <div>
                                            <TvText variant="h2" className="text-2xl font-bold uppercase tracking-tight mb-2">
                                                Confirm Answer?
                                            </TvText>
                                            <TvText variant="body" className="opacity-60 text-sm">
                                                Are you sure this is the team's final answer? This action cannot be undone.
                                            </TvText>
                                        </div>

                                        <div className="flex flex-col w-full gap-3 mt-4">
                                            <TvButton
                                                variant="primary"
                                                size="lg"
                                                glow
                                                className="w-full py-4 text-lg"
                                                disabled={isLocked}
                                                onClick={() => simulationEngine.confirmAnswer()}
                                            >
                                                {isLocked ? 'LOCKING...' : 'YES – LOCK ANSWER'}
                                            </TvButton>
                                            <TvButton
                                                variant="ghost"
                                                className="w-full text-white/40 hover:text-white"
                                                disabled={isLocked}
                                                onClick={() => simulationEngine.cancelSelection()}
                                            >
                                                CANCEL
                                            </TvButton>
                                        </div>
                                    </div>
                                </TvPanel>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DOCKED TIMER (RIGHT) */}
                <aside className="flex flex-col items-center gap-[3vh] h-full border-l border-white/5 pl-[2vw]">
                    <TvText variant="label" className="text-xs uppercase tracking-[0.2em] opacity-60">System Clock</TvText>
                    <div className="relative group mt-4">
                        <TvProgressRing
                            duration={config?.timerSeconds || 30}
                            remaining={timerRemaining}
                            size={150}
                            strokeWidth={8}
                            colorOverride={timerRemaining < 5 ? '#FF3D00' : undefined}
                        />
                    </div>

                    <div className="mt-auto w-full space-y-4 pb-8">
                        <div className="p-4 bg-white/5 rounded border border-white/10">
                            <TvText variant="label" className="text-[10px] opacity-40 mb-2">PICKER FOCUS</TvText>
                            <TvText variant="h3" className="text-sm">
                                {currentState === 'PICKER_PHASE' ? activeTeam?.name : 'IDLE'}
                            </TvText>
                        </div>

                        {/* Projection Debug Panel */}
                        <div className="p-[1vw] bg-black/40 border border-tv-accent/20 rounded shadow-glow-soft">
                            <TvText variant="label" className="text-[8px] text-tv-accent tracking-[0.2em] mb-3 block">DISPLAY DIAGNOSTICS</TvText>
                            <div className="space-y-2">
                                <DebugInfo label="Displays" value={displayInfo.count} />
                                <DebugInfo label="Primary" value={displayInfo.primaryRes} />
                                <DebugInfo label="External" value={displayInfo.secondaryRes} color={displayInfo.count > 1 ? 'text-tv-success' : 'text-tv-danger'} />
                                <DebugInfo label="Projector" value={displayInfo.isProjectorAlive ? 'ONLINE' : 'OFFLINE'} color={displayInfo.isProjectorAlive ? 'text-tv-success' : 'text-tv-danger'} />
                                <DebugInfo label="Phase" value={currentState} />
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* BOTTOM CONTROL STRIP */}
            <footer className="h-20 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between px-12 z-50">
                <div className="flex gap-4 items-center">
                    <TvText variant="label" className="text-tv-accent tracking-[0.2em] opacity-80 uppercase">
                        {currentState === 'QUESTION' ? 'AWAITING TEAM INPUT...' : 'AUTO-SCORING ENGINE ACTIVE'}
                    </TvText>
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
                </div>
            </footer>
        </div>
    )
}

function DebugInfo({ label, value, color }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="flex justify-between items-center text-[9px] tracking-tight">
            <span className="opacity-40 uppercase">{label}</span>
            <span className={cn("font-bold uppercase", color || "text-white")}>{value}</span>
        </div>
    )
}

function OptionControl({ label, text, isCorrect, isRevealed, onClick, isSelected, disabled }: {
    label: string,
    text: string,
    isCorrect: boolean,
    isRevealed: boolean,
    onClick: () => void,
    isSelected?: boolean,
    disabled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isRevealed}
            className={cn(
                "p-[1vw] rounded border-l-4 text-left flex items-start gap-[1vw] transition-all relative overflow-hidden group",
                !isRevealed ? 'bg-tv-panel hover:bg-white/10 border-white/10' : '',
                isRevealed && isCorrect ? 'bg-tv-success/20 border-tv-success shadow-glow scale-[1.02] z-10' : '',
                isRevealed && isSelected && !isCorrect ? 'bg-tv-danger/20 border-tv-danger animate-[shake_0.5s_ease-in-out]' : '',
                isRevealed && !isCorrect && !isSelected ? 'opacity-40 grayscale-[0.5]' : '',
                disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ borderLeftColor: isRevealed && isCorrect ? '#00E676' : isRevealed && isSelected && !isCorrect ? '#FF3D00' : (isSelected && !isRevealed) ? '#00E5FF' : 'rgba(255,255,255,0.1)' }}
        >
            <TvText variant="h2" className={cn(
                "font-black opacity-30 group-hover:opacity-100 transition-opacity text-xl",
                isRevealed && isCorrect ? 'text-tv-success opacity-100' : isRevealed && isSelected && !isCorrect ? 'text-tv-danger opacity-100' : (isSelected && !isRevealed) ? 'text-tv-accent opacity-100' : 'text-white'
            )}>
                {label}
            </TvText>
            <div className="flex-1">
                <TvText variant="body" className="text-[clamp(0.9rem,2.2vh,1.6rem)] font-bold uppercase tracking-tight">{text}</TvText>
                {isRevealed && isCorrect && (
                    <TvText variant="label" className="text-[10px] text-tv-success tracking-widest mt-1 block">SYSTEM VERIFIED</TvText>
                )}
                {isRevealed && isSelected && !isCorrect && (
                    <TvText variant="label" className="text-[10px] text-tv-danger tracking-widest mt-1 block">INCORRECT</TvText>
                )}
                {!isRevealed && isSelected && (
                    <TvText variant="label" className="text-[10px] text-tv-accent tracking-widest mt-1 block">AWAITING LOCK</TvText>
                )}
            </div>
        </button>
    )
}
