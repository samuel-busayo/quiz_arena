import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from '../../components/ui/TvText'
import { CheckCircle2, CircleDashed, Shield, Users } from 'lucide-react'
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
            audioEngine.playSfx('correct')
        }
        setPrevReadyCount(readyCount)
    }, [modules, prevReadyCount])

    return (
        <div className="absolute inset-0 bg-[#02040a] flex flex-col items-center justify-center p-[4vw] overflow-hidden">

            {/* ENVIRONMENT SCAN ANIMATION (BACKGROUND) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div
                    animate={{ y: ['-10vh', '110vh'] }}
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    className="absolute inset-x-0 h-[1px] bg-tv-accent/30"
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)]"
                />
            </div>

            {/* DUAL REPORT SPLIT CONTAINER */}
            <div className="w-full max-w-[90vw] grid grid-cols-12 gap-[5vw] items-start z-10">

                {/* LEFT SIDE: INITIALIZING STATUS REPORT */}
                <div className="col-span-6 space-y-[6vh]">
                    <div className="space-y-[2vh]">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex items-center gap-4 text-tv-accent mb-4"
                        >
                            <Shield size={32} className="opacity-40" />
                            <TvText variant="label" className="text-xl tracking-[0.5em] uppercase opacity-40">System Report #01</TvText>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            <TvText variant="h1" className="text-[clamp(3rem,6vw,8rem)] font-black uppercase tracking-widest text-white leading-none">
                                SYSTEM <br /><span className="text-tv-accent">ARMING</span>
                            </TvText>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-[2vh]"
                        >
                            <TvText variant="label" className="text-[clamp(0.9rem,1.2vw,1.5rem)] tracking-[0.4em] opacity-60 uppercase">
                                Preparing Quiz Environment
                            </TvText>
                            <div className="h-[2px] w-full bg-tv-border relative overflow-hidden mt-[2vh]">
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-0 bottom-0 w-1/3 bg-tv-accent shadow-[0_0_10px_#00E5FF]"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* STATUS MODULES LIST */}
                    <div className="space-y-[2vh]">
                        {modules.map((mod, index) => (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + (index * 0.1) }}
                                className={`flex items-center gap-[2vw] p-[1.5vw] rounded-lg border-l-4 bg-black/40 backdrop-blur-sm transition-colors duration-500 ${mod.ready ? 'border-tv-accent' : 'border-white/5'}`}
                            >
                                <div className={`shrink-0 transition-colors duration-500 ${mod.ready ? 'text-tv-accent' : 'text-tv-textMuted'}`}>
                                    {mod.ready ? <CheckCircle2 className="w-[1.5vw] h-[1.5vw]" /> : (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                            <CircleDashed className="w-[1.5vw] h-[1.5vw]" />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <TvText variant="h3" className={`tracking-widest uppercase transition-colors duration-500 text-[clamp(0.7rem,1vw,1.2rem)] ${mod.ready ? 'text-white' : 'text-tv-textMuted'}`}>
                                        {mod.label}
                                    </TvText>
                                    <div className="flex gap-[0.2vw] mt-[1vh] w-full">
                                        {[...Array(15)].map((_, i) => (
                                            <div key={i} className={`h-[0.3vh] flex-1 rounded-sm ${mod.ready ? 'bg-tv-accent/40' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE: OPERATIVE REGISTRATION REPORT */}
                <div className="col-span-6 space-y-[6vh] border-l border-tv-border/20 pl-[5vw]">
                    <div className="space-y-[4vh]">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex items-center gap-4 text-tv-accent mb-4"
                        >
                            <Users size={32} className="opacity-40" />
                            <TvText variant="label" className="text-xl tracking-[0.5em] uppercase opacity-40">Enrollment Report #02</TvText>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            <TvText variant="h1" className="text-[clamp(3rem,6vw,8rem)] font-black uppercase tracking-widest text-white leading-none">
                                OPERATIVE <br /><span className="text-tv-accent">REGISTRATION</span>
                            </TvText>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-[1.5vh]">
                        <AnimatePresence>
                            {teams?.map((team, idx) => team?.id && (
                                <motion.div
                                    key={team.id}
                                    initial={{ opacity: 0, scale: 0.9, x: 30 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                                    className="p-[1.5vw] rounded-lg border-l-2 bg-white/5 backdrop-blur-sm relative overflow-hidden group"
                                    style={{ borderLeftColor: team.color || '#333' }}
                                >
                                    <div className="flex flex-col items-start">
                                        <TvText variant="label" className="text-[clamp(0.6rem,0.7vw,0.8rem)] opacity-60 mb-[0.5vh] font-bold tracking-[0.3em] uppercase" style={{ color: team.color }}>UNIT 0{idx + 1}</TvText>
                                        <TvText variant="h3" className="font-bold tracking-widest text-white uppercase text-[clamp(0.8rem,1.2vw,1.4rem)] truncate leading-tight">
                                            {team.name || 'PENDING...'}
                                        </TvText>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-10">
                                        <Shield size={24} style={{ color: team.color }} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty Slots to fill the grid if needed */}
                        {[...Array(Math.max(0, 4 - teams.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="p-[1.5vw] rounded-lg border border-dashed border-white/5 opacity-20 flex items-center justify-center">
                                <TvText variant="label" className="text-[0.6rem] tracking-widest">AWAITING UNIT...</TvText>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${teams.length >= 2 ? 'bg-tv-success' : 'bg-tv-warning'}`} />
                            <TvText variant="muted" className="text-xs uppercase tracking-widest">
                                {teams.length} Operatives Embedded – {teams.length >= 2 ? 'READY FOR DEPLOYMENT' : 'MINIMUM QUOTA NOT MET'}
                            </TvText>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
