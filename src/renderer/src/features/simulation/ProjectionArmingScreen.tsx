import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { CheckCircle2, CircleDashed } from 'lucide-react'
import { audioEngine } from './AudioEngine'

export function ProjectionArmingScreen() {
    const { setupDraft } = useQuizStore()
    const { step = 1, teams = [], collectionName, config } = setupDraft || {}

    // Define System Modules based on setup draft state
    const modules = [
        { id: 'teams', label: 'Initializing Team Engine', ready: teams.length >= 2 && step >= 2 },
        { id: 'bank', label: 'Loading Question Bank', ready: !!collectionName && step >= 3 },
        { id: 'rules', label: 'Configuring Competition Protocol', ready: step >= 4 },
        { id: 'logic', label: 'ACTIVATE COMPETITION LOGIC', ready: step === 4 && !!config?.mode }
    ]

    const [prevReadyCount, setPrevReadyCount] = React.useState(0)

    React.useEffect(() => {
        const readyCount = modules.filter(m => m.ready).length
        if (readyCount > prevReadyCount) {
            // Check if settings allow sfx
            audioEngine.playSfx('correct')
        }
        setPrevReadyCount(readyCount)
    }, [modules, prevReadyCount])

    return (
        <div className="absolute inset-0 bg-[#02040a] flex items-center justify-between p-[8vw] overflow-hidden">

            {/* ENVIRONMENT SCAN ANIMATION (BACKGROUND) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Horizontal scanning beam */}
                <motion.div
                    animate={{ y: ['-10vh', '110vh'] }}
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    className="absolute inset-x-0 h-4 bg-tv-accent/10 blur-sm"
                />
                <motion.div
                    animate={{ y: ['-10vh', '110vh'] }}
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    className="absolute inset-x-0 h-[1px] bg-tv-accent/30"
                />

                {/* Nebula Glow Background (No Grids) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)]"
                />

                {/* Subtle particle drift */}
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
                            opacity: [0, 0.2, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-1 h-1 bg-tv-accent rounded-full blur-[1px]"
                    />
                ))}
            </div>

            {/* LEFT COLUMN: MODULE STATUS */}
            <div className="w-[42%] h-full flex flex-col justify-center z-10">

                {/* MAIN HEADER */}
                <div className="mb-[6vh]">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <TvText variant="h1" className="text-[clamp(3rem,5vw,6rem)] font-black uppercase tracking-widest text-white leading-none">
                            SYSTEM<br /><span className="text-tv-accent">ARMING</span>
                        </TvText>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-[3vh] space-y-[2vh]"
                    >
                        <TvText variant="label" className="text-[clamp(0.9rem,1.2vw,1.5rem)] tracking-[0.4em] opacity-60 uppercase">
                            Preparing Quiz Environment
                        </TvText>

                        {/* Scan Sweep Underline */}
                        <div className="h-[2px] w-full bg-tv-border relative overflow-hidden max-w-lg mt-[2vh]">
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 bottom-0 w-1/3 bg-tv-accent shadow-[0_0_10px_#00E5FF]"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* PROGRESS MODULES STACK */}
                <div className="space-y-[3vh]">
                    {modules.map((mod, index) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 * index + 0.5 }}
                            className={`flex items-center gap-[1.5vw] p-[1.2vw] rounded-lg border-l-4 bg-black/40 backdrop-blur-sm transition-colors duration-500 ${mod.ready ? 'border-tv-accent shadow-[inset_4px_0_0_#00E5FF,0_0_20px_rgba(0,229,255,0.1)]' : 'border-tv-border'}`}
                        >
                            <div className={`shrink-0 transition-colors duration-500 ${mod.ready ? 'text-tv-accent' : 'text-tv-textMuted'}`}>
                                {mod.ready ? <CheckCircle2 className="w-[2vw] h-[2vw]" /> : (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                        <CircleDashed className="w-[2vw] h-[2vw]" />
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex-1">
                                <TvText variant="h3" className={`tracking-widest uppercase transition-colors duration-500 text-[clamp(0.7rem,1vw,1.2rem)] ${mod.ready ? 'text-white' : 'text-tv-textMuted'}`}>
                                    {mod.label}
                                </TvText>
                                <div className="flex gap-[0.2vw] mt-[1vh]">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={!mod.ready ? { backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(0,229,255,0.5)', 'rgba(255,255,255,0.1)'] } : {}}
                                            transition={!mod.ready ? { duration: 1, repeat: Infinity, delay: i * 0.05 } : {}}
                                            className={`h-[0.4vh] flex-1 rounded-sm ${mod.ready ? 'bg-tv-accent/40' : 'bg-white/10'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: TEAM GRID */}
            <div className="w-[44%] h-full flex flex-col justify-center z-10 pl-[4vw] border-l border-tv-border/30 relative">
                <div className="absolute top-1/2 -left-[1px] w-[2px] h-[20vh] bg-tv-accent -translate-y-1/2 shadow-glow" />

                <TvText variant="label" className="text-[clamp(0.7rem,1vw,1.2rem)] tracking-[0.5em] text-tv-accent mb-[4vh] block">OPERATIVE REGISTRATION</TvText>

                <div className="grid grid-cols-2 gap-[1.5vw]">
                    <AnimatePresence>
                        {teams?.map((team, idx) => team?.id && (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4 }}
                                className="p-[1.5vw] rounded-xl border-2 bg-black/60 backdrop-blur-md relative overflow-hidden group"
                                style={{ borderColor: team.color || '#333' }}
                            >
                                {/* Breathing Glow */}
                                <motion.div
                                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ backgroundColor: team.color || '#333' }}
                                />

                                <TvText variant="label" className="text-[clamp(0.6rem,0.7vw,0.8rem)] opacity-60 mb-[1vh] font-bold tracking-[0.3em] block" style={{ color: team.color }}>UNIT 0{idx + 1}</TvText>
                                <TvText variant="h3" className="font-bold tracking-widest text-white uppercase text-[clamp(1rem,1.5vw,2rem)] truncate leading-tight">
                                    {team.name || 'PENDING...'}
                                </TvText>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
