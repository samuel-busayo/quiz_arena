import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { cn } from '../../utils/cn'

const MESSAGES = [
    "Preparing Quiz Environment...",
    "Teams Finalizing Deployment...",
    "Loading Question Modules...",
    "Synchronizing Control Console...",
    "Competition Begins Shortly..."
]

export function ProjectionStandbyScreen() {
    const { config, teams } = useQuizStore()
    const [msgIndex, setMsgIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % MESSAGES.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#02040a]">
            {/* AMBIENT BACKGROUND MOTION */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Subtle base glows instead of grid */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,229,255,0.05)_0%,transparent_60%)]" />
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                    className="w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(0,229,255,0.03)_0%,transparent_60%)]"
                />
                {/* Scanning Line */}
                <motion.div
                    animate={{ y: ['-100%', '100%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[20vh] bg-gradient-to-b from-transparent via-tv-accent/5 to-transparent z-0 opacity-20"
                />
                {/* Slow drifting particles */}
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.5
                        }}
                        animate={{
                            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`]
                        }}
                        transition={{
                            duration: 20 + Math.random() * 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-1 h-1 bg-white rounded-full"
                    />
                ))}
            </div>

            {/* CORNER HUD WIDGETS */}
            <div className="absolute inset-0 p-10 pointer-events-none z-20">
                {/* Top Left: System Local Time */}
                <div className="absolute top-10 left-10 flex flex-col gap-1 opacity-40">
                    <TvText variant="label" className="text-[8px] tracking-[0.3em]">SYSTEM_LOC_TIME</TvText>
                    <TvText variant="h3" className="text-sm font-mono">{new Date().toLocaleTimeString()}</TvText>
                </div>
                {/* Top Right: Signal Status */}
                <div className="absolute top-10 right-10 flex flex-col items-end gap-1 opacity-40">
                    <TvText variant="label" className="text-[8px] tracking-[0.3em]">NEURAL_SIGNAL_STR</TvText>
                    <div className="flex gap-1 h-4 items-end">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                animate={{ height: [8, 16, 8] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 bg-tv-accent rounded-t-[1px]"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* HEADER BRAND BLOCK */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center z-10 mb-20"
            >
                <motion.div
                    animate={{ textShadow: ["0 0 0px #00E5FF", "0 0 20px #00E5FF", "0 0 0px #00E5FF"] }}
                    transition={{ duration: 5, repeat: Infinity }}
                >
                    <TvText variant="h1" className="text-[clamp(3rem,8vw,10rem)] font-black italic tracking-[0.2em] text-white leading-tight">
                        TECHVERSE <span className="text-tv-accent">QUIZ ARENA</span>
                    </TvText>
                </motion.div>
                <TvText align="center" variant="label" className="text-sm tracking-[0.8em] opacity-40 uppercase mt-4 block ml-[0.8em]">
                    Powered by TechVerse Innovation
                </TvText>
            </motion.div>

            {/* EVENT TITLE BLOCK */}
            {config?.eventName && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="mb-32 text-center z-10"
                >
                    <TvText variant="h2" className="text-[clamp(1.5rem,4vw,4rem)] font-light uppercase tracking-[0.4em] text-white/60">
                        {config.eventName}
                    </TvText>
                </motion.div>
            )}

            {/* STATUS MESSAGE SYSTEM */}
            <div className="h-10 mb-40 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={msgIndex}
                        initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                        className="text-tv-accent flex items-center gap-4"
                    >
                        <motion.div
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-tv-accent shadow-[0_0_8px_#00E5FF]"
                        />
                        <TvText align="center" variant="h3" className="text-[clamp(1rem,2vw,2rem)] tracking-[0.3em] font-medium uppercase italic drop-shadow-glow">
                            {MESSAGES[msgIndex]}
                        </TvText>
                        <motion.div
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-tv-accent shadow-[0_0_8px_#00E5FF]"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* TEAM PREVIEW STRIP */}
            {teams.length > 0 && (
                <div className="flex gap-16 z-10 flex-wrap justify-center">
                    <AnimatePresence>
                        {teams.map((team, idx) => (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className="relative py-5 px-12 rounded border-l-4 bg-white/5 flex flex-col items-start"
                                style={{ borderLeftColor: team.color }}
                            >
                                <motion.div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                                    style={{ backgroundColor: team.color }}
                                />
                                <TvText variant="label" className="text-xs text-white opacity-90 mb-2 font-bold tracking-[0.4em]">TEAM {idx + 1}</TvText>
                                <TvText variant="h3" className="font-bold tracking-widest text-white uppercase text-xl">{team.name}</TvText>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
