import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { audioEngine } from './AudioEngine'

// Component to render a team name with the "Team" label above it
// MOVED OUTSIDE to prevent re-mounting on state updates (fixes "jumping" animation)
const TeamDisplay = ({ team, isLeft }: { team: any, isLeft: boolean }) => {
    const hasTeamPrefix = team.name.toUpperCase().startsWith('TEAM ')
    const displayName = hasTeamPrefix ? team.name.substring(5).trim() : team.name
    const align = isLeft ? "right" : "left"

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center px-8 border-b-4 pb-4 min-w-0"
            style={{ borderColor: team.color }}
        >
            <TvText
                variant="label"
                align="center"
                className="text-[clamp(1.2rem,1.8vw,2.5rem)] font-bold italic tracking-[0.4em] mb-1 opacity-60 text-center"
                style={{ color: team.color }}
            >
                TEAM
            </TvText>

            <TvText
                variant="h1"
                align="center"
                className="text-[clamp(2.5rem,5.5vw,9rem)] font-black italic leading-[0.9] text-white uppercase break-words w-full text-center"
            >
                {displayName}
            </TvText>
        </motion.div>
    )
}

export function ProjectionStandbyScreen() {
    const { teams, config, setupDraft, currentState, systemSettings } = useQuizStore()

    // Fallback to setupDraft if config isn't fully locked yet
    const activeConfig = config || setupDraft.config
    const activeTeams = teams?.length > 0 ? teams : (setupDraft.teams as any)

    // CYCLING PAIR LOGIC
    const [pairIndex, setPairIndex] = React.useState(0)

    const pairs = React.useMemo(() => {
        if (!activeTeams || activeTeams.length < 2) return []
        // Ensure stable team data
        const result: any[][] = []
        for (let i = 0; i < activeTeams.length; i++) {
            const t1 = activeTeams[i]
            const t2 = activeTeams[(i + 1) % activeTeams.length]
            if (t1 && t2) result.push([t1, t2])
        }
        return result
    }, [activeTeams.map((t: any) => t?.id).join(',')])

    useEffect(() => {
        // Play "The Wait" BGM directly here — this is the VS animation screen
        // Using switchBgm ensures clean crossfade from mainBgm and prevents conflict
        const { systemSettings } = useQuizStore.getState()
        if (systemSettings.bgmEnabled) {
            audioEngine.switchBgm('theWait', true)
        }

        // Cycle through pairs every 5 seconds
        let timer: any
        if (pairs.length > 1) {
            timer = setInterval(() => {
                setPairIndex(prev => (prev + 1) % pairs.length)
            }, 5000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [currentState, pairs.length])

    const currentPair = pairs[pairIndex] || (activeTeams?.length >= 2 ? [activeTeams[0], activeTeams[1]] : null)


    return (
        <motion.div
            className="absolute inset-0 bg-[#02040a] flex flex-col justify-between items-center overflow-hidden py-[8vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
            {/* BACKGROUND SYSTEM */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-[0.03]" />
                <motion.div
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-y-0 w-[40vw] bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.03)] to-transparent skew-x-[-30deg]"
                />
            </div>

            {/* TOP HERO: BRANDING */}
            <motion.div
                className="z-10 text-center flex-1 flex flex-col justify-center items-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <TvText variant="label" className="text-[clamp(0.8rem,1.2vw,1.6rem)] tracking-[0.8em] text-tv-accent mb-[2vh] uppercase opacity-70">
                    {systemSettings?.organizationName?.toUpperCase() || 'COORDI.TECH'} QUIZ ARENA PRESENTS...
                </TvText>

                <TvText variant="h1" className="text-[clamp(3.5rem,8vw,10rem)] font-black uppercase text-white drop-shadow-glow leading-none mb-[2vh]">
                    {activeConfig?.eventName || 'COORDI.TECH BATTLE'}
                </TvText>

                <div className="h-[2px] bg-tv-accent/50 w-[30vw] mb-[3vh] shadow-glow" />

                {activeConfig?.eventTheme && (
                    <TvText variant="h2" className="text-[clamp(1.5rem,3vw,4rem)] text-tv-accent font-black italic tracking-tighter uppercase px-8 py-2 border-x-2 border-tv-accent/20 bg-tv-accent/5">
                        {activeConfig.eventTheme}
                    </TvText>
                )}
            </motion.div>

            {/* CYCLING 'VS' ANIMATION */}
            <div className="z-10 w-full max-w-[95vw] h-[35vh] relative flex items-center justify-center mb-[10vh]">
                <AnimatePresence mode="wait">
                    {currentPair && (
                        <motion.div
                            key={`pair-${pairIndex}`}
                            className="flex items-center justify-center gap-[5vw] w-full h-full px-[5vw]"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: "anticipate" }}
                        >
                            <TeamDisplay team={currentPair[0]} isLeft={true} />

                            {/* VS CENTERPIECE */}
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                                className="relative flex items-center justify-center z-20 shrink-0"
                            >
                                <div className="absolute inset-0 bg-tv-accent blur-[40px] opacity-20 animate-pulse" />
                                <div className="bg-white text-black font-black text-[clamp(2.5rem,4.5vw,7rem)] italic px-10 py-4 skew-x-[-15deg] shadow-glow border-4 border-black">
                                    VS
                                </div>
                            </motion.div>

                            <TeamDisplay team={currentPair[1]} isLeft={false} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* FOOTER STATUS */}
            <motion.div
                className="z-10 flex items-center gap-[1vw]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <div className="relative flex items-center justify-center w-[1vw] h-[1vw]">
                    <motion.div
                        animate={{ scale: [1, 3], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-tv-accent rounded-full"
                    />
                    <div className="w-[0.5vw] h-[0.5vw] bg-tv-accent rounded-full" />
                </div>
                <TvText variant="label" className="text-[clamp(0.8rem,1vw,1.2rem)] tracking-[0.6em] uppercase text-tv-accent/60">
                    AWAITING GAME INITIATION
                </TvText>
            </motion.div>
        </motion.div>
    )
}
