import React, { useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'framer-motion'
import { useQuizStore, Team } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { Trophy, Crown, Medal, Award } from 'lucide-react'
import { cn } from '../../utils/cn'

export function LeaderboardOverlay() {
    const { teams, uiOverlay } = useQuizStore()
    const isVisible = uiOverlay === 'leaderboard'

    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => b.score - a.score)
    }, [teams])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-[5vw] overflow-hidden"
                >
                    {/* CINEMATIC BACKGROUND ELEMENTS */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: '100%', opacity: [0, 0.2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-tv-accent/20 to-transparent skew-x-[-30deg]"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.1)_0%,transparent_70%)]" />
                    </div>

                    {/* HEADER SECTION */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
                        className="text-center mb-[6vh] relative"
                    >
                        <TvText variant="label" className="text-tv-accent tracking-[1.2em] uppercase mb-4 opacity-60">
                            NEURAL LINK STATUS
                        </TvText>
                        <TvText variant="h1" className="text-[clamp(3rem,8vw,6rem)] font-black italic uppercase tracking-tighter text-white drop-shadow-glow">
                            CURRENT STANDINGS
                        </TvText>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.8, duration: 1 }}
                            className="h-[4px] bg-tv-accent mt-4 shadow-glow"
                        />
                    </motion.div>

                    {/* LEADERBOARD LIST */}
                    <div className="w-full max-w-5xl space-y-4">
                        {sortedTeams.map((team, index) => (
                            <LeaderboardCard
                                key={team.id}
                                team={team}
                                rank={index + 1}
                                delay={0.5 + (index * 0.15)}
                            />
                        ))}
                    </div>

                    {/* FOOTER HINT (FOR ADMIN) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 2 }}
                        className="mt-[6vh]"
                    >
                        <TvText variant="label" className="text-[10px] tracking-[0.5em] uppercase">
                            MONITORING LIVE SCORE ARCHITECTURE
                        </TvText>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function LeaderboardCard({ team, rank, delay }: { team: Team, rank: number, delay: number }) {
    // Score count-up logic
    const [displayScore, setDisplayScore] = React.useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            const controls = animate(0, team.score, {
                duration: 1.5,
                onUpdate: (value) => setDisplayScore(Math.round(value)),
                ease: "easeOut"
            })
            return () => controls.stop()
        }, delay * 1000 + 400)

        return () => clearTimeout(timer)
    }, [team.score, delay])

    const isFirst = rank === 1
    const isSecond = rank === 2
    const isThird = rank === 3
    const isLast = !isFirst && !isSecond && !isThird && team.score < 10 // Arbitrary last place visual

    const RankIcon = () => {
        if (isFirst) return <Crown className="text-tv-accent group-hover:animate-bounce" size={32} />
        if (isSecond) return <Medal className="text-white/80" size={28} />
        if (isThird) return <Medal className="text-tv-accent/60" size={24} />
        return <Award size={20} className="opacity-20" />
    }

    return (
        <motion.div
            initial={{ x: -100, opacity: 0, skewX: -10 }}
            animate={{ x: 0, opacity: 1, skewX: 0 }}
            transition={{ delay, duration: 0.6, type: 'spring', damping: 15 }}
            className={cn(
                "group relative p-6 border-l-8 bg-white/5 backdrop-blur-md flex items-center justify-between transition-all duration-500",
                isFirst ? "bg-tv-accentSoft border-tv-accent shadow-[0_0_40px_-10px_rgba(0,229,255,0.3)] scale-[1.05] z-10" : "border-white/10 hover:bg-white/10",
                team.isEliminated && "grayscale opacity-30"
            )}
            style={{ borderLeftColor: isFirst ? '#00E5FF' : team.color }}
        >
            <div className="flex items-center gap-8">
                {/* RANK NUMBER */}
                <div className="relative flex items-center justify-center w-12 h-12">
                    <TvText variant="h2" className={cn(
                        "font-black italic text-4xl leading-none",
                        isFirst ? "text-tv-accent" : "text-white/40"
                    )}>
                        {rank}
                    </TvText>
                    {isFirst && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 border border-tv-accent/30 rounded-full border-dashed"
                        />
                    )}
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <RankIcon />
                        <TvText variant="h2" className={cn(
                            "font-black uppercase tracking-widest text-3xl",
                            isFirst ? "text-white drop-shadow-glow" : "text-white/90"
                        )}>
                            {team.name}
                        </TvText>
                    </div>
                    {isFirst && (
                        <TvText variant="label" className="text-tv-accent text-[10px] tracking-[0.4em] uppercase mt-1">
                            Current Dominant Operative
                        </TvText>
                    )}
                </div>
            </div>

            <div className="text-right">
                <motion.div className="flex items-baseline gap-2 justify-end">
                    <TvText variant="h1" className={cn(
                        "text-5xl font-black italic",
                        isFirst ? "text-tv-accent" : "text-white"
                    )}>
                        {displayScore}
                    </TvText>
                    <TvText variant="label" className="text-xs opacity-40">PTS</TvText>
                </motion.div>

                {/* PROGRESS BAR INDICATOR */}
                <div className="w-48 h-1 bg-white/5 mt-2 overflow-hidden rounded-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (team.score / 100) * 100)}%` }} // Scaling based on 100 as base
                        transition={{ delay: delay + 0.5, duration: 1.5, ease: "easeOut" }}
                        className="h-full"
                        style={{ backgroundColor: isFirst ? '#00E5FF' : team.color }}
                    />
                </div>
            </div>

            {/* Shine Sweep on Cards */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isFirst ? ['100%', '-100%', '100%'] : '100%' }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
            />
        </motion.div>
    )
}
