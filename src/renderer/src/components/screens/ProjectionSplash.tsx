import React from 'react'
import { motion } from 'framer-motion'
import { TvText } from '../../components/ui/TvText'
import logo from '../../assets/ct_logo.png'

import { useQuizStore } from '../../store/useQuizStore'

export function ProjectionSplash() {
    const { isInitialized } = useQuizStore()

    React.useEffect(() => {
        const timer = setTimeout(() => {
            useQuizStore.setState({ isInitialized: true })
        }, 5000)

        // Force skip on spacebar for operator unblocking
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                useQuizStore.setState({ isInitialized: true })
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-[#02040a] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Logo Image */}
                <motion.img
                    src={logo}
                    alt="TV Logo"
                    className="w-32 h-32 mb-8 object-contain drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                />
                {/* Visual Glow */}
                <div className="absolute inset-0 bg-tv-accent blur-[100px] opacity-10 animate-pulse" />

                <TvText variant="label" className="text-tv-accent text-2xl tracking-[1.5em] uppercase mb-8 opacity-40">
                    MISSION CRITICAL SYSTEM
                </TvText>

                <TvText variant="h1" className="text-[10vw] font-black italic tracking-tighter text-white drop-shadow-glow leading-none">
                    FUTURISTIC
                </TvText>
                <TvText variant="h2" className="text-[6vw] font-black italic tracking-[0.4em] text-tv-accent mt-[-2vw] uppercase opacity-90">
                    QUIZ ARENA
                </TvText>

                <div className="mt-12 h-1 w-64 bg-tv-accent/30 relative overflow-hidden rounded-full">
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-tv-accent shadow-[0_0_20px_#00E5FF]"
                    />
                </div>
            </motion.div>

            <motion.div
                className="absolute bottom-12 text-white/20 tracking-[0.5em] text-sm uppercase"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                Synchronizing Neural Link...
            </motion.div>
        </motion.div>
    )
}
