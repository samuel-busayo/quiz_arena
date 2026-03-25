import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TvText } from '../components/ui/TvText'
import { TvPanel } from '../components/ui/TvPanel'
import { TvButton } from '../components/ui/TvButton'
import { ArrowLeft, Calendar, Trophy, Zap, Target, BarChart3, ChevronRight } from 'lucide-react'
import { QuizResult, useQuizStore } from '../store/useQuizStore'
import { ResultAnalyticsEngine, TeamStats } from '../features/analytics/ResultAnalyticsEngine'
import { cn } from '../utils/cn'

export const ResultsHistoryScreen: React.FC = () => {
    const { setUiScreen } = useQuizStore()
    const [results, setResults] = useState<QuizResult[]>([])
    const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadResults = async () => {
            try {
                const data = await window.api.getQuizResults()
                setResults(data.sort((a: QuizResult, b: QuizResult) => new Date(b.date).getTime() - new Date(a.date).getTime()))
            } catch (err) {
                console.error('Failed to load results:', err)
            } finally {
                setLoading(false)
            }
        }
        loadResults()
    }, [])

    return (
        <div className="h-full w-full bg-tv-background p-10 flex flex-col gap-8 overflow-hidden">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <TvButton variant="ghost" iconLeft={<ArrowLeft size={20} />} onClick={() => setUiScreen('COMMAND_CENTER')} />
                    <div>
                        <TvText variant="h1" className="text-4xl tracking-tighter">MISSION ARCHIVES</TvText>
                        <TvText variant="muted" className="text-xs uppercase tracking-[0.3em]">Historical Engagement Data</TvText>
                    </div>
                </div>
                <div className="px-4 py-2 bg-tv-accentSoft border border-tv-accent/20 rounded flex items-center gap-3">
                    <BarChart3 size={16} className="text-tv-accent" />
                    <TvText variant="body" className="text-sm font-bold">{results.length} SESSIONS RECORDED</TvText>
                </div>
            </header>

            <div className="flex-1 flex gap-10 min-h-0">
                {/* Result List */}
                <TvPanel elevation="raised" className="w-[400px] flex flex-col gap-4 overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <TvText variant="label" className="text-[10px] opacity-40">CHRONOLOGICAL LOG</TvText>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {loading ? (
                            <div className="h-full flex items-center justify-center opacity-20">
                                <TvText variant="body">SCANNING DISK...</TvText>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-20 px-10 text-center">
                                <TvText variant="body">NO ARCHIVED MISSIONS FOUND</TvText>
                            </div>
                        ) : (
                            results.map(res => (
                                <button
                                    key={res.id}
                                    onClick={() => setSelectedResult(res)}
                                    className={cn(
                                        "w-full p-4 rounded border text-left transition-all group flex items-center justify-between",
                                        selectedResult?.id === res.id
                                            ? "bg-tv-accentSoft border-tv-accent/40 shadow-glow"
                                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="opacity-40" />
                                            <TvText variant="body" className="text-[10px] font-mono opacity-60">
                                                {new Date(res.date).toLocaleString()}
                                            </TvText>
                                        </div>
                                        <TvText variant="h3" className="text-sm uppercase tracking-tight">
                                            {res.setupSnapshot.collectionName || 'UNKNOWN MISSION'}
                                        </TvText>
                                    </div>
                                    <ChevronRight size={16} className={cn(
                                        "transition-transform",
                                        selectedResult?.id === res.id ? "text-tv-accent translate-x-1" : "opacity-20"
                                    )} />
                                </button>
                            ))
                        )}
                    </div>
                </TvPanel>

                {/* analytics View */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {selectedResult ? (
                            <motion.div
                                key={selectedResult.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4"
                            >
                                {/* Dashboard Hero */}
                                <div className="grid grid-cols-4 gap-4">
                                    <StatCard icon={<Trophy color="#FFD700" />} label="Winner" value={selectedResult.teams.find(t => t.id === selectedResult.winner)?.name || 'N/A'} />
                                    <StatCard icon={<Target color="#00E5FF" />} label="Avg. Accuracy" value={`${ResultAnalyticsEngine.getGlobalAccuracy(selectedResult).toFixed(1)}%`} />
                                    <StatCard icon={<Zap color="#FFEA00" />} label="Questions" value={selectedResult.questionStats.length} />
                                    <StatCard icon={<Calendar color="#B0BEC5" />} label="Rounds" value={selectedResult.roundsPlayed} />
                                </div>

                                {/* Team Performance Table */}
                                <TvPanel elevation="raised" className="overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                        <TvText variant="h3" className="text-sm uppercase tracking-widest text-tv-accent">Operative Performance</TvText>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 uppercase text-[10px] tracking-widest opacity-40">
                                                    <th className="p-4 font-normal">Operative</th>
                                                    <th className="p-4 font-normal">Score</th>
                                                    <th className="p-4 font-normal">Accuracy</th>
                                                    <th className="p-4 font-normal">Avg Speed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ResultAnalyticsEngine.getTeamStats(selectedResult).map(stat => (
                                                    <tr key={stat.teamId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-4 rounded-full" style={{ backgroundColor: selectedResult.teams.find(t => t.id === stat.teamId)?.color }} />
                                                                <TvText variant="body" className="font-bold text-sm uppercase">{stat.teamName}</TvText>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <TvText variant="h3" className="text-tv-accent text-lg">{selectedResult.finalScores[stat.teamId] || 0}</TvText>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-20">
                                                                    <div className="h-full bg-tv-accent" style={{ width: `${stat.accuracy}%` }} />
                                                                </div>
                                                                <TvText variant="body" className="text-xs font-mono">{stat.accuracy.toFixed(0)}%</TvText>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <TvText variant="body" className="text-xs font-mono italic opacity-60">
                                                                {stat.avgSpeed.toFixed(2)}s / q
                                                            </TvText>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TvPanel>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-white/10 rounded-2xl">
                                <BarChart3 size={120} />
                                <TvText variant="h2" className="mt-8 uppercase tracking-[0.5em]">Select Archive Point</TvText>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <TvPanel elevation="raised" className="flex flex-col gap-2 p-6 border-t-2 border-t-tv-accent">
            <div className="flex items-center gap-2 opacity-40">
                {icon}
                <TvText variant="label" className="text-[10px] uppercase tracking-widest">{label}</TvText>
            </div>
            <TvText variant="h2" className="text-3xl font-black italic tracking-tighter truncate">{value}</TvText>
        </TvPanel>
    )
}
