import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TvText } from '../../components/ui/TvText'
import { useQuizStore } from '../../store/useQuizStore'

const STATUS_MESSAGES = [
    "System Ready...",
    "Projection Screen Connected...",
    "Awaiting Quiz Master...",
    "Preparing Competition Arena...",
    "Load Quiz Setup To Begin..."
]

export function ProjectionHoldingScreen() {
    const { config, teams, questions } = useQuizStore()
    const [msgIndex, setMsgIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="absolute inset-0 bg-[#02040a] flex flex-col items-center justify-center overflow-hidden">
            {/* BACKGROUND UNDERCURRENT */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Soft Cinematic Nebula Glows */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.06)_0%,transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-[150%] h-[150%] bg-[radial-gradient(circle_at_bottom_right,rgba(0,229,255,0.03)_0%,transparent_60%)] animate-pulse" />

                {/* Very Soft Particle Dots */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            opacity: 0
                        }}
                        animate={{
                            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            opacity: [0, 0.05, 0]
                        }}
                        transition={{
                            duration: 15 + Math.random() * 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-2 h-2 bg-tv-accent rounded-full blur-[2px]"
                    />
                ))}

                {/* Slow Vertical Scan Beam */}
                <motion.div
                    animate={{ y: ['-100vh', '100vh'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[30vh] bg-gradient-to-b from-transparent via-white to-transparent opacity-[0.02]"
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="z-10 flex flex-col items-center justify-center w-full max-w-5xl text-center space-y-16">

                {/* MAIN TITLE */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    <motion.div
                        animate={{ textShadow: ["0px 0px 4px rgba(0,229,255,0)", "0px 0px 16px rgba(0,229,255,0.4)", "0px 0px 4px rgba(0,229,255,0)"] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="font-display font-black tracking-[0.4em] text-[clamp(2.5rem,6vw,5.5rem)] text-white/90 uppercase"
                    >
                        TECHVERSE<br />QUIZ ARENA
                    </motion.div>
                </motion.div>

                {/* ANIMATED STATUS LINE */}
                <div className="h-8 relative w-full flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={msgIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.5 }}
                            className="absolute text-tv-accent/60 tracking-[0.2em] font-medium uppercase text-[clamp(0.8rem,1.5vw,1.2rem)]"
                        >
                            {STATUS_MESSAGES[msgIndex]}
                        </motion.div>
                    </AnimatePresence>
                    <motion.div
                        className="h-[1px] bg-tv-accent/30 mt-8"
                        animate={{ width: ["0%", "40%", "0%"] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* EVENT INFO PLACEHOLDER */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="pt-8 flex flex-col items-center gap-2 opacity-40"
                >
                    {!config?.collectionName ? (
                        <TvText variant="label" className="tracking-[0.4em]">NO QUIZ SESSION LOADED</TvText>
                    ) : (
                        <>
                            <TvText variant="label" className="tracking-[0.4em] text-tv-accent">{config?.eventName || 'QUIZ SESSION LOADED'}</TvText>
                            <TvText variant="label" className="tracking-[0.3em]">{teams.length} TEAMS READY</TvText>
                            <TvText variant="label" className="tracking-[0.3em]">QUESTION BANK LOADED</TvText>
                        </>
                    )}
                </motion.div>

            </div>
        </div>
    )
}
