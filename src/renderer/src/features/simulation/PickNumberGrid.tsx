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
        questions
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
        <div className="w-full h-full flex flex-col items-center justify-center p-[4vh] bg-tv-background/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden relative">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <TvText variant="h2" className="tracking-[0.4em] uppercase opacity-60 mb-2">
                    Pick a Number
                </TvText>
                <div className="flex items-center justify-center gap-4">
                    <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-tv-accent" />
                    <TvText variant="h1" style={{ color: activeTeam?.color }} className="drop-shadow-glow">
                        {activeTeam?.name || 'OPERATIVE'}
                    </TvText>
                    <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-tv-accent" />
                </div>
            </motion.div>

            {/* Grid */}
            <div
                className="grid gap-4 perspective-1000"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    width: 'min(95%, 1400px)'
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
                            transition={{ delay: idx * 0.02 }}
                            whileHover={!num.used ? { scale: 1.05, z: 20 } : {}}
                            onClick={() => isAdmin && !num.used && simulationEngine.handlePick(idx)}
                            className={cn(
                                "aspect-square flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer relative",
                                isSelected ? "border-tv-accent shadow-glow bg-tv-accent/20 scale-105 z-10" : "border-white/10 bg-black/40",
                                num.used && "opacity-25 grayscale cursor-not-allowed border-white/5"
                            )}
                        >
                            <TvText variant="h2" className={cn(
                                "font-orbitron font-black text-[clamp(1.2rem,5vmin,3.5rem)]",
                                isSelected ? "text-white" : "text-tv-textMuted"
                            )}>
                                {num.value}
                            </TvText>

                            {/* Team Mark for used tiles */}
                            {num.used && team && (
                                <div
                                    className="absolute bottom-2 right-2 w-3 h-3 rounded-full shadow-lg"
                                    style={{ backgroundColor: team.color }}
                                />
                            )}

                            {/* Selection Glow */}
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

            {/* Footer Hints */}
            {isAdmin && (
                <div className="mt-12 flex items-center justify-between w-full max-w-4xl px-4">
                    <div className="flex gap-8 opacity-40">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs font-mono">ARROWS</kbd>
                            <TvText variant="body" className="text-xs uppercase tracking-widest">Navigate</TvText>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs font-mono">ENTER</kbd>
                            <TvText variant="body" className="text-xs uppercase tracking-widest">Confirm Pick</TvText>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isAdmin && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-tv-accentSoft border border-tv-accent/30 p-4 rounded-lg flex-1 ml-12 max-w-xl"
                            >
                                <TvText variant="label" className="text-[10px] text-tv-accent tracking-widest mb-1 block uppercase">ADMIN PREVIEW: NODE {gridNumbers[selectionCursor]?.value}</TvText>
                                <TvText variant="body" className="text-sm font-bold line-clamp-2 italic opacity-80">
                                    {questions[gridNumbers[selectionCursor]?.questionIndex]?.question}
                                </TvText>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
