import React, { useEffect } from 'react'
import { useQuizStore } from '../store/useQuizStore'
import { TechCard } from '../components/ui/TechCard'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export function ProjectorScreen() {
    const { currentState, currentQuestion, teams, currentTeamId, timerRemaining, systemSettings } = useQuizStore()
    const activeTeam = teams.find(t => t.id === currentTeamId)

    useEffect(() => {
        if (currentState === 'WINNER') {
            confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#00E5FF', '#FF3D00', '#00FF41', '#FFD700']
            })
        }
    }, [currentState])

    return (
        <div className="h-full w-full bg-[#050A10] overflow-hidden flex flex-col items-center justify-center p-20 relative font-inter text-white">
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.1)_0%,transparent_70%)]" />
            </div>

            <AnimatePresence mode="wait">
                {currentState === 'IDLE' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="text-center z-10"
                        key="idle"
                    >
                        <h1 className="text-[12rem] font-orbitron text-[#00E5FF] mb-4 tracking-[0.3em] font-black drop-shadow-[0_0_50px_rgba(0,229,255,0.8)]">
                            {systemSettings?.organizationName?.toUpperCase() || 'COORDI.TECH'}
                        </h1>
                        <p className="text-4xl font-rajdhani text-white/40 tracking-[1.5em] uppercase font-bold">
                            // Neural Simulation Arena //
                        </p>
                        <p className="text-xl font-rajdhani text-[#00E5FF]/80 tracking-[0.5em] mt-8 uppercase text-center w-full">
                            Powered by Coordi.Tech
                        </p>
                    </motion.div>
                )}

                {currentState === 'ARMING' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="text-center space-y-16 z-10"
                        key="arming"
                    >
                        <h2 className="text-7xl font-orbitron text-white uppercase tracking-[0.5em] font-bold">SYSTEM ARMING</h2>
                        <div className="flex gap-16 justify-center">
                            {teams.map((team, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    key={team.id}
                                >
                                    <TechCard className="p-10 w-72 border-2" style={{ borderColor: team.color }}>
                                        <div className="text-3xl font-orbitron mb-4 font-bold" style={{ color: team.color }}>{team.name}</div>
                                        <div className="h-2 w-full bg-white/5 rounded-full mt-6 overflow-hidden">
                                            <div className="h-full animate-pulse" style={{ backgroundColor: team.color, width: '100%' }} />
                                        </div>
                                    </TechCard>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {(currentState === 'QUESTION' || currentState === 'ANSWER_REVEAL') && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        className="w-full max-w-7xl space-y-16 z-10"
                        key="question"
                    >
                        {/* Header: Team & Timer */}
                        <div className="flex justify-between items-end border-b-2 border-white/10 pb-8">
                            <div className="space-y-4">
                                <div className="text-2xl font-rajdhani text-white/50 uppercase tracking-[0.8em] font-bold">Current Team</div>
                                <div className="text-7xl font-orbitron font-black tracking-widest" style={{ color: activeTeam?.color, textShadow: `0 0 30px ${activeTeam?.color}66` }}>
                                    {activeTeam?.name}
                                </div>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="text-2xl font-rajdhani text-white/50 uppercase tracking-[0.8em] font-bold">Chronometer</div>
                                <div className={`text-9xl font-orbitron font-black ${timerRemaining < 10 ? 'text-[#FF3D00] animate-pulse' : 'text-[#00E5FF]'}`}>
                                    {String(timerRemaining).padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Question Panel */}
                        <TechCard className="p-20 bg-white/5 backdrop-blur-xl" glow>
                            <h2 className="text-6xl leading-[1.3] text-center font-bold tracking-tight">
                                {currentQuestion.question}
                            </h2>
                        </TechCard>

                        {/* Options Grid */}
                        <div className="grid grid-cols-2 gap-10">
                            {Object.entries(currentQuestion.options).map(([key, value]) => {
                                const isCorrect = currentState === 'ANSWER_REVEAL' && currentQuestion.answer === key
                                return (
                                    <motion.div
                                        key={key}
                                        animate={isCorrect ? { scale: [1, 1.05, 1], backgroundColor: 'rgba(0, 255, 65, 0.15)', borderColor: '#00FF41' } : {}}
                                        transition={isCorrect ? { repeat: Infinity, duration: 1.5 } : {}}
                                        className={`p-8 bg-white/5 border-2 rounded-2xl flex items-center gap-10 transition-colors ${isCorrect ? 'border-[#00FF41]' : 'border-white/10'}`}
                                    >
                                        <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center font-orbitron text-4xl font-bold shrink-0 ${isCorrect ? 'bg-[#00FF41] text-[#050A10] border-[#00FF41]' : 'bg-white/5 border-white/20 text-white/80'}`}>
                                            {key}
                                        </div>
                                        <div className="text-4xl font-medium tracking-wide">{value}</div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {currentState === 'LEADERBOARD' && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="w-full max-w-5xl space-y-12 z-10"
                        key="leaderboard"
                    >
                        <h2 className="text-8xl font-orbitron text-center text-white mb-20 tracking-[0.4em] font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">GLOBAL STANDINGS</h2>
                        <div className="space-y-6">
                            {[...teams].sort((a, b) => b.score - a.score).map((team, index) => (
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                                    key={team.id}
                                    className="p-8 bg-white/5 backdrop-blur-md border-2 border-white/10 rounded-3xl flex items-center justify-between shadow-2xl"
                                >
                                    <div className="flex items-center gap-12">
                                        <div className="text-6xl font-orbitron text-white/20 w-20 font-black">{index + 1}</div>
                                        <div className="w-8 h-8 rounded-full shadow-[0_0_20px_currentColor]" style={{ backgroundColor: team.color, color: team.color }} />
                                        <div className="text-5xl font-orbitron font-bold tracking-widest">{team.name}</div>
                                    </div>
                                    <div className="text-6xl font-orbitron text-[#00E5FF] font-black">{team.score} <span className="text-2xl text-white/30 ml-2">PX</span></div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentState === 'WINNER' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="text-center space-y-20 z-10"
                        key="winner"
                    >
                        <div className="relative">
                            <motion.h2
                                animate={{ scale: [1, 1.1, 1], textShadow: ['0 0 20px #00E5FF', '0 0 60px #00E5FF', '0 0 20px #00E5FF'] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-[14rem] font-orbitron text-[#00E5FF] tracking-tighter font-black"
                            >
                                ULTIMO
                            </motion.h2>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                                className="absolute -top-32 -right-32 text-[12rem] opacity-50 filter blur-[2px]"
                            >
                                🏆
                            </motion.div>
                        </div>

                        {(() => {
                            const winner = [...teams].sort((a, b) => b.score - a.score)[0]
                            return (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <TechCard className="p-24 border-8 bg-white/5 backdrop-blur-3xl" style={{ borderColor: winner.color }} glow>
                                        <h3 className="text-9xl font-orbitron mb-8 font-black tracking-widest" style={{ color: winner.color, textShadow: `0 0 50px ${winner.color}88` }}>{winner.name}</h3>
                                        <p className="text-5xl font-rajdhani text-white/50 tracking-[1.5em] uppercase font-bold">Champion of {systemSettings?.organizationName || 'Coordi.Tech'}</p>
                                    </TechCard>
                                </motion.div>
                            )
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Global Ticker */}
            {currentState !== 'IDLE' && currentState !== 'WINNER' && (
                <div className="absolute bottom-0 left-0 w-full p-10 flex justify-center gap-20 bg-black/60 backdrop-blur-3xl border-t border-white/5 z-20">
                    {teams.filter(t => !t.isEliminated).map(team => (
                        <div key={team.id} className="flex items-center gap-6 opacity-80">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: team.color, boxShadow: `0 0 15px ${team.color}` }} />
                            <span className="font-rajdhani text-2xl text-white font-bold uppercase tracking-[0.3em]">{team.name}</span>
                            <span className="font-orbitron text-3xl text-[#00E5FF] font-black">{team.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
