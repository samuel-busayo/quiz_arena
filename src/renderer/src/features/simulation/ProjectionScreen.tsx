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
        uiOverlay,
        tieBreakerTeams
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
            const timer = setTimeout(() => setShowIntro(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [currentState])

    const renderScreen = () => {
        if (currentState === 'TIE_BREAKER') {
            const tiedTeamsData = teams.filter(t => tieBreakerTeams.includes(t.id))
            return (
                <motion.div
                    key="tie-breaker-intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-[#050000] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Visual Pulse for Stalemate */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,61,0,0.15)_0%,transparent_70%)] animate-pulse" />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="text-center relative z-20"
                    >
                        <TvText variant="label" className="text-tv-warning text-2xl tracking-[2em] uppercase mb-12 block">
                            STALEMATE DETECTED
                        </TvText>

                        <TvText variant="h1" className="text-[12vw] font-black italic uppercase leading-none text-white drop-shadow-[0_0_50px_rgba(255,61,0,0.5)] mb-12">
                            TIE BREAKER
                        </TvText>

                        <div className="flex gap-16 justify-center items-center">
                            {tiedTeamsData.map((team, idx) => (
                                <React.Fragment key={team.id}>
                                    <motion.div
                                        initial={{ x: idx === 0 ? -100 : 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 + (idx * 0.2) }}
                                        className="flex flex-col items-center"
                                    >
                                        <TvText variant="h2" className="text-5xl font-black uppercase" style={{ color: team.color }}>
                                            {team.name}
                                        </TvText>
                                        <div className="mt-4 h-1 w-32 rounded-full" style={{ backgroundColor: team.color }} />
                                    </motion.div>
                                    {idx < tiedTeamsData.length - 1 && (
                                        <TvText variant="h1" className="text-4xl opacity-30 italic font-light">VS</TvText>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {/* Dramatic Warning Borders */}
                    <div className="absolute inset-0 border-[20px] border-tv-warning/5 animate-pulse" />
                </motion.div>
            )
        }

        if (currentState === 'TURN_INTRO' && activeTeam) {
            return (
                <motion.div
                    key="turn-intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        className="text-center relative z-20"
                    >
                        <TvText variant="label" className="text-tv-accent text-2xl tracking-[2em] uppercase mb-12 block animate-pulse">
                            PREPARING NEXT TAKE
                        </TvText>

                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 500 }}
                                transition={{ duration: 3, delay: 0.8 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-tv-accent to-transparent mb-10"
                            />

                            <TvText variant="h2" className="text-3xl tracking-[1.5em] uppercase text-white/30 mb-6 font-light">ACTIVE OPERATIVE</TvText>

                            <motion.div
                                initial={{ scale: 0.7, opacity: 0, filter: 'blur(10px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ type: "spring", damping: 15, stiffness: 40, delay: 1.2 }}
                                className="relative"
                            >
                                {/* Impact Glow behind name */}
                                <motion.div
                                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full blur-[60px]"
                                    style={{ backgroundColor: activeTeam.color }}
                                />

                                <TvText
                                    variant="h1"
                                    className="text-[10vw] font-black italic uppercase leading-none drop-shadow-glow relative z-10"
                                    style={{ color: activeTeam.color }}
                                >
                                    {activeTeam.name}
                                </TvText>
                            </motion.div>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 800 }}
                                transition={{ duration: 3, delay: 1.5 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-tv-accent to-transparent mt-12"
                            />
                        </div>
                    </motion.div>

                    {/* Dramatic Background Sweep */}
                    <motion.div
                        initial={{ x: '-150%', skewX: -45, opacity: 0 }}
                        animate={{ x: '250%', skewX: -45, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                    />
                </motion.div>
            )
        }

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
                        initial={{ scale: 0.4, opacity: 0, filter: 'blur(40px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="text-center relative z-20"
                    >
                        <TvText variant="label" className="text-tv-accent text-xl tracking-[1.5em] uppercase mb-6 block opacity-40">STAGE PROGRESSION</TvText>

                        <div className="relative inline-block">
                            <TvText variant="h1" className="text-[clamp(5rem,15vw,10rem)] italic font-black uppercase tracking-[0.2em] text-white">
                                ROUND {currentRound}
                            </TvText>

                            {/* Scanning line across text */}
                            <motion.div
                                animate={{ y: ['-20%', '120%'], opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 right-0 h-1 bg-tv-accent shadow-[0_0_20px_#00E5FF] z-30"
                            />
                        </div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 4, delay: 0.5 }}
                            className="h-2 bg-gradient-to-r from-transparent via-tv-accent to-transparent mt-6 mx-auto shadow-glow shadow-tv-accent/50"
                        />

                        <motion.div
                            initial={{ x: '-100vw', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 2, type: 'spring', damping: 15 }}
                            className="mt-[10vh] px-20 py-6 border-l-8 bg-white/5 backdrop-blur-xl flex items-center gap-10"
                            style={{ borderColor: activeTeam?.color || '#00E5FF' }}
                        >
                            <TvText variant="h2" className="text-4xl uppercase tracking-[0.5em] opacity-40">ACTIVE OPERATIVE</TvText>
                            <TvText variant="h1" className="text-7xl font-black uppercase text-white tracking-widest" style={{ color: activeTeam?.color }}>
                                {activeTeam?.name}
                            </TvText>
                        </motion.div>
                    </motion.div>

                    {/* Heavy Atmospheric Pulse */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute inset-0 bg-tv-accent rounded-full blur-[120px] pointer-events-none"
                    />
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
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 z-[100] bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Deep Space Warp Pulse */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)]" />

                    {/* Warp Speed Background Rings - Staggered & Faster */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 6], opacity: [0, 0.4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "circOut" }}
                            className="absolute border border-tv-accent/40 rounded-full w-96 h-96"
                        />
                    ))}

                    <motion.div
                        initial={{ scale: 0.7, opacity: 0, filter: 'blur(30px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="text-center z-10"
                    >
                        <div className="flex flex-col items-center mb-16">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 300 }}
                                transition={{ duration: 3 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-tv-accent to-transparent mb-6"
                            />
                            <TvText variant="label" className="text-tv-accent text-2xl tracking-[1.5em] uppercase mb-4 opacity-60">SYSTEM INITIALIZATION</TvText>
                            <TvText variant="h1" className="text-6xl tracking-[0.4em] uppercase font-black italic text-white shadow-glow">NEURAL LINK ESTABLISHED</TvText>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 600 }}
                                transition={{ duration: 3, delay: 0.5 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-tv-accent to-transparent mt-6"
                            />
                        </div>

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1, duration: 1.5, type: "spring" }}
                            className="relative"
                        >
                            <TvText variant="h2" className="text-tv-accent/50 text-xl tracking-[0.8em] mb-4 block animate-pulse">SYNCHRONIZING SYSTEM VECTORS</TvText>

                            {/* Data Stream Counter (Fake) */}
                            <div className="flex gap-4 justify-center mt-8">
                                {[...Array(4)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-12 h-1.5 bg-tv-accent rounded-sm shadow-glow"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Final Scanline Sweep */}
                    <motion.div
                        initial={{ x: '-150%', skewX: -45 }}
                        animate={{ x: '250%', skewX: -45 }}
                        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                        className="absolute inset-x-0 h-full w-[20%] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
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
                        key={`engagement-${currentQuestion.id}`}
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
            setTimeout(() => setStage(2), 1200),  // Mission Complete Banner
            setTimeout(() => setStage(3), 3200),  // Winner Name + Neon Pulsing Frame
            setTimeout(() => setStage(4), 5200),  // Stats Panel + Trophy
            setTimeout(() => setStage(5), 7500),  // Session Finality
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <motion.div
            key="winner-mega"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-x-0 bottom-0 h-[70vh]"
                    style={{ background: `radial-gradient(circle at center, ${winner.color}33 0%, transparent 70%)` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />
            </div>

            <AnimatePresence mode="wait">
                {stage === 1 && (
                    <motion.div
                        key="s1"
                        initial={{ opacity: 0, scale: 0.8, letterSpacing: '4em' }}
                        animate={{ opacity: 1, scale: 1, letterSpacing: '1em' }}
                        exit={{ opacity: 0, scale: 2, filter: 'blur(60px)' }}
                        transition={{ duration: 1 }}
                        className="text-center"
                    >
                        <TvText variant="h1" className="text-8xl font-black italic text-tv-accent drop-shadow-glow">MISSION COMPLETE</TvText>
                    </motion.div>
                )}

                {stage >= 2 && (
                    <motion.div
                        key="winner-main-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center z-20 w-full px-20 max-w-screen-2xl"
                    >
                        {/* Winner Reveal Slam */}
                        <motion.div
                            initial={{ scale: 1.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                            className="relative mb-16"
                        >
                            {/* Neon Boundary Frame */}
                            <motion.div
                                animate={{
                                    opacity: [0.2, 1, 0.2],
                                    borderColor: [winner.color, '#FFFFFF', winner.color],
                                    boxShadow: [`0 0 20px ${winner.color}33`, `0 0 60px ${winner.color}66`, `0 0 20px ${winner.color}33`]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -inset-x-24 -inset-y-12 border-2 rounded-[5rem] pointer-events-none hidden lg:block"
                            />

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 1 }}
                                className="text-center"
                            >
                                <TvText variant="h2" className="text-2xl tracking-[2.5em] text-tv-accent mb-8 uppercase">DOMINANT OPERATIVE</TvText>
                            </motion.div>

                            <TvText
                                variant="h1"
                                className="text-[14vw] font-black italic text-white leading-none text-center select-none uppercase drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                                style={{ textShadow: `0 0 40px ${winner.color}99` }}
                            >
                                {winner.name}
                            </TvText>
                        </motion.div>

                        {/* ANALYTICS DASHBOARD */}
                        <div className="flex items-center justify-between w-full gap-24 h-[35vh]">
                            {stage >= 4 && (
                                <>
                                    {/* Stats Hologram (Left) */}
                                    <motion.div
                                        initial={{ x: -200, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="flex-1 bg-white/[0.03] backdrop-blur-2xl border-l-4 border-tv-accent rounded-3xl p-10 relative"
                                    >
                                        <div className="space-y-10">
                                            <div className="flex justify-between items-baseline border-b border-white/10 pb-4">
                                                <TvText variant="label" className="text-white/30 uppercase tracking-[0.5em] text-xs">Accumulated Intel</TvText>
                                                <TvText variant="h1" className="text-5xl font-bold text-white italic">{winner.score} <span className="text-base font-light tracking-widest text-[#00E5FF]">PTS</span></TvText>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <TvText variant="label" className="text-white/30 uppercase tracking-[0.5em] text-xs">Sector Status</TvText>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-3 h-3 rounded-full bg-tv-success shadow-[0_0_15px_#00E676] animate-pulse" />
                                                    <TvText variant="h2" className="text-4xl font-black text-tv-success">SECURED</TvText>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Trophy Core */}
                                    <motion.div
                                        initial={{ scale: 0, rotateZ: -180 }}
                                        animate={{ scale: 1, rotateZ: 0 }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        className="relative shrink-0"
                                    >
                                        <motion.div
                                            animate={{ rotateY: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <Trophy size={260} className="text-[#FFD700] drop-shadow-[0_0_80px_rgba(255,215,0,0.9)]" />
                                        </motion.div>

                                        <motion.div
                                            animate={{ rotate: 360, skewX: [5, -5, 5] }}
                                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 border-2 border-dashed border-tv-accent/30 rounded-full scale-[1.8]"
                                        />
                                    </motion.div>

                                    {/* Ranking Display (Right) */}
                                    <motion.div
                                        initial={{ x: 200, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="flex-1 bg-white/[0.03] backdrop-blur-2xl border-r-4 border-tv-accent rounded-3xl p-10 flex flex-col justify-center items-center"
                                    >
                                        <TvText variant="label" className="text-white/30 uppercase tracking-[1em] text-xs mb-4">Final Protocol</TvText>
                                        <TvText variant="h1" className="text-8xl font-black text-white italic tracking-tighter drop-shadow-glow">RANK #1</TvText>
                                        <div className="mt-8 flex gap-2">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-4 h-1 bg-tv-accent/40 rounded-full" />
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NEON DATA STREAM */}
            {stage >= 3 && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    {[...Array(80)].map((_, i) => (
                        <motion.div
                            key={`str-${i}`}
                            initial={{ y: -100, x: `${Math.random() * 100}%`, opacity: 0 }}
                            animate={{
                                y: '120vh',
                                opacity: [0, 0.8, 0.8, 0],
                                height: [40, 100, 40]
                            }}
                            transition={{
                                duration: 1.5 + Math.random() * 2,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: Math.random() * 3
                            }}
                            className="absolute flex flex-col items-center"
                        >
                            <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-current to-transparent"
                                style={{ color: i % 4 === 0 ? winner.color : '#00E5FF' }} />
                        </motion.div>
                    ))}
                </div>
            )}

            {stage >= 5 && (
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-10 z-30 w-full"
                >
                    <div className="flex flex-col items-center">
                        <motion.div
                            animate={{ opacity: [0.1, 0.6, 0.1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="h-[1px] w-[90vw] bg-gradient-to-r from-transparent via-tv-accent to-transparent mb-8"
                        />
                        <div className="flex gap-20">
                            <TvText variant="label" className="tracking-[1.2em] uppercase text-[10px] text-white/20">Neural Handshake Finalized</TvText>
                            <div className="w-2 h-2 rounded-full bg-tv-accent animate-pulse" />
                            <TvText variant="label" className="tracking-[1.2em] uppercase text-[10px] text-white/20">Session Narrative Archived</TvText>
                        </div>
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
