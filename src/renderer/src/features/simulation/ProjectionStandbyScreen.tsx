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
            <div className="absolute inset-0 pointer-events-none opacity-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(0,229,255,0.05)_0%,transparent_70%)]"
                    />
                </div>
                {/* Slow drifting particles */}
                {[...Array(30)].map((_, i) => (
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
                    <TvText variant="h1" className="text-8xl font-black italic tracking-[0.3em] text-white">
                        TECHVERSE <span className="text-tv-accent">QUIZ ARENA</span>
                    </TvText>
                </motion.div>
                <TvText variant="label" className="text-sm tracking-[0.8em] opacity-40 uppercase mt-4 block">
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
                    <TvText variant="h2" className="text-4xl font-light uppercase tracking-[0.5em] text-white">
                        {config.eventName}
                    </TvText>
                </motion.div>
            )}

            {/* STATUS MESSAGE SYSTEM */}
            <div className="h-10 mb-40 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={msgIndex}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -10 }}
                        className="text-tv-accent flex items-center gap-4"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-tv-accent animate-pulse" />
                        <TvText variant="h3" className="text-xl tracking-[0.3em] font-medium uppercase italic">
                            {MESSAGES[msgIndex]}
                        </TvText>
                        <div className="w-1.5 h-1.5 rounded-full bg-tv-accent animate-pulse" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* TEAM PREVIEW STRIP */}
            {teams.length > 0 && (
                <div className="flex gap-10 z-10">
                    <AnimatePresence>
                        {teams.map((team, idx) => (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className="relative py-4 px-10 rounded border-l-2 bg-white/5 flex flex-col"
                                style={{ borderLeftColor: team.color }}
                            >
                                <motion.div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                                    style={{ backgroundColor: team.color }}
                                />
                                <TvText variant="label" className="text-[10px] opacity-40 mb-1">TEAM {idx + 1}</TvText>
                                <TvText variant="h3" className="font-bold tracking-widest text-white uppercase">{team.name}</TvText>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
