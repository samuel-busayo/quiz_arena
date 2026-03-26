import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { simulationEngine } from './QuizSimulationEngine'
import { TvText } from '../../components/ui/TvText'
import { cn } from '../../utils/cn'

export const PickNumberGrid: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
    const {
        gridNumbers,
        gridColumns,
        selectionCursor,
        setSelectionCursor,
        currentTeamId,
        teams,
        currentState,
        questions,
        pickingIndex
    } = useQuizStore()

    const activeTeam = teams.find(t => t.id === currentTeamId)

    useEffect(() => {
        if (!isAdmin) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (currentState !== 'PICKER_PHASE') return

            const cols = gridColumns
            const rows = Math.ceil(gridNumbers.length / cols)
            let newCursor = selectionCursor

            switch (e.key) {
                case 'ArrowRight':
                    newCursor = (selectionCursor + 1) % gridNumbers.length
                    break
                case 'ArrowLeft':
                    newCursor = (selectionCursor - 1 + gridNumbers.length) % gridNumbers.length
                    break
                case 'ArrowDown':
                    if (selectionCursor + cols < gridNumbers.length) {
                        newCursor = selectionCursor + cols
                    } else {
                        newCursor = selectionCursor % cols
                    }
                    break
                case 'ArrowUp':
                    if (selectionCursor - cols >= 0) {
                        newCursor = selectionCursor - cols
                    } else {
                        const lastRowStart = (rows - 1) * cols
                        newCursor = Math.min(lastRowStart + (selectionCursor % cols), gridNumbers.length - 1)
                    }
                    break
                case 'Enter':
                    simulationEngine.handlePick(selectionCursor)
                    break
            }

            if (newCursor !== selectionCursor) {
                setSelectionCursor(newCursor)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isAdmin, selectionCursor, gridNumbers.length, gridColumns, currentState])

    return (
        <div className={cn(
            "w-full h-full flex flex-col items-center justify-center bg-tv-background/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden relative",
            isAdmin ? "p-[2vh]" : "p-[4vh]"
        )}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "text-center shrink-0",
                    isAdmin ? "mb-2" : "mb-8"
                )}
            >
                {!isAdmin && (
                    <TvText variant="h2" className="tracking-[0.4em] uppercase opacity-60 mb-2 text-xs md:text-sm">
                        Pick a Number
                    </TvText>
                )}

                <div className="flex items-center justify-center gap-4">
                    <div className={cn("bg-gradient-to-r from-transparent to-tv-accent", isAdmin ? "h-[1px] w-12" : "h-[2px] w-20")} />
                    <TvText
                        variant="h1"
                        style={{ color: activeTeam?.color }}
                        className={cn(
                            "drop-shadow-glow transition-all",
                            isAdmin ? "text-lg md:text-xl font-bold" : "text-2xl md:text-4xl"
                        )}
                    >
                        {activeTeam?.name || 'OPERATIVE'}
                    </TvText>
                    <div className={cn("bg-gradient-to-l from-transparent to-tv-accent", isAdmin ? "h-[1px] w-12" : "h-[2px] w-20")} />
                </div>
            </motion.div>

            {/* Grid Container with Auto-Fit logic */}
            <div className="flex-1 w-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden relative">
                <div
                    className="grid gap-1 sm:gap-2 md:gap-4 w-full h-full max-w-[1600px] absolute inset-0 m-auto"
                    style={{
                        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${Math.ceil(gridNumbers.length / gridColumns)}, minmax(0, 1fr))`
                    }}
                >
                    {gridNumbers.map((num, idx) => {
                        const isSelected = selectionCursor === idx && isAdmin
                        const team = teams.find(t => t.id === num.teamId)

                        return (
                            <motion.div
                                key={idx}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                whileHover={(!num.used && isAdmin) ? { scale: 1.05, z: 20 } : {}}
                                onClick={() => isAdmin && !num.used && simulationEngine.handlePick(idx)}
                                className={cn(
                                    "flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden group h-full w-full",
                                    isSelected ? "border-tv-accent shadow-glow bg-tv-accent/20 scale-105 z-10" : "border-white/10 bg-black/40",
                                    num.used && "opacity-40 grayscale-[0.8] border-white/5",
                                    pickingIndex === idx && "z-50 scale-110 border-white shadow-[0_0_50px_#fff]"
                                )}
                            >
                                <TvText variant="h2" className={cn(
                                    "font-orbitron font-black text-center transition-all duration-300 z-10 select-none",
                                    gridNumbers.length > 50 ? "text-[min(1.8rem,5vw,2vh)]" :
                                        gridNumbers.length > 30 ? "text-[min(2.5rem,8vw,3.5vh)]" :
                                            "text-[min(4rem,12vw,5.5vh)]",
                                    isSelected ? "text-white" : "text-tv-textMuted",
                                    num.used && "opacity-10"
                                )}>
                                    {num.value}
                                </TvText>

                                {/* Gunshot Animation */}
                                <AnimatePresence>
                                    {pickingIndex === idx && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: [1, 2, 0] }}
                                                transition={{ duration: 0.5 }}
                                                className="absolute w-20 h-20 rounded-full bg-white blur-xl"
                                            />
                                            <div className="absolute w-full h-full border-4 border-white rounded-lg animate-ping opacity-40 shadow-glow" />
                                            <div className="text-white drop-shadow-[0_0_20px_#fff]">
                                                <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                    <circle cx="12" cy="12" r="10" strokeDasharray="4 4" className="animate-spin-slow" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Persistent Cross-out (X) */}
                                {num.used && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                        <svg width="80%" height="80%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tv-danger">
                                            <path d="M18 6L6 18" />
                                            <path d="M6 6l12 12" />
                                        </svg>
                                    </div>
                                )}

                                {num.used && team && (
                                    <div
                                        className="absolute bottom-1 right-1 w-2 h-2 rounded-full shadow-lg"
                                        style={{ backgroundColor: team.color }}
                                    />
                                )}

                                {isSelected && (
                                    <motion.div
                                        layoutId="cursor-glow"
                                        className="absolute -inset-1 rounded-lg border border-tv-accent/50 blur-sm pointer-events-none"
                                    />
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Footer Hints (Consolidated) */}
            {isAdmin && (
                <div className="mt-4 flex items-center justify-center w-full max-w-4xl px-4 shrink-0">
                    <div className="flex gap-12 opacity-40">
                        <div className="flex items-center gap-3">
                            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-[10px] font-mono shadow-inner shadow-white/5">ARROWS</kbd>
                            <TvText variant="body" className="text-[11px] uppercase tracking-[0.2em] font-medium">Navigate</TvText>
                        </div>
                        <div className="flex items-center gap-3">
                            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-[10px] font-mono shadow-inner shadow-white/5">ENTER</kbd>
                            <TvText variant="body" className="text-[11px] uppercase tracking-[0.2em] font-medium">Confirm Pick</TvText>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
