import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore, Team } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { TrophyStage3D } from './TrophyStage3D'
import confetti from 'canvas-confetti'

interface CinematicWinnerScreenProps {
    winner: Team
}

function ScoreReader({ to, color }: { to: number, color: string }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let startTime: number;
        let animationFrameId: number;
        const duration = 30000;

        const countUp = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
            setCount(Math.round(easeOutQuart * to));

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(countUp);
            }
        };
        animationFrameId = requestAnimationFrame(countUp);

        return () => cancelAnimationFrame(animationFrameId);
    }, [to]);

    return <TvText variant="h2" className="font-bold text-[clamp(2rem,6vh,4rem)]" style={{ color }}>{count}</TvText>
}

function DOMExplosion({ color }: { color: string }) {
    const particles = Array.from({ length: 60 });
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {particles.map((_, i) => {
                const angle = (Math.PI * 2 * i) / particles.length;
                const radius = 600 + Math.random() * 800;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                        animate={{
                            x, y,
                            scale: Math.random() * 3 + 1,
                            opacity: 0,
                            rotate: (Math.random() - 0.5) * 1080
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute w-8 h-8 shadow-[0_0_30px_rgba(255,0,0,0.8)]"
                        style={{ backgroundColor: color, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    />
                )
            })}
        </div>
    )
}

export function CinematicWinnerScreen({ winner }: CinematicWinnerScreenProps) {
    const { teams, cinematicStage, setCinematicStage } = useQuizStore()

    const [localStage, setLocalStage] = useState(cinematicStage > 0 ? cinematicStage : 1)
    const [eliminatedSpotlight, setEliminatedSpotlight] = useState<Team | null>(null)
    const [top3RevealStage, setTop3RevealStage] = useState(0)
    const [championRevealState, setChampionRevealState] = useState<'text' | 'silence' | 'name'>('text')

    const sortedTeams = useMemo(() => [...teams].sort((a, b) => b.score - a.score), [teams])
    const eliminatedTeams = useMemo(() => teams.filter(t => t.isEliminated), [teams])
    const top3 = useMemo(() => sortedTeams.slice(0, 3), [sortedTeams])

    const [runId, setRunId] = useState(Date.now())

    useEffect(() => {
        if (cinematicStage === 1 && localStage !== 1) {
            setRunId(Date.now())
        }
    }, [cinematicStage, localStage])

    useEffect(() => {
        if (cinematicStage === 0) setCinematicStage(1)
        let isMounted = true

        const runSequence = async () => {
            setLocalStage(1)
            setTop3RevealStage(0)
            setChampionRevealState('text')

            // Stage 1 (0-5s)
            await new Promise(r => setTimeout(r, 5000))
            if (!isMounted) return
            setLocalStage(2)
            setCinematicStage(2)

            // Stage 2: Contextualizing from 5s to 35s (30 seconds count-up)
            await new Promise(r => setTimeout(r, 30000))
            if (!isMounted) return
            setLocalStage(3)
            setCinematicStage(3)

            // Stage 3: Eliminations Memories 35s-45s (10s)
            if (eliminatedTeams.length > 0) {
                const spotlightTime = 10000 / eliminatedTeams.length
                for (let i = 0; i < eliminatedTeams.length; i++) {
                    if (!isMounted) return
                    setEliminatedSpotlight(eliminatedTeams[i])
                    await new Promise(r => setTimeout(r, spotlightTime))
                }
            } else {
                await new Promise(r => setTimeout(r, 10000))
            }

            if (!isMounted) return

            // Stage 3.5: Pre-Stage 4 Announcing Runners Up (45-60s)
            if (teams.length >= 3 && top3.length >= 3) {
                setLocalStage(3.5)
                setCinematicStage(3)
                await new Promise(r => setTimeout(r, 5000))
                if (!isMounted) return
                setTop3RevealStage(1)

                await new Promise(r => setTimeout(r, 5000))
                if (!isMounted) return
                setTop3RevealStage(2)

                await new Promise(r => setTimeout(r, 5000))
                if (!isMounted) return
            }

            // Stage 4: Pitch Black Screen
            setLocalStage(4)
            setCinematicStage(4)
            setChampionRevealState('text')

            await new Promise(r => setTimeout(r, 5000))
            if (!isMounted) return
            setChampionRevealState('silence')

            await new Promise(r => setTimeout(r, 3000))
            if (!isMounted) return
            setChampionRevealState('name')

            await new Promise(r => setTimeout(r, 7000))
            if (!isMounted) return

            // Stage 5: Massive Golden 3D Trophy
            setLocalStage(5)
            setCinematicStage(5)
        }

        runSequence()

        return () => { isMounted = false }
    }, [runId, teams.length, eliminatedTeams.length, top3.length])

    useEffect(() => {
        if (localStage === 5) {
            const interval = setInterval(() => {
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: ['#FFD700', '#FFFFFF', '#FFA500', winner.color]
                })
            }, 4000)
            return () => clearInterval(interval)
        }
    }, [localStage, winner.color])

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden select-none">
            <AnimatePresence mode="wait">
                {localStage === 1 && (
                    <motion.div
                        key="stage1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-20"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1b1b3a_0%,#000000_80%)] opacity-80" />
                        <motion.div
                            initial={{ y: 50, opacity: 0, letterSpacing: '2em' }}
                            animate={{ y: 0, opacity: 1, letterSpacing: 'normal' }}
                            transition={{ duration: 4, ease: 'easeOut' }}
                            className="text-center z-10"
                        >
                            <TvText variant="h2" className="text-tv-textMuted tracking-[1em] mb-4 text-sm font-light uppercase">
                                The Simulation Has Ended
                            </TvText>
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                                <TvText variant="h1" className="text-white text-[5vw] font-black uppercase tracking-widest drop-shadow-glow">
                                    CALCULATING OUTCOME
                                </TvText>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}

                {localStage === 2 && (
                    <motion.div
                        key="stage2"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-10 bg-[#02040a]"
                    >
                        <TvText variant="label" className="text-tv-accent tracking-[1em] mb-12 animate-pulse text-2xl">VERIFYING INTEL</TvText>

                        <div className="w-full max-w-7xl h-[60vh] flex items-end justify-center gap-[2vw] border-b-2 border-white/20 pb-4 relative">
                            {teams.map(t => {
                                const finalScore = t.score;
                                const maxScore = Math.max(10, ...teams.map(team => team.score));
                                const heightPercent = Math.max(5, (finalScore / maxScore) * 100);

                                return (
                                    <div key={t.id} className="flex-1 flex flex-col items-center justify-end h-full">
                                        <motion.div
                                            initial={{ height: '5%' }}
                                            animate={{ height: `${heightPercent}%` }}
                                            transition={{ duration: 30, ease: [0.25, 1, 0.5, 1] }}
                                            className="w-full relative bg-white/10 rounded-t-lg"
                                            style={{
                                                backgroundColor: `${t.color}33`,
                                                borderTop: `6px solid ${t.color}`,
                                                boxShadow: `0 -10px 40px -10px ${t.color}`
                                            }}
                                        >
                                            <div className="absolute -top-16 left-0 w-full text-center drop-shadow-glow">
                                                <ScoreReader to={finalScore} color={t.color} />
                                            </div>
                                        </motion.div>
                                        <TvText variant="label" className="mt-4 text-sm uppercase opacity-60 tracking-wider truncate w-full text-center text-white">
                                            {t.name}
                                        </TvText>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {localStage === 3 && (
                    <motion.div
                        key="stage3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: 'blur(20px)' }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden"
                    >
                        <AnimatePresence mode="popLayout">
                            {eliminatedSpotlight && (
                                <motion.div
                                    key={eliminatedSpotlight.id}
                                    initial={{ scale: 0.5, rotateX: 60, opacity: 0, filter: 'blur(20px)' }}
                                    animate={{ scale: 1, rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ scale: 2.5, opacity: 0, rotateZ: 45, filter: 'blur(20px)', transition: { duration: 1 } }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                                    className="relative flex flex-col items-center z-10 bg-black/60 p-20 rounded-[3rem] border-2 border-tv-danger backdrop-blur-3xl shadow-[0_0_150px_rgba(255,0,0,0.3)]"
                                >
                                    <DOMExplosion color={eliminatedSpotlight.color} />
                                    <div className="w-1 h-48 bg-gradient-to-t from-tv-danger to-transparent mb-8 absolute -top-48 shadow-[0_0_20px_#ff0000]" />
                                    <TvText variant="h1" className="text-[3rem] text-tv-danger tracking-[0.4em] font-light italic mb-8 uppercase text-center animate-pulse">
                                        HONORABLE DISCHARGE
                                    </TvText>
                                    <TvText variant="h2" className="text-[8rem] font-black text-white drop-shadow-[0_0_80px_#ff0000] leading-none mb-6">
                                        {eliminatedSpotlight.name}
                                    </TvText>
                                    <TvText variant="label" className="text-tv-danger font-mono text-3xl tracking-[0.5em] font-bold">
                                        FINAL INTEL: {eliminatedSpotlight.score}
                                    </TvText>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {localStage === 3.5 && (
                    <motion.div
                        key="stage35"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-20 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]"
                    >
                        <div className="flex items-end justify-center w-full gap-20 h-[70vh] max-w-6xl">
                            {top3[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 150, filter: 'blur(10px)' }}
                                    animate={{
                                        opacity: top3RevealStage >= 1 ? 1 : 0,
                                        y: top3RevealStage >= 1 ? 0 : 150,
                                        filter: top3RevealStage >= 1 ? 'blur(0px)' : 'blur(10px)'
                                    }}
                                    transition={{ type: 'spring', damping: 20 }}
                                    className="flex flex-col items-center flex-1"
                                >
                                    <TvText variant="h2" className="text-[#CD7F32] font-black text-[5rem] mb-6 drop-shadow-[0_0_40px_rgba(205,127,50,0.8)]">3RD RANKING</TvText>
                                    <div className="w-full h-[40vh] bg-gradient-to-t from-[#CD7F32]/80 via-[#CD7F32]/20 to-transparent border-t-8 border-[#CD7F32] flex flex-col items-center justify-end relative pb-10 shadow-[0_-20px_50px_rgba(205,127,50,0.2)]">
                                        <TvText variant="h2" className="absolute -top-32 text-[4rem] text-white break-words text-center px-4 w-full drop-shadow-[0_0_20px_#000]">{top3[2].name}</TvText>
                                        <TvText variant="h1" className="text-[6rem] font-bold opacity-80 text-white drop-shadow-md">{top3[2].score} PTS</TvText>
                                    </div>
                                </motion.div>
                            )}

                            {top3[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 150, filter: 'blur(10px)' }}
                                    animate={{
                                        opacity: top3RevealStage >= 2 ? 1 : 0,
                                        y: top3RevealStage >= 2 ? 0 : 150,
                                        filter: top3RevealStage >= 2 ? 'blur(0px)' : 'blur(10px)'
                                    }}
                                    transition={{ type: 'spring', damping: 20 }}
                                    className="flex flex-col items-center flex-1"
                                >
                                    <TvText variant="h2" className="text-[#C0C0C0] font-black text-[6rem] mb-6 drop-shadow-[0_0_50px_rgba(192,192,192,0.8)]">2ND RANKING</TvText>
                                    <div className="w-full h-[50vh] bg-gradient-to-t from-[#C0C0C0]/80 via-[#C0C0C0]/20 to-transparent border-t-8 border-[#C0C0C0] flex flex-col items-center justify-end relative pb-10 shadow-[0_-20px_60px_rgba(192,192,192,0.2)]">
                                        <TvText variant="h2" className="absolute -top-32 text-[5rem] text-white break-words text-center px-4 w-full drop-shadow-[0_0_20px_#000]">{top3[1].name}</TvText>
                                        <TvText variant="h1" className="text-[7rem] font-bold opacity-80 text-white drop-shadow-md">{top3[1].score} PTS</TvText>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {localStage === 4 && (
                    <motion.div
                        key="stage4"
                        className="absolute inset-0 bg-black flex items-center justify-center p-10"
                    >
                        <AnimatePresence>
                            {championRevealState === 'text' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                                    transition={{ duration: 4, ease: "easeOut" }}
                                    className="text-center"
                                >
                                    <TvText variant="h1" className="text-white text-[6vw] font-light tracking-[0.2em] leading-[1.8]">
                                        And the Undefeated....<br />
                                        <span className="font-black italic drop-shadow-glow">The Champion is.....</span>
                                    </TvText>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {championRevealState === 'silence' && (
                            <div className="absolute inset-0 bg-black z-50 pointer-events-none" />
                        )}

                        <AnimatePresence>
                            {championRevealState === 'name' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 3, filter: 'blur(50px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 1, type: 'spring', damping: 12, stiffness: 40 }}
                                    className="text-center w-full z-10"
                                >
                                    <TvText variant="h1" className="text-[14vw] font-black italic tracking-tighter text-white drop-shadow-[0_0_120px_rgba(255,255,255,1)] leading-none uppercase break-words px-8">
                                        {winner.name}
                                    </TvText>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {localStage === 5 && (
                    <motion.div
                        key="stage5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 3 }}
                        className="absolute inset-0 flex flex-col"
                    >
                        <div className="absolute inset-0 z-0 bg-black" />

                        <div className="absolute inset-0 z-10">
                            <TrophyStage3D />
                        </div>

                        <div className="relative z-20 flex-1 flex flex-col p-[4vw] pointer-events-none pb-[8vw]">
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1, duration: 2 }}
                                className="text-center"
                            >
                                <TvText variant="h2" className="text-[#FFD700] tracking-[1.5em] mb-8 text-3xl font-black uppercase drop-shadow-[0_0_30px_#ccaa00]">SUPREME CHAMPION</TvText>
                                <TvText variant="h1" className="text-[12vw] font-black italic drop-shadow-[0_0_60px_rgba(255,215,0,0.6)] leading-none text-white border-white">
                                    {winner.name}
                                </TvText>
                            </motion.div>

                            <div className="flex-1 flex items-end justify-between w-full max-w-[90vw] mx-auto opacity-90">
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 2, duration: 1.5 }}
                                    className="bg-black/60 backdrop-blur-xl border border-[#FFD700]/30 rounded-[2rem] p-10 shadow-[0_0_40px_rgba(255,215,0,0.1)]"
                                >
                                    <TvText variant="label" className="text-[#FFD700] uppercase tracking-widest text-sm mb-2 block">Accumulated Intel</TvText>
                                    <TvText variant="h1" className="text-7xl font-bold text-white">{winner.score} <span className="text-3xl text-tv-accent">PTS</span></TvText>
                                </motion.div>

                                <motion.div
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 2, duration: 1.5 }}
                                    className="bg-black/60 backdrop-blur-xl border border-[#FFD700]/30 rounded-[2rem] p-10 text-right shadow-[0_0_40px_rgba(255,215,0,0.1)]"
                                >
                                    <TvText variant="label" className="text-[#FFD700] uppercase tracking-widest text-sm mb-2 block">Global Ranking</TvText>
                                    <TvText variant="h1" className="text-8xl font-black text-[#FFD700] drop-shadow-[0_0_30px_#FFD700]">#1</TvText>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
