import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { audioEngine } from './AudioEngine'

export function ProjectionStandbyScreen() {
    const { teams, config, setupDraft, currentState } = useQuizStore()

    // Fallback to setupDraft if config isn't fully locked yet
    const activeConfig = config || setupDraft.config
    const activeTeams = teams?.length > 0 ? teams : (setupDraft.teams as any)

    // CYCLING PAIR LOGIC
    const [pairIndex, setPairIndex] = React.useState(0)

    const pairs = React.useMemo(() => {
        if (!activeTeams || activeTeams.length < 2) return []
        const result: any[][] = []
        // Create 1v1 pairings for all teams (A vs B, B vs C, etc.)
        for (let i = 0; i < activeTeams.length; i++) {
            const t1 = activeTeams[i]
            const t2 = activeTeams[(i + 1) % activeTeams.length]
            result.push([t1, t2])
        }
        return result
    }, [activeTeams])

    useEffect(() => {
        // Start cinematic drone when entering standby
        if (currentState === 'IDLE' || currentState === 'STANDBY') {
            audioEngine.playBgm('standbyAmbient', true)
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
            audioEngine.stopBgm()
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
            {/* BACKGROUND MOTION SYSTEM */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-[0.03]" />
                <motion.div
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-y-0 w-[40vw] bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.03)] to-transparent skew-x-[-30deg]"
                />
            </div>

            {/* CENTER HERO: BRANDING */}
            <motion.div
                className="z-10 text-center flex-1 flex flex-col justify-center items-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <TvText variant="label" className="text-[clamp(1rem,1.5vw,2rem)] tracking-[1em] text-tv-accent mb-[2vh] uppercase opacity-70">
                    TECHVERSE ARENA PRESENTS
                </TvText>

                <TvText variant="h1" className="text-[clamp(3.5rem,8vw,10rem)] font-black uppercase text-white drop-shadow-glow leading-none mb-[2vh]">
                    {activeConfig?.eventName || 'TECHVERSE BATTLE'}
                </TvText>

                <div className="h-[2px] bg-tv-accent/50 w-[30vw] mb-[3vh] shadow-glow" />

                {activeConfig?.eventTheme && (
                    <TvText variant="h2" className="text-[clamp(1.5rem,3vw,4rem)] text-tv-accent font-black italic tracking-tighter uppercase px-8 py-2 border-x-2 border-tv-accent/20 bg-tv-accent/5">
                        {activeConfig.eventTheme}
                    </TvText>
                )}
            </motion.div>

            {/* CYCLING 'VS' ANIMATION */}
            <div className="z-10 w-full max-w-[95vw] h-[30vh] relative flex items-center justify-center mb-[10vh]">
                <AnimatePresence mode="wait">
                    {currentPair && (
                        <motion.div
                            key={`${pairIndex}-${currentPair[0].id}-${currentPair[1].id}`}
                            className="flex items-center justify-center gap-[5vw] w-full h-full px-[5vw]"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: "anticipate" }}
                        >
                            {/* TEAM 1 */}
                            <motion.div
                                initial={{ x: -150, opacity: 0, skewX: -15 }}
                                animate={{ x: 0, opacity: 1, skewX: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="flex-1 flex flex-col items-end text-right pr-6 border-r-4"
                                style={{ borderColor: currentPair[0].color }}
                            >
                                <TvText variant="label" className="text-[1.2vw] opacity-40 mb-1" style={{ color: currentPair[0].color }}>CHALLENGER</TvText>
                                <TvText variant="h1" className="text-[clamp(2rem,5vw,7.5rem)] font-black italic leading-none text-white uppercase truncate w-full">
                                    {currentPair[0].name}
                                </TvText>
                            </motion.div>

                            {/* VS */}
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                                className="relative flex items-center justify-center z-20 shrink-0"
                            >
                                <div className="absolute inset-0 bg-tv-accent blur-[40px] opacity-20 animate-pulse" />
                                <div className="bg-white text-black font-black text-[clamp(2.5rem,4.5vw,7rem)] italic px-8 py-3 skew-x-[-15deg] shadow-glow">
                                    VS
                                </div>
                            </motion.div>

                            {/* TEAM 2 */}
                            <motion.div
                                initial={{ x: 150, opacity: 0, skewX: 15 }}
                                animate={{ x: 0, opacity: 1, skewX: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                className="flex-1 flex flex-col items-start text-left pl-6 border-l-4"
                                style={{ borderColor: currentPair[1].color }}
                            >
                                <TvText variant="label" className="text-[1.2vw] opacity-40 mb-1" style={{ color: currentPair[1].color }}>CONTENDER</TvText>
                                <TvText variant="h1" className="text-[clamp(2rem,5vw,7.5rem)] font-black italic leading-none text-white uppercase truncate w-full">
                                    {currentPair[1].name}
                                </TvText>
                            </motion.div>
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
