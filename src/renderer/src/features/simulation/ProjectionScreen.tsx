import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import { PickNumberGrid } from './PickNumberGrid'
import { Trophy } from 'lucide-react'
import { cn } from '../../utils/cn'

export function ProjectionScreen() {
    const {
        currentState,
        teams,
        currentRound,
        currentTeamId,
        currentQuestion,
        timerRemaining,
        config
    } = useQuizStore()

    const activeTeam = teams.find(t => t.id === currentTeamId)
    const winner = currentState === 'WINNER' ? [...teams].sort((a, b) => b.score - a.score)[0] : null

    return (
        <div className="h-screen w-screen bg-[#050505] overflow-hidden flex flex-col font-rajdhani text-white relative">
            {/* Cinematic Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            <AnimatePresence mode="wait">
                {/* IDLE / START SCREEN */}
                {currentState === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center"
                    >
                        <TvText variant="h1" className="text-8xl tracking-[0.5em] font-black italic opacity-20">TECHVERSE</TvText>
                        <TvText variant="h2" className="text-4xl tracking-[1em] uppercase opacity-10">Quiz Arena</TvText>
                    </motion.div>
                )}

                {/* PICKER PHASE */}
                {currentState === 'PICKER_PHASE' && (
                    <motion.div
                        key="picker"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="w-full h-full flex items-center justify-center p-20">
                            <PickNumberGrid isAdmin={false} />
                        </div>
                    </motion.div>
                )}

                {/* QUESTION / ANSWER REVEAL PHASE */}
                {(currentState === 'QUESTION' || currentState === 'ANSWER_REVEAL') && currentQuestion && (
                    <motion.div
                        key="engagement"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.6, ease: "backOut" }}
                        className="flex-1 flex flex-col p-20 z-10"
                    >
                        {/* TEAM NAME HEADER */}
                        <header className="flex flex-col items-center mb-20">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="max-w-xl h-[4px] relative mb-4"
                                style={{ backgroundColor: activeTeam?.color }}
                            >
                                <div className="absolute inset-0 blur-lg" style={{ backgroundColor: activeTeam?.color }} />
                            </motion.div>
                            <TvText variant="h1" className="text-[64px] font-black uppercase tracking-widest drop-shadow-glow" style={{ color: activeTeam?.color }}>
                                {activeTeam?.name}
                            </TvText>
                        </header>

                        {/* QUESTION TEXT */}
                        <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto text-center gap-24">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative py-10 px-20"
                            >
                                <TvText variant="h2" className="text-[56px] leading-[1.2] font-semibold text-white/90">
                                    {currentQuestion.question}
                                </TvText>
                            </motion.div>

                            {/* OPTION GRID */}
                            <div className="grid grid-cols-2 gap-10 w-full px-20">
                                {(['A', 'B', 'C', 'D'] as const).map((key, idx) => (
                                    <ProjectionOption
                                        key={key}
                                        label={key}
                                        text={currentQuestion.options[key]}
                                        isCorrect={currentQuestion.answer === key}
                                        isRevealed={currentState === 'ANSWER_REVEAL'}
                                        index={idx}
                                        teamColor={activeTeam?.color}
                                    />
                                ))}
                            </div>
                        </main>

                        {/* TIMER RING */}
                        {currentState === 'QUESTION' && (
                            <footer className="flex flex-col items-center mt-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="relative"
                                >
                                    <TvProgressRing
                                        duration={config?.timerSeconds || 30}
                                        remaining={timerRemaining}
                                        size={120}
                                        strokeWidth={10}
                                        colorOverride={activeTeam?.color}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TvText variant="h1" className="text-4xl font-black">{timerRemaining}</TvText>
                                    </div>
                                </motion.div>
                            </footer>
                        )}
                    </motion.div>
                )}

                {/* ELIMINATION SCREEN */}
                {currentState === 'ELIMINATION' && (
                    <motion.div
                        key="elimination"
                        initial={{ opacity: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="bg-tv-panel p-20 border border-tv-danger/50 rounded-2xl shadow-[0_0_100px_rgba(255,61,0,0.2)] text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-tv-danger/5 opacity-10 animate-pulse" />
                            <TvText variant="h1" className="text-[80px] text-tv-danger font-black italic tracking-tighter mb-4">
                                ELIMINATED
                            </TvText>
                            <div className="h-1 w-full bg-tv-danger/50 mb-8" />
                            <TvText variant="h2" className="text-5xl uppercase tracking-widest text-white">
                                {activeTeam?.name}
                            </TvText>
                        </motion.div>
                    </motion.div>
                )}

                {/* WINNER SCREEN */}
                {currentState === 'WINNER' && winner && (
                    <motion.div
                        key="winner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
                    >
                        {/* Spotlight */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.2)_0%,transparent_50%)] animate-pulse" />

                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="text-center relative z-10"
                        >
                            <motion.div
                                animate={{ rotateY: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="mb-12"
                            >
                                <Trophy size={180} className="text-tv-accent mx-auto drop-shadow-[0_0_40px_rgba(0,229,255,0.8)]" />
                            </motion.div>

                            <TvText variant="h1" className="text-8xl font-black italic tracking-tighter text-white mb-6 drop-shadow-glow">
                                CHAMPION
                            </TvText>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-2 bg-tv-accent mx-auto mb-10 overflow-hidden relative"
                            >
                                <div className="absolute inset-0 shadow-glow" />
                            </motion.div>

                            <TvText variant="h2" className="text-[120px] font-black uppercase text-tv-accent drop-shadow-glow">
                                {winner.name}
                            </TvText>
                        </motion.div>

                        {/* Particle Effects (Subtle) */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: "100%", x: `${Math.random() * 100}%`, opacity: 0 }}
                                    animate={{ y: "-10%", opacity: [0, 1, 0] }}
                                    transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
                                    className="absolute w-1 h-1 bg-tv-accent rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function ProjectionOption({ label, text, isCorrect, isRevealed, index, teamColor }: {
    label: string,
    text: string,
    isCorrect: boolean,
    isRevealed: boolean,
    index: number,
    teamColor?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{
                opacity: 1,
                x: 0,
                scale: isRevealed && isCorrect ? 1.1 : 1,
                borderColor: isRevealed && isCorrect ? '#00E676' : 'rgba(255,255,255,0.1)',
                backgroundColor: isRevealed && isCorrect ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255,255,255,0.03)'
            }}
            transition={{ delay: 0.5 + (index * 0.1), duration: 0.5 }}
            className={cn(
                "p-10 rounded-2xl border-4 text-left flex items-center gap-10 transition-all duration-700 backdrop-blur-sm relative overflow-hidden",
                isRevealed && !isCorrect ? "opacity-10 grayscale" : ""
            )}
        >
            {isRevealed && isCorrect && (
                <motion.div
                    layoutId="correct-glow"
                    className="absolute inset-0 bg-tv-success/20 blur-2xl pointer-events-none"
                />
            )}

            <div className={cn(
                "w-16 h-16 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-700",
                isRevealed && isCorrect ? "bg-tv-success text-black border-tv-success" : "bg-black/40 border-white/20 text-white/40"
            )}>
                <TvText variant="h1" className="text-4xl font-black">{label}</TvText>
            </div>

            <TvText variant="h2" className="text-[40px] font-bold text-white uppercase tracking-tight">
                {text}
            </TvText>
        </motion.div>
    )
}
