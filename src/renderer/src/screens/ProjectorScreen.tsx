import React, { useEffect } from 'react'
import { useQuizStore } from '../store/useQuizStore'
import { TechCard } from '../components/ui/TechCard'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export function ProjectorScreen() {
    const { currentState, currentQuestion, teams, currentTeamIndex, timerRemaining } = useQuizStore()
    const activeTeam = teams.filter(t => !t.isEliminated)[currentTeamIndex]

    useEffect(() => {
        if (currentState === 'WINNER_FLOW') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00E5FF', '#FF3D00', '#00FF41']
            })
        }
    }, [currentState])

    return (
        <div className="h-full w-full bg-primary-bg overflow-hidden flex flex-col items-center justify-center p-20 relative font-inter">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#00E5FF_0%,transparent_70%)]" />
            </div>

            <AnimatePresence mode="wait">
                {currentState === 'IDLE' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="text-center"
                        key="idle"
                    >
                        <h1 className="text-9xl font-orbitron text-primary-accent mb-4 tracking-[0.2em] drop-shadow-[0_0_30px_rgba(0,229,255,0.5)]">
                            TECHVERSE
                        </h1>
                        <p className="text-3xl font-rajdhani text-primary-secondary tracking-[1em] uppercase">
                            Quiz Arena // Initialization
                        </p>
                    </motion.div>
                )}

                {currentState === 'SIMULATION_PREPARATION' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center space-y-12"
                        key="prep"
                    >
                        <h2 className="text-6xl font-orbitron text-primary-text uppercase tracking-widest">Prepare for Battle</h2>
                        <div className="flex gap-12 justify-center">
                            {teams.map((team) => (
                                <TechCard key={team.id} className="p-8 w-64 border-2" style={{ borderColor: team.color }}>
                                    <div className="text-2xl font-orbitron mb-2" style={{ color: team.color }}>{team.name}</div>
                                    <div className="h-1 w-full bg-primary-surface mt-4 overflow-hidden">
                                        <div className="h-full animate-pulse" style={{ backgroundColor: team.color, width: '100%' }} />
                                    </div>
                                </TechCard>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentState === 'QUESTION_DISPLAY' && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-6xl space-y-12"
                        key="question"
                    >
                        {/* Timer and Active Team */}
                        <div className="flex justify-between items-end border-b border-primary-surface pb-6">
                            <div className="space-y-2">
                                <div className="text-sm font-rajdhani text-primary-secondary uppercase tracking-[0.5em]">Active Team</div>
                                <div className="text-4xl font-orbitron" style={{ color: activeTeam?.color }}>{activeTeam?.name}</div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="text-sm font-rajdhani text-primary-secondary uppercase tracking-[0.5em]">Time Remaining</div>
                                <div className={`text-7xl font-orbitron ${timerRemaining < 10 ? 'text-team-red animate-pulse' : 'text-primary-accent'}`}>
                                    {timerRemaining}s
                                </div>
                            </div>
                        </div>

                        {/* Question */}
                        <TechCard className="p-12" glow>
                            <h2 className="text-4xl leading-relaxed text-center font-bold">
                                {currentQuestion.question}
                            </h2>
                        </TechCard>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-8">
                            {Object.entries(currentQuestion.options).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="p-6 bg-primary-surface/30 border border-white/10 rounded-xl flex items-center gap-6"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary-accent/10 border border-primary-accent/30 flex items-center justify-center font-orbitron text-2xl text-primary-accent shrink-0">
                                        {key}
                                    </div>
                                    <div className="text-2xl text-primary-text">{value}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentState === 'LEADERBOARD' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="w-full max-w-4xl space-y-8"
                        key="leaderboard"
                    >
                        <h2 className="text-6xl font-orbitron text-center text-primary-text mb-12 tracking-widest">CURRENT STANDINGS</h2>
                        <div className="space-y-4">
                            {[...teams].sort((a, b) => b.score - a.score).map((team, index) => (
                                <motion.div
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={team.id}
                                    className="p-6 bg-primary-surface/40 border border-white/10 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="text-4xl font-orbitron text-primary-secondary w-12">{index + 1}</div>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                                        <div className="text-3xl font-orbitron text-primary-text">{team.name}</div>
                                    </div>
                                    <div className="text-4xl font-orbitron text-primary-accent">{team.score} PTS</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentState === 'WINNER_FLOW' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-12"
                        key="winner"
                    >
                        <div className="relative inline-block">
                            <h2 className="text-8xl font-orbitron text-primary-accent tracking-tighter mb-4 drop-shadow-[0_0_50px_rgba(0,229,255,0.6)]">
                                CHAMPIONS
                            </h2>
                            <div className="absolute -top-12 -right-12 text-6xl animate-bounce">🏆</div>
                        </div>

                        {(() => {
                            const winner = [...teams].sort((a, b) => b.score - a.score)[0]
                            return (
                                <TechCard className="p-16 border-4" style={{ borderColor: winner.color }} glow>
                                    <h3 className="text-7xl font-orbitron mb-4" style={{ color: winner.color }}>{winner.name}</h3>
                                    <p className="text-3xl font-rajdhani text-primary-secondary tracking-widest uppercase">Final Score: {winner.score} Points</p>
                                </TechCard>
                            )
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Bar: Scoreboard Mini */}
            {currentState !== 'IDLE' && currentState !== 'WINNER_FLOW' && (
                <div className="absolute bottom-0 left-0 w-full p-8 flex justify-center gap-12 bg-black/40 backdrop-blur-md border-t border-white/5">
                    {teams.map(team => (
                        <div key={team.id} className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                            <span className="font-rajdhani text-lg text-primary-text uppercase tracking-widest">{team.name}</span>
                            <span className="font-orbitron text-xl text-primary-accent">{team.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
