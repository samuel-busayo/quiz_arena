import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import { PickNumberGrid } from './PickNumberGrid'
import { Trophy } from 'lucide-react'
import { cn } from '../../utils/cn'
import { ProjectionStandbyScreen } from './ProjectionStandbyScreen'
import { ProjectionHoldingScreen } from './ProjectionHoldingScreen'
import { ProjectionArmingScreen } from './ProjectionArmingScreen'
import { LeaderboardOverlay } from './LeaderboardOverlay'
import { audioEngine } from './AudioEngine'

export function ProjectionScreen() {
    const {
        currentState,
        teams,
        currentRound,
        currentTeamId,
        currentQuestion,
        timerRemaining,
        config,
        uiScreen,
        revealStatus,
        selectedOption,
        isConfirming,
        isLocked,
        uiOverlay
    } = useQuizStore()

    const activeTeam = teams.find(t => t.id === currentTeamId)
    const winner = currentState === 'WINNER' ? [...teams].sort((a, b) => b.score - a.score)[0] : null

    const [showIntro, setShowIntro] = React.useState(false)
    const [showCursor, setShowCursor] = React.useState(true)
    const [dpiScale, setDpiScale] = React.useState(1)

    React.useEffect(() => {
        let timer: NodeJS.Timeout
        const handleMouseMove = () => {
            setShowCursor(true)
            clearTimeout(timer)
            timer = setTimeout(() => setShowCursor(false), 3000)
        }

        window.addEventListener('mousemove', handleMouseMove)
        timer = setTimeout(() => setShowCursor(false), 3000)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            clearTimeout(timer)
        }
    }, [])

    React.useEffect(() => {
        if (currentState === 'ARMING') {
            setShowIntro(true)
            audioEngine.playSfx('bassHit')
            const timer = setTimeout(() => setShowIntro(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [currentState])

    const renderScreen = () => {
        if (currentState === 'ROUND_INTRO') {
            return (
                <motion.div
                    key="round-intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        className="text-center"
                    >
                        <TvText variant="h1" className="text-[clamp(4rem,10vw,8rem)] italic font-black uppercase tracking-[0.4em] text-white underline decoration-tv-accent underline-offset-8">
                            ROUND {currentRound}
                        </TvText>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="h-1 bg-tv-accent mt-4 mx-auto shadow-glow"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ x: '-100vw', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                        className="mt-[10vh] px-20 py-6 border-l-8 bg-white/5 backdrop-blur-xl flex items-center gap-10"
                        style={{ borderColor: activeTeam?.color || '#00E5FF' }}
                    >
                        <TvText variant="h2" className="text-4xl uppercase tracking-[0.5em] opacity-40">ACTIVE OPERATIVE</TvText>
                        <TvText variant="h1" className="text-7xl font-black uppercase text-white tracking-widest" style={{ color: activeTeam?.color }}>
                            {activeTeam?.name}
                        </TvText>
                    </motion.div>
                </motion.div>
            )
        }

        if (showIntro) {
            return (
                <motion.div
                    key="intro-seq"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[100] bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Warp Speed Background Rings */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 4], opacity: [0, 0.2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "circOut" }}
                            className="absolute border-2 border-tv-accent rounded-full w-96 h-96"
                        />
                    ))}

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="text-center z-10"
                    >
                        <div className="flex flex-col items-center mb-12">
                            <motion.div initial={{ width: 0 }} animate={{ width: 200 }} className="h-[1px] bg-tv-accent/50 mb-4" />
                            <TvText variant="h2" className="text-xl tracking-[1.2em] uppercase text-tv-accent/60 mb-2">MISSION BRIEFING</TvText>
                            <TvText variant="h2" className="text-4xl tracking-[0.6em] uppercase font-light">ROUND {currentRound}</TvText>
                            <motion.div initial={{ width: 0 }} animate={{ width: 400 }} className="h-[1px] bg-tv-accent/50 mt-4" />
                        </div>

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 1, type: "spring" }}
                            className="relative"
                        >
                            <TvText variant="label" className="text-tv-accent opacity-50 tracking-[0.5em] mb-4 block">ACTIVE OPERATIVE</TvText>
                            <TvText
                                variant="h1"
                                className={cn(
                                    "font-black uppercase text-white drop-shadow-[0_0_30px_rgba(0,229,255,0.4)] italic leading-none",
                                    (activeTeam?.name?.length || 0) > 20 ? "text-[6vw]" : (activeTeam?.name?.length || 0) > 15 ? "text-[8vw]" : "text-[clamp(4rem,12vw,10rem)]"
                                )}
                            >
                                {activeTeam?.name || teams[0]?.name || 'REDACTED'}
                            </TvText>
                        </motion.div>
                    </motion.div>

                    {/* Scanline Sweep */}
                    <motion.div
                        initial={{ x: '-100%', skewX: -45 }}
                        animate={{ x: '200%', skewX: -45 }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                        className="absolute top-0 bottom-0 left-0 w-[30%] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                    />
                </motion.div>
            )
        }

        if (!['QUIZ_SETUP', 'SIMULATION_CONSOLE'].includes(uiScreen)) {
            return (
                <motion.div
                    key="holding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 w-full"
                >
                    <ProjectionHoldingScreen />
                </motion.div>
            )
        }

        if (uiScreen === 'QUIZ_SETUP') {
            return (
                <motion.div
                    key="arming"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 w-full"
                >
                    <ProjectionArmingScreen />
                </motion.div>
            )
        }

        if (uiScreen === 'SIMULATION_CONSOLE') {
            if (currentState === 'ELIMINATION') {
                return (
                    <motion.div
                        key="elimination"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center relative p-20 border border-tv-danger/30 rounded-3xl bg-tv-panel shadow-[0_0_100px_rgba(255,61,0,0.1)]"
                        >
                            <div className="absolute inset-0 bg-tv-danger/5 animate-pulse" />

                            {/* Visual "Crack" Overlay */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 300">
                                <motion.path
                                    d="M200 150 L250 100 L210 80 M200 150 L150 200 L180 230 M200 150 L240 180 L280 160"
                                    stroke="#FF3D00"
                                    strokeWidth="3"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </svg>

                            <TvText variant="h1" className="text-8xl font-black italic tracking-tighter text-tv-danger mb-4">
                                ELIMINATED
                            </TvText>
                            <div className="h-1 w-64 bg-tv-danger/50 mx-auto mb-10" />
                            <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: [1, 0] }}
                                transition={{ delay: 2.5, duration: 0.5 }}
                            >
                                <TvText variant="h2" className="text-6xl font-black text-white uppercase tracking-widest">
                                    {activeTeam?.name}
                                </TvText>
                            </motion.div>

                            {/* Particle Shatter Trigger */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ x: '50%', y: '50%', scale: 0 }}
                                        animate={{
                                            x: `${Math.random() * 200 - 50}%`,
                                            y: `${Math.random() * 200 - 50}%`,
                                            scale: Math.random() * 2,
                                            opacity: [0, 1, 0],
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{ delay: 2.5, duration: 1 }}
                                        className="absolute w-2 h-2 bg-tv-danger rounded-sm"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )
            }

            if (currentState === 'WINNER' && winner) {
                return <WinnerCelebration winner={winner} />
            }

            if (currentState === 'PICKER_PHASE') {
                return (
                    <motion.div
                        key="picker"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="flex-1 flex items-center justify-center p-[4vw]"
                    >
                        <div className="w-full h-full flex items-center justify-center p-20">
                            <PickNumberGrid isAdmin={false} />
                        </div>
                    </motion.div>
                )
            }

            if ((currentState === 'QUESTION' || currentState === 'ANSWER_REVEAL') && currentQuestion) {
                return (
                    <motion.div
                        key="engagement"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.6, ease: "backOut" }}
                        className="flex-1 flex flex-col p-[4vw] z-10"
                    >
                        {/* TEAM NAME HEADER */}
                        <header className="flex flex-col items-center mb-[4vh]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="max-w-xl h-[4px] relative mb-4"
                                style={{ backgroundColor: activeTeam?.color }}
                            >
                                <div className="absolute inset-0 blur-lg" style={{ backgroundColor: activeTeam?.color }} />
                            </motion.div>
                            <TvText variant="h1" className="text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-widest drop-shadow-glow" style={{ color: activeTeam?.color }}>
                                {activeTeam?.name}
                            </TvText>
                        </header>

                        {/* QUESTION TEXT */}
                        <main className="flex-1 flex flex-col items-center justify-center w-full mx-auto text-center gap-[6vh]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative py-2 px-4"
                            >
                                <TvText variant="h2" className="text-[clamp(2.5rem,7vh,5.5rem)] leading-[1.1] font-semibold text-white/90">
                                    {currentQuestion.question}
                                </TvText>
                            </motion.div>

                            {/* OPTION GRID */}
                            <div className="grid grid-cols-2 gap-[2vh] w-full px-[2vw]">
                                {(['A', 'B', 'C', 'D'] as const).map((key, idx) => (
                                    <ProjectionOption
                                        key={key}
                                        label={key}
                                        text={currentQuestion.options[key]}
                                        isCorrect={currentQuestion.answer === key}
                                        isRevealed={currentState === 'ANSWER_REVEAL'}
                                        isSelected={selectedOption === key}
                                        revealStatus={revealStatus}
                                        index={idx}
                                        teamColor={activeTeam?.color}
                                        isEliminated={useQuizStore.getState().eliminatedOptions.includes(key)}
                                    />
                                ))}
                            </div>

                            {/* FINAL ANSWER DRAMA MODAL */}
                            <AnimatePresence>
                                {isConfirming && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-20"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 1.2, opacity: 0 }}
                                            className="text-center relative"
                                        >
                                            <TvText variant="label" className="text-tv-accent text-3xl tracking-[1.5em] uppercase mb-12 block animate-pulse">
                                                {isLocked ? 'FINAL ANSWER LOCKED' : 'CONFIRM SELECTION?'}
                                            </TvText>

                                            <div className="flex flex-col items-center">
                                                <motion.div
                                                    animate={isLocked ? { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } : {}}
                                                    transition={{ duration: 0.6, repeat: Infinity }}
                                                >
                                                    <TvText variant="h1" className="text-[14vw] font-black italic text-white leading-none mb-8 drop-shadow-glow">
                                                        {selectedOption}
                                                    </TvText>
                                                </motion.div>

                                                <div className="h-[2px] w-64 bg-tv-accent/30 mx-auto" />
                                                <TvText variant="h2" className="text-5xl text-white/50 uppercase tracking-[0.8em] mt-6">
                                                    {activeTeam?.name}
                                                </TvText>
                                            </div>

                                            {isLocked && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-16 overflow-hidden h-3 w-[40vw] bg-white/5 mx-auto rounded-full border border-white/10"
                                                >
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ duration: 0.6, ease: 'linear' }}
                                                        className="h-full bg-tv-accent shadow-[0_0_30px_#00E5FF]"
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* SESSION RESTORATION OVERLAY */}
                            <SessionRestorationOverlay />
                        </main>

                        {/* TOP-RIGHT TIMER RING */}
                        {currentState === 'QUESTION' && (
                            <div className="absolute top-12 right-12 z-50">
                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="relative"
                                >
                                    <TvProgressRing
                                        duration={config?.timerSeconds || 30}
                                        remaining={timerRemaining}
                                        size={180}
                                        strokeWidth={12}
                                        colorOverride={activeTeam?.color}
                                    />
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )
            }

            // Fallback for IDLE or STANDBY in console
            return (
                <motion.div
                    key="standby"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 w-full"
                >
                    <ProjectionStandbyScreen />
                </motion.div>
            )
        }

        return null
    }

    return (
        <div
            className={cn(
                "h-screen w-screen bg-[#050505] overflow-hidden flex flex-col font-rajdhani text-white relative projection-root",
                !showCursor && "cursor-none"
            )}
            style={{
                fontSize: dpiScale !== 1 ? `${dpiScale * 100}%` : undefined
            }}
        >
            {/* Cinematic Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#02040a] via-transparent to-[#02040a] opacity-80" />
            </div>

            <AnimatePresence mode="wait">
                {renderScreen()}
            </AnimatePresence>

            <LeaderboardOverlay />
        </div>
    )
}

function SessionRestorationOverlay() {
    const { currentSessionId, currentState } = useQuizStore()
    const [visible, setVisible] = React.useState(false)

    React.useEffect(() => {
        if (currentSessionId && currentState !== 'IDLE') {
            setVisible(true)
            const timer = setTimeout(() => setVisible(false), 2000)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [currentSessionId])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-tv-accent/10 backdrop-blur-3xl flex flex-col items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 border-4 border-tv-accent border-t-transparent rounded-full animate-spin mb-8 mx-auto" />
                        <TvText variant="h1" className="text-6xl font-black italic tracking-tighter text-white mb-4 drop-shadow-glow">
                            NEURAL LINK RESTORED
                        </TvText>
                        <TvText variant="label" className="text-tv-accent text-2xl tracking-[1em] uppercase block">
                            Synchronizing Session State...
                        </TvText>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function WinnerCelebration({ winner }: { winner: any }) {
    const [stage, setStage] = React.useState(1)

    React.useEffect(() => {
        const timers = [
            setTimeout(() => setStage(2), 500),   // Winner Name Entry
            setTimeout(() => setStage(3), 1700),  // Trophy Reveal
            setTimeout(() => setStage(4), 3200),  // Confetti + Wave
            setTimeout(() => setStage(5), 4700),  // Score Lock
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <motion.div
            key="winner-mega"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Stage 1: Scene Reset (Dark + Spotlight) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15)_0%,transparent_70%)] opacity-50" />

            <AnimatePresence>
                {stage >= 2 && (
                    <motion.div
                        initial={{ scale: 3, opacity: 0, filter: 'blur(40px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="text-center z-10"
                    >
                        <TvText variant="h2" className="text-4xl tracking-[1.5em] text-tv-accent mb-4 opacity-60">CHAMPIONS</TvText>
                        <TvText variant="h1" className="text-[12vw] font-black italic text-white leading-none drop-shadow-[0_0_80px_rgba(0,229,255,0.5)]">
                            {winner.name}
                        </TvText>
                    </motion.div>
                )}
            </AnimatePresence>

            {stage >= 3 && (
                <motion.div
                    initial={{ y: 200, opacity: 0, rotateY: 90 }}
                    animate={{ y: 0, opacity: 1, rotateY: 0 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="mt-12 z-20"
                >
                    <motion.div
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                        <Trophy size={180} className="text-[#FFD700] drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]" />
                    </motion.div>
                </motion.div>
            )}

            {stage >= 4 && (
                <>
                    {/* Confetti Wave */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(40)].map((_, i) => (
                            <motion.div
                                key={`confetti-${i}`}
                                initial={{ y: "110%", x: `${Math.random() * 100}%`, rotate: 0 }}
                                animate={{ y: "-20%", x: `${Math.random() * 100}%`, rotate: 360 }}
                                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-2 h-4 rounded-sm"
                                style={{ backgroundColor: i % 2 === 0 ? winner.color : '#FFFFFF' }}
                            />
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        className="absolute inset-0"
                        style={{ background: `radial-gradient(circle at center, ${winner.color} 0%, transparent 70%)` }}
                    />
                </>
            )}

            {stage >= 5 && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-20 z-30"
                >
                    <div className="flex flex-col items-center">
                        <div className="h-[1px] w-64 bg-white/20 mb-4" />
                        <TvText variant="h2" className="text-5xl font-light tracking-[0.5em] text-white/70">
                            FINAL SCORE: <span className="font-bold text-white">{winner.score} POINTS</span>
                        </TvText>
                        <TvText variant="label" className="mt-8 text-tv-accent tracking-[1em] uppercase animate-pulse">Session Concluded</TvText>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

function ProjectionOption({ label, text, isCorrect, isRevealed, index, teamColor, isSelected, revealStatus, isEliminated }: {
    label: string,
    text: string,
    isCorrect: boolean,
    isRevealed: boolean,
    index: number,
    teamColor?: string,
    isSelected?: boolean,
    revealStatus?: 'correct' | 'wrong' | 'timeout' | null,
    isEliminated?: boolean
}) {
    const isThisCorrect = isRevealed && isCorrect
    const isThisWrong = isRevealed && isSelected && !isCorrect

    return (
        <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={isEliminated ? {
                opacity: [1, 0, 1, 0, 0],
                scale: [1, 1.1, 0.8, 0],
                filter: ["grayscale(0%)", "grayscale(100%)", "blur(4px)"],
            } : {
                opacity: (isRevealed && !isCorrect && !isSelected) ? 0.3 : 1,
                x: isThisWrong ? [0, -15, 15, -15, 15, 0] : 0,
                scale: isThisCorrect ? [1, 1.1, 1] : (isSelected && !isRevealed) ? 1.05 : 1,
                borderColor: isThisCorrect ? '#00E676' : isThisWrong ? '#FF3D00' : (isSelected && !isRevealed) ? '#00E5FF' : 'rgba(255,255,255,0.05)',
                backgroundColor: isThisCorrect ? 'rgba(0, 230, 118, 0.2)' : isThisWrong ? 'rgba(255, 61, 0, 0.15)' : (isSelected && !isRevealed) ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.02)'
            }}
            transition={isEliminated ? {
                duration: 1.5,
                times: [0, 0.2, 0.5, 0.8, 1],
                ease: "easeInOut"
            } : {
                x: { duration: 0.4 },
                scale: { duration: 0.6 },
                default: { delay: isRevealed ? 0 : 0.4 + (index * 0.1), duration: 0.5 }
            }}
            className={cn(
                "p-[1.8vw] rounded-3xl border-4 text-left flex items-center gap-[1.5vw] backdrop-blur-md relative overflow-hidden group",
                isRevealed && !isCorrect && !isSelected ? "grayscale brightness-50" : ""
            )}
        >
            {isThisCorrect && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 6, opacity: [0, 0.4, 0] }}
                    transition={{ duration: 1, ease: 'circOut' }}
                    className="absolute inset-0 bg-tv-success rounded-full pointer-events-none z-0"
                    style={{ left: '50%', top: '50%' }}
                />
            )}

            <div className={cn(
                "w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-500 z-10 font-black text-3xl",
                isThisCorrect ? "bg-tv-success border-tv-success text-black shadow-[0_0_30px_rgba(0,230,118,0.5)]" :
                    isThisWrong ? "bg-tv-danger border-tv-danger text-white shadow-[0_0_30px_rgba(255,61,0,0.5)]" :
                        isSelected ? "bg-tv-accent border-tv-accent text-black" : "bg-white/5 border-white/10 text-white/40"
            )}>
                {label}
            </div>

            <TvText variant="h2" className="text-[clamp(1.2rem,3.8vh,2.8rem)] font-bold text-white/90 uppercase tracking-tight flex-1 z-10 group-hover:text-white transition-colors">
                {text}
            </TvText>

            {isThisCorrect && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </motion.div>
    )
}
