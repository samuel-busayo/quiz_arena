import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TvButton } from '../../components/ui/TvButton'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import {
    Play, Pause, RotateCcw, Volume2, Trophy,
    ArrowRight, Zap, CheckCircle2,
    XCircle, Power, ArrowLeft, ShieldCheck, Database
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
        deleteSession,
        tieBreakerTeams,
        cinematicStage
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
        <div className="h-screen w-screen bg-tv-background overflow-hidden flex flex-col font-rajdhani text-white relative text-sm">

            {/* TOP STATUS BAR */}
            <header className="h-[4.25rem] border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-5 z-50">
                <div className="flex items-center gap-7">
                    <div className="flex flex-col items-center">
                        <TvText variant="label" className="text-[7px] opacity-40">MISSION PHASE</TvText>
                        <TvText variant="h3" className="text-tv-accent tracking-widest uppercase text-xs text-center">ROUND {currentRound}</TvText>
                    </div>
                    <div className="flex flex-col items-center">
                        <TvText variant="label" className="text-[7px] opacity-40">ENGAGEMENT TAKE</TvText>
                        <TvText variant="h3" className="text-tv-accent tracking-widest uppercase text-xs text-center">TAKE {currentTake}</TvText>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <TvText variant="label" className="text-[7px] opacity-40 mb-0.5">ACTIVE OPERATIVE</TvText>
                            <motion.div
                                animate={{ borderColor: activeTeam?.color || '#00E5FF' }}
                                className="px-3 py-0.5 border-b-2 bg-white/5 flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeTeam?.color }} />
                                <TvText
                                    variant="h3"
                                    align="center"
                                    className={cn(
                                        "uppercase tracking-tighter truncate max-w-[150px] text-center",
                                        (activeTeam?.name?.length || 0) > 15 ? "text-[10px]" : (activeTeam?.name?.length || 0) > 12 ? "text-xs" : "text-base"
                                    )}
                                    style={{ color: activeTeam?.color }}
                                >
                                    {activeTeam?.name || 'AWAITING NEURAL LINK'}
                                </TvText>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/10">
                        <div className="w-1 h-1 rounded-full bg-tv-success" />
                        <TvText variant="body" className="text-[7px] font-bold tracking-widest uppercase">
                            LIVE {config?.mode} ENGINE
                        </TvText>
                    </div>
                    <div className="flex gap-1.5">
                        <TvButton
                            variant="secondary"
                            size="sm"
                            className={cn(
                                "border-white/10 px-3 h-7 text-[10px]",
                                uiOverlay === 'leaderboard' ? "bg-tv-accent text-black" : "bg-tv-panel text-tv-accent"
                            )}
                            onClick={() => uiOverlay === 'leaderboard' ? simulationEngine.hideLeaderboard() : simulationEngine.showLeaderboard()}
                        >
                            {uiOverlay === 'leaderboard' ? 'HIDE STANDINGS' : 'VIEW STANDINGS'}
                        </TvButton>

                        <TvButton
                            variant="secondary"
                            size="sm"
                            className="bg-tv-panel border-white/10 h-7 px-2"
                            disabled={uiOverlay === 'leaderboard'}
                            onClick={() => isPaused ? simulationEngine.resumeTimer() : simulationEngine.pauseTimer()}
                        >
                            {isPaused ? <Play size={12} /> : <Pause size={12} />}
                        </TvButton>
                        <TvButton
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            iconLeft={<Database size={12} />}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'SYNCING...' : 'SAVE MISSION'}
                        </TvButton>
                        <TvButton
                            variant="danger"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
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

            <main className="flex-1 grid grid-cols-[max(175px,14vw)_1fr_max(154px,12.6vw)] gap-[1.4vw] p-[1.4vw] min-h-0 overflow-hidden relative">
                {/* DOCKED SCOREBOARD (LEFT) */}
                <aside className="flex flex-col gap-3 h-full overflow-hidden">
                    <div className="flex flex-col items-center gap-1 mb-1.5">
                        <Trophy size={10} className="text-tv-accent" />
                        <TvText variant="label" className="text-[8px] uppercase tracking-[0.2em] opacity-60 text-center">Operative Standings</TvText>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
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
                                    style={{ borderLeftColor: team.color }}
                                >
                                    <div className={cn("flex flex-1 items-center justify-between min-w-0 transition-opacity", team.isEliminated && "grayscale opacity-30")}>
                                        <div className="flex flex-col items-center flex-1 min-w-0">
                                            <TvText
                                                variant="body"
                                                align="center"
                                                className={cn(
                                                    "font-black uppercase tracking-wider truncate w-full text-center",
                                                    team.name.length > 15 ? "text-[7px]" : team.name.length > 12 ? "text-[8px]" : "text-[9px]"
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
                                    </div>
                                    {team.isEliminated && (
                                        <TvText variant="label" className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[5px] text-tv-danger font-black tracking-widest uppercase z-10 bg-black/40 px-1 rounded-sm border border-tv-danger/20">ELIMINATED</TvText>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* CENTRAL ENGAGEMENT STAGE */}
                <div className="flex flex-col items-center justify-center min-h-0">
                    <AnimatePresence mode="wait">
                        {currentState === 'TURN_INTRO' && (
                            <motion.div
                                key="turn-intro"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-[4vh]"
                            >
                                <div className="p-8 rounded-2xl border border-tv-accent/10 bg-tv-panel/40 backdrop-blur-md text-center max-w-lg">
                                    <TvText variant="label" align="center" className="text-tv-accent tracking-[0.2em] pl-[0.2em] mb-3 block animate-pulse text-[8px] text-center">CINEMATIC TRANSITION ACTIVE</TvText>
                                    <TvText variant="h2" align="center" className="text-xl font-bold uppercase mb-1.5 text-center">PREPARING NEXT TAKE</TvText>
                                    <TvText variant="body" align="center" className="opacity-40 text-[10px] italic text-center">Synchronizing neural link for {activeTeam?.name}...</TvText>

                                    <div className="mt-8 flex flex-col items-center gap-4 w-full">
                                        <div className="overflow-hidden h-1.5 w-full bg-white/5 rounded-full border border-white/10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 5.0, ease: 'linear' }}
                                                className="h-full bg-tv-accent shadow-glow"
                                            />
                                        </div>
                                        <TvButton
                                            variant="ghost"
                                            size="sm"
                                            className="text-[8px] opacity-20 hover:opacity-100 transition-opacity"
                                            onClick={() => simulationEngine.proceedFromTransition()}
                                        >
                                            FORCE PROCEED
                                        </TvButton>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentState === 'ROUND_INTRO' && (
                            <motion.div
                                key="round-intro"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-[2.8vh]"
                            >
                                <div className="p-6 rounded-2xl border border-tv-accent/10 bg-tv-panel/40 backdrop-blur-md text-center max-w-sm">
                                    <TvText variant="label" align="center" className="text-tv-accent tracking-[0.2em] pl-[0.2em] mb-3 block animate-pulse text-[8px] text-center">STAGE PROGRESSION ACTIVE</TvText>
                                    <div className="flex flex-col items-center mb-4.5">
                                        <TvText variant="h1" align="center" className="text-4xl font-black italic text-white leading-none text-center">ROUND {currentRound}</TvText>
                                        <div className="h-0.75 w-14 bg-tv-accent mt-1.5 shadow-glow" />
                                    </div>
                                    <TvText variant="body" align="center" className="opacity-40 text-sm text-center">Synchronizing Mission Environment...</TvText>

                                    <div className="mt-8 flex flex-col items-center gap-4 w-full">
                                        <div className="overflow-hidden h-1.5 w-full bg-white/5 rounded-full border border-white/10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 5.0, ease: 'linear' }}
                                                className="h-full bg-tv-accent shadow-glow"
                                            />
                                        </div>
                                        <TvButton
                                            variant="ghost"
                                            size="sm"
                                            className="text-[8px] opacity-20 hover:opacity-100 transition-opacity"
                                            onClick={() => simulationEngine.proceedFromTransition()}
                                        >
                                            FORCE PROCEED
                                        </TvButton>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentState === 'ARMING' && (
                            <motion.div
                                key="arming"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="flex flex-col items-center gap-[2.8vh]"
                            >
                                <div className="p-[1.4vw] rounded-full border border-tv-accent/20 bg-tv-accentSoft relative">
                                    <div className="absolute inset-0 border border-tv-accent animate-ping rounded-full opacity-20" />
                                    <Zap size={32} className="text-tv-accent animate-pulse" />
                                </div>
                                <div className="text-center space-y-0.75">
                                    <TvText align="center" variant="h1" className="text-[clamp(1.4rem,5.6vh,3.5rem)] tracking-[0.2em] font-black italic leading-none">ARMING SYSTEM</TvText>
                                    <TvText align="center" variant="muted" className="uppercase tracking-[0.4em] pl-[0.4em] opacity-40 text-[8px] text-center">Synchronizing Neural Vectors...</TvText>
                                </div>
                                <div className="flex gap-3">
                                    <TvButton variant="ghost" className="h-8 text-xs" iconLeft={<ArrowLeft size={13} />} onClick={() => {
                                        setUiScreen('QUIZ_SETUP')
                                        setCurrentState('STANDBY')
                                    }}>
                                        BACK TO SETUP
                                    </TvButton>
                                    <TvButton variant="primary" size="sm" className="h-8 px-6 text-xs" glow onClick={() => simulationEngine.startSimulation()}>
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
                                exit={{ opacity: 0, y: -15 }}
                                className="w-full flex flex-col gap-[2.1vh]"
                            >
                                <div className="p-0.75 bg-white/5 border border-white/10 rounded-xl shadow-2xl">
                                    <div className="bg-tv-panel p-[1.4vw] rounded-lg border border-white/10">
                                        <TvText
                                            variant="h2"
                                            align="center"
                                            className={cn(
                                                "leading-[1.1] font-bold text-tv-accent transition-all duration-300",
                                                currentQuestion.question.length > 200 ? "text-sm" :
                                                    currentQuestion.question.length > 120 ? "text-base" :
                                                        "text-[clamp(0.9rem,2.7vh,2.15rem)]"
                                            )}
                                        >
                                            {currentQuestion.question}
                                        </TvText>
                                    </div>
                                </div>

                                {config?.lifelineConfig.enabled && ['QUESTION', 'ANSWER_REVEAL'].includes(currentState) && (
                                    <div className="flex justify-center my-6">
                                        <TvButton
                                            variant="secondary"
                                            size="sm"
                                            className={cn(
                                                "border-tv-accent/20 px-4 py-1 h-7 bg-tv-accentSoft text-tv-accent font-bold tracking-widest text-[9px]",
                                                (eliminatedOptions.length > 0 || (activeTeam?.lifelineRemaining || 0) <= 0 || isLocked) && "opacity-40 grayscale pointer-events-none"
                                            )}
                                            glow={eliminatedOptions.length === 0 && (activeTeam?.lifelineRemaining || 0) > 0 && !isLocked}
                                            iconLeft={<ShieldCheck size={12} />}
                                            onClick={() => simulationEngine.activate5050()}
                                        >
                                            {eliminatedOptions.length > 0 ? '50/50 ACTIVE' :
                                                (activeTeam?.lifelineRemaining || 0) > 0 ? `ACTIVATE 50/50 (${activeTeam?.lifelineRemaining} LEFT)` :
                                                    'NO LIFELINE REMAINING'}
                                        </TvButton>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-[1.4vh] w-full">
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

                        {currentState === 'TIE_BREAKER' && (
                            <motion.div
                                key="tie-breaker"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full gap-5"
                            >
                                <TvText variant="label" className="text-tv-warning text-sm tracking-[1em] uppercase animate-pulse">STALEMATE DETECTED</TvText>
                                <TvText variant="h1" className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-glow">TIE BREAKER</TvText>
                                <div className="flex gap-4 mt-3">
                                    {(teams.filter(t => tieBreakerTeams.includes(t.id))).map(team => (
                                        <div key={team.id} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center">
                                            <TvText variant="h3" className="text-sm" style={{ color: team.color }}>{team.name}</TvText>
                                            <TvText variant="muted" className="text-[7px] uppercase tracking-widest mt-0.5">LOCKED IN COMBAT</TvText>
                                        </div>
                                    ))}
                                </div>

                                <TvButton
                                    variant="primary"
                                    size="lg"
                                    glow
                                    className="mt-6 px-8 py-4 text-base"
                                    iconRight={<Zap size={16} />}
                                    onClick={() => simulationEngine.proceedFromIntro()}
                                >
                                    PROCEED TO QUESTION
                                </TvButton>

                                <TvText variant="muted" className="max-w-xs text-center text-[10px] opacity-40 mt-6 italic">
                                    The system has initiated an automated Tie-Breaker protocol. Each team will receive one take per loop until a definitive winner or elimination candidate is identified.
                                </TvText>

                            </motion.div>
                        )}

                        {currentState === 'FAILSAFE_INTRO' && (
                            <motion.div
                                key="failsafe-intro"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full gap-5"
                            >
                                <div className="p-4 rounded-full bg-[#BF00FF]/10 border border-[#BF00FF]/30 animate-pulse">
                                    <Database size={32} className="text-[#BF00FF]" />
                                </div>
                                <TvText variant="h1" className="text-[2.8rem] font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_50px_#BF00FF]">FAILSAFE UNIVERSE</TvText>

                                <TvButton
                                    variant="primary"
                                    size="lg"
                                    glow
                                    className="mt-6 px-8 py-4 text-base bg-[#BF00FF] border-[#BF00FF] hover:bg-[#D000FF]"
                                    iconRight={<Zap size={16} />}
                                    onClick={() => simulationEngine.proceedFromIntro()}
                                >
                                    ENGAGE DRIVECORE 02
                                </TvButton>

                                <TvText variant="muted" className="max-w-xs text-center text-[9px] opacity-40 mt-4 italic">
                                    Primary question core exhausted. Entering emergency failsafe universe. Brace for high-velocity data transition.
                                </TvText>
                            </motion.div>
                        )}

                        {currentState === 'LEADERBOARD' && (
                            <motion.div key="leaderboard" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-[2.8vh]">
                                <Trophy size={56} className="text-tv-accent drop-shadow-glow animate-pulse" />
                                <div className="text-center space-y-1.5">
                                    <TvText variant="h1" className="text-4xl font-black italic">ROUND COMPLETE</TvText>
                                    <TvText variant="muted" className="uppercase tracking-[0.4em] opacity-40 text-[8px] text-center block">Standings Synchronized with Projector</TvText>
                                </div>
                                <TvButton
                                    variant="primary"
                                    size="lg"
                                    glow
                                    className="h-9 px-6 text-sm"
                                    iconRight={<ArrowRight size={14} />}
                                    onClick={() => simulationEngine.startNextRound()}
                                >
                                    START NEXT ROUND
                                </TvButton>
                            </motion.div>
                        )}

                        {currentState === 'WINNER' && (
                            <motion.div key="winner" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-2 w-full max-w-lg text-center h-full max-h-full">
                                <Trophy className="text-tv-accent drop-shadow-glow animate-bounce w-12 h-12" />
                                <TvText variant="h1" className="text-xl font-black italic leading-none text-center">
                                    CINEMATIC SEQUENCE
                                </TvText>

                                <div className="w-full mt-2 px-4">
                                    <div className="p-3 bg-tv-success/5 border border-tv-success/40 rounded-xl flex flex-col items-center justify-center transition-all duration-500 shadow-[0_0_30px_rgba(0,255,100,0.1)]">
                                        <TvText variant="label" className="text-tv-success text-[10px] mb-0.5 tracking-widest">MISSION STATUS</TvText>
                                        <TvText variant="h2" className="text-xl text-tv-success font-bold tracking-tight">
                                            {cinematicStage >= 5 ? "COMPLETED" : "IN PROGRESS"}
                                        </TvText>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-4 w-full justify-center">
                                    <TvButton
                                        variant="danger"
                                        size="lg"
                                        glow
                                        className="py-3 w-full flex items-center justify-center shrink-0"
                                        iconLeft={<Power size={20} />}
                                        onClick={() => window.confirm("Terminate cinematic sequence and power down session?") && resetQuiz()}
                                    >
                                        <span className="text-base uppercase font-bold tracking-wider">EXIT SEQUENCE</span>
                                    </TvButton>

                                    <TvButton
                                        variant="secondary"
                                        className="opacity-50 hover:opacity-100 py-2 w-full flex items-center justify-center shrink-0"
                                        onClick={() => {
                                            if (confirm("RESTART FULL WINNER SIMULATION?")) {
                                                useQuizStore.getState().restartCinematic()
                                            }
                                        }}
                                        iconLeft={<RotateCcw size={16} />}
                                    >
                                        <span className="text-sm uppercase font-bold tracking-wider">FORCE RESTART</span>
                                    </TvButton>
                                </div>
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
                                className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    className="max-w-md w-full bg-tv-panel border border-tv-accent/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="flex flex-col items-center gap-6 mb-8 text-center">
                                        <TvText variant="h1" className="text-6xl font-black text-tv-accent leading-none">
                                            {selectedOption}
                                        </TvText>
                                        <div className="space-y-1">
                                            <TvText variant="label" align="center" className="text-tv-accent tracking-[0.3em] uppercase block">{isLocked ? 'FINAL ANSWER LOCKED' : 'CONFIRM ANSWER'}</TvText>
                                            <TvText variant="h2" align="center" className="text-2xl font-bold text-white uppercase">{activeTeam?.name}</TvText>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
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
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* DOCKED TIMER (RIGHT) */}
                <aside className="flex flex-col items-center gap-[2.1vh] h-full border-l border-white/5 pl-[1.4vw]">
                    <TvText variant="label" align="center" className="text-[7px] uppercase tracking-[0.2em] opacity-60 text-center">System Clock</TvText>
                    <div className="relative group mt-3">
                        <TvProgressRing
                            duration={config?.timerSeconds || 30}
                            remaining={timerRemaining}
                            size={105}
                            strokeWidth={6}
                            colorOverride={timerRemaining < 5 ? '#FF3D00' : undefined}
                        />
                    </div>

                    <div className="mt-auto w-full space-y-3 pb-6">
                        <div className="p-3 bg-white/5 rounded border border-white/10 flex flex-col items-center">
                            <TvText variant="label" align="center" className="text-[7px] opacity-40 mb-1.5 text-center">PICKER FOCUS</TvText>
                            <TvText variant="h3" align="center" className="text-[10px] text-center">
                                {currentState === 'PICKER_PHASE' ? activeTeam?.name : 'IDLE'}
                            </TvText>
                        </div>

                        {/* Projection Debug Panel */}
                        <div className="p-[0.7vw] bg-black/40 border border-tv-accent/20 rounded shadow-glow-soft flex flex-col items-center w-full">
                            <TvText variant="label" align="center" className="text-[7px] text-tv-accent tracking-[0.2em] mb-2 block text-center">DISPLAY DIAGNOSTICS</TvText>
                            <div className="space-y-1.5 w-full">
                                <DebugInfo label="Displays" value={displayInfo.count} />
                                <DebugInfo label="Primary" value={displayInfo.primaryRes} />
                                <DebugInfo label="External" value={displayInfo.secondaryRes} color={displayInfo.count > 1 ? 'text-tv-success' : 'text-tv-danger'} />
                                <DebugInfo label="Projector" value={displayInfo.isProjectorAlive ? 'ONLINE' : 'OFFLINE'} color={displayInfo.isProjectorAlive ? 'text-tv-success' : 'text-tv-danger'} />
                                <DebugInfo label="Phase" value={currentState} />
                            </div>
                        </div>
                    </div>
                </aside >
            </main >

        </div >
    )
}

function DebugInfo({ label, value, color }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="flex justify-between items-center text-[7px] tracking-tight">
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
    const responsiveFontSize = text.length > 100 ? "text-[16px]" :
        text.length > 60 ? "text-[18px]" :
            "text-[clamp(1.2rem,2.8vh,1.8rem)]"

    return (
        <button
            onClick={onClick}
            disabled={disabled || isRevealed}
            className={cn(
                "p-[0.7vw] rounded border flex flex-row items-baseline justify-start gap-[0.5vw] transition-all relative overflow-hidden group min-h-[4vh] h-auto pb-2 px-3",
                !isRevealed ? "bg-tv-panel hover:bg-white/10 border-white/20 hover:border-tv-accent/60 hover:shadow-glow hover:shadow-tv-accent/20" : "",

                isRevealed && isCorrect ? 'bg-tv-success/20 border-tv-success shadow-glow scale-[1.02] z-10' : '',
                isRevealed && isSelected && !isCorrect ? 'bg-tv-danger/20 border-tv-danger animate-[shake_0.5s_ease-in-out]' : '',
                isRevealed && !isCorrect && !isSelected ? 'opacity-40 grayscale-[0.5]' : '',
                disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ borderBottomColor: isRevealed && isCorrect ? '#00E676' : isRevealed && isSelected && !isCorrect ? '#FF3D00' : (isSelected && !isRevealed) ? '#00E5FF' : 'rgba(255,255,255,0.1)' }}
        >
            <TvText variant="body" className={cn(
                "font-black shrink-0 transition-opacity uppercase",
                responsiveFontSize,
                isRevealed && isCorrect ? 'text-tv-success opacity-100' : isRevealed && isSelected && !isCorrect ? 'text-tv-danger opacity-100' : (isSelected && !isRevealed) ? 'text-tv-accent opacity-100' : 'opacity-30 group-hover:opacity-100 text-white'
            )}>
                {label}:
            </TvText>

            <div className="flex-1 text-left">
                <TvText
                    variant="body"
                    align="left"
                    className={cn(
                        "font-bold uppercase tracking-tight transition-all duration-300",
                        responsiveFontSize
                    )}
                >
                    {text}
                </TvText>
                {isRevealed && isCorrect && (
                    <TvText variant="label" className="text-[7px] text-tv-success tracking-widest mt-0.5 block">SYSTEM VERIFIED</TvText>
                )}
                {isRevealed && isSelected && !isCorrect && (
                    <TvText variant="label" className="text-[7px] text-tv-danger tracking-widest mt-0.5 block">INCORRECT</TvText>
                )}
                {!isRevealed && isSelected && (
                    <div className="absolute right-2 top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-tv-accent animate-pulse shadow-[0_0_8px_#00E5FF]" />
                    </div>
                )}
            </div>
        </button>
    )
}
