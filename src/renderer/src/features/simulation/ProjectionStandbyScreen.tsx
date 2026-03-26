import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { audioEngine } from './AudioEngine'

export function ProjectionStandbyScreen() {
    const { teams, config, setupDraft, currentState } = useQuizStore()

    // Fallback to setupDraft if config isn't fully locked yet, though in SIMULATION_CONSOLE config should be set
    const activeConfig = config || setupDraft.config
    const activeCollection = config?.collectionName || setupDraft.collectionName
    const activeTeams = teams?.length > 0 ? teams : (setupDraft.teams as any)

    useEffect(() => {
        // Start cinematic drone when entering standby
        // We only want this in IDLE/STANDBY
        if (currentState === 'IDLE' || currentState === 'STANDBY') {
            audioEngine.playBgm('standbyAmbient', true)
        }
        return () => {
            audioEngine.stopBgm()
        }
    }, [currentState])

    return (
        <motion.div
            className="absolute inset-0 bg-[#02040a] flex flex-col justify-between items-center overflow-hidden py-[8vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }} // Base container exit fade
        >
            {/* BACKGROUND MOTION SYSTEM */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Faint arena grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-[0.03]" />

                {/* Slow light beam sweeps */}
                <motion.div
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-y-0 w-[40vw] bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.03)] to-transparent skew-x-[-30deg]"
                />

                {/* Drifting digital particles */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-[0.05] blur-[1px]"
                        initial={{
                            y: '110vh',
                            x: `${Math.random() * 100}vw`
                        }}
                        animate={{
                            y: '-10vh',
                            opacity: [0, 0.05, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 20,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: Math.random() * 10
                        }}
                    />
                ))}
            </div>


            {/* CENTER HERO: ORGANIZER & THEME */}
            <motion.div
                className="z-10 text-center flex-1 flex flex-col justify-center items-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.6, ease: 'backIn' } }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <TvText variant="label" className="text-[clamp(1rem,1.5vw,2rem)] tracking-[1em] text-tv-accent mb-[2vh] uppercase opacity-70">
                    TECHVERSE ARENA PRESENTS
                </TvText>

                <motion.div
                    initial={{ letterSpacing: '0.1em', opacity: 0 }}
                    animate={{ letterSpacing: '0.4em', opacity: 1 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                >
                    <TvText variant="h1" className="text-[clamp(3rem,8vw,11rem)] font-black uppercase text-white drop-shadow-glow leading-none mb-[4vh]">
                        {activeConfig?.eventName || 'ORGANIZER NAME'}
                    </TvText>
                </motion.div>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 'clamp(200px, 30vw, 500px)' }}
                    transition={{ delay: 0.8, duration: 1.2, ease: 'circOut' }}
                    className="h-[2px] bg-tv-accent/50 mb-[4vh] relative"
                >
                    <div className="absolute inset-0 bg-tv-accent blur-[4px]" />
                </motion.div>

                {activeConfig?.eventTheme && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 1 }}
                    >
                        <TvText variant="h2" className="text-[clamp(1.5rem,3vw,4rem)] text-tv-accent font-black italic tracking-tighter uppercase px-8 py-2 border-x-2 border-tv-accent/20 bg-tv-accent/5">
                            {activeConfig.eventTheme}
                        </TvText>
                    </motion.div>
                )}
            </motion.div>

            {/* WRESTLING 'VS' STYLE TEAM DISPLAY */}
            <div className="z-10 w-full max-w-[90vw] h-[25vh] relative flex items-center justify-center mb-[10vh]">
                <AnimatePresence mode="wait">
                    {activeTeams && activeTeams.length >= 2 && (
                        <div className="flex items-center justify-center gap-[4vw] w-full h-full">
                            {/* TEAM 1 - SLIDE FROM LEFT */}
                            <motion.div
                                initial={{ x: -200, opacity: 0, skewX: -20 }}
                                animate={{ x: 0, opacity: 1, skewX: 0 }}
                                exit={{ x: -100, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "anticipate", delay: 1.5 }}
                                className="flex-1 flex flex-col items-end text-right pr-[2vw] border-r-4"
                                style={{ borderColor: activeTeams[0].color }}
                            >
                                <TvText variant="label" className="text-[1.5vw] opacity-50 mb-1" style={{ color: activeTeams[0].color }}>CONTENDER 01</TvText>
                                <TvText variant="h1" className="text-[clamp(2.5rem,5vw,7rem)] font-black italic leading-none text-white uppercase truncate w-full">
                                    {activeTeams[0].name}
                                </TvText>
                            </motion.div>

                            {/* VS GRAPHIC - POP IN CENTER */}
                            <motion.div
                                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 2 }}
                                className="relative flex items-center justify-center z-20"
                            >
                                <div className="absolute inset-0 bg-tv-accent blur-[40px] opacity-20 animate-pulse" />
                                <div className="bg-white text-black font-black text-[clamp(2rem,4vw,6rem)] italic px-6 py-2 skew-x-[-15deg] shadow-glow">
                                    VS
                                </div>
                            </motion.div>

                            {/* TEAM 2 - SLIDE FROM RIGHT */}
                            <motion.div
                                initial={{ x: 200, opacity: 0, skewX: 20 }}
                                animate={{ x: 0, opacity: 1, skewX: 0 }}
                                exit={{ x: 100, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "anticipate", delay: 1.7 }}
                                className="flex-1 flex flex-col items-start text-left pl-[2vw] border-l-4"
                                style={{ borderColor: activeTeams[1].color }}
                            >
                                <TvText variant="label" className="text-[1.5vw] opacity-50 mb-1" style={{ color: activeTeams[1].color }}>CONTENDER 02</TvText>
                                <TvText variant="h1" className="text-[clamp(2.5rem,5vw,7rem)] font-black italic leading-none text-white uppercase truncate w-full">
                                    {activeTeams[1].name}
                                </TvText>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* STARTING SOON INDICATOR */}
            <motion.div
                className="z-10 absolute bottom-[4vh] flex items-center gap-[1vw]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 2 }}
                exit={{ y: '10vh', opacity: 0, transition: { duration: 0.8 } }} // Drops down
            >
                <div className="relative flex items-center justify-center w-[2vw] h-[2vw]">
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 bg-tv-accent rounded-full"
                    />
                    <div className="w-[1vw] h-[1vw] bg-tv-accent rounded-full z-10" />
                </div>
                <TvText variant="label" className="text-[clamp(1.2rem,1.5vw,2rem)] tracking-[0.5em] uppercase text-tv-accent">
                    QUIZ BEGINS SHORTLY
                </TvText>
            </motion.div>
        </motion.div>
    )
}
