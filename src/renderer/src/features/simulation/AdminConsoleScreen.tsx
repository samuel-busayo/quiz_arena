import React, { useState, useEffect } from 'react'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import { Play, Pause, RotateCcw, Volume2, Trophy, ArrowRight, ShieldAlert, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'

export function AdminConsoleScreen() {
    const {
        currentState,
        setCurrentState,
        setUiScreen,
        teams,
        config,
        questions,
        currentRound,
        currentTeamIndex,
        currentQuestion,
        timerRemaining,
        isPaused,
        setPaused,
        tickTimer,
        updateScore,
        nextTeam,
        setQuestions
    } = useQuizStore()

    const activeTeam = teams[currentTeamIndex]
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (currentState === 'QUESTION_DISPLAY' && !isPaused && timerRemaining > 0) {
            interval = setInterval(() => {
                tickTimer()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [currentState, isPaused, timerRemaining, tickTimer])

    const handlePickQuestion = () => {
        const unUsed = questions.filter(q => !q.used)
        if (unUsed.length === 0) {
            alert('Simulation Warning: All question stages in the current vector have been exhausted.')
            return
        }

        const nextQ = unUsed[Math.floor(Math.random() * unUsed.length)]
        const updated = questions.map(q => q.id === nextQ.id ? { ...q, used: true } : q)

        setQuestions(updated)
        // Set local state first to avoid blink
        setSelectedAnswer(null)

        useQuizStore.setState({
            currentQuestion: nextQ,
            timerRemaining: config?.timerSeconds || 30,
            currentState: 'QUESTION_DISPLAY'
        })
    }

    const handleResult = (correct: boolean) => {
        if (!currentQuestion || !config) return

        const delta = correct ? config.scorePerCorrect : -config.deductionPerWrong
        updateScore(activeTeam.id, delta)

        // Final state for the turn
        nextTeam()
        useQuizStore.setState({ currentQuestion: null })
    }

    return (
        <div className="h-full w-full flex flex-col gap-6 p-6">
            {/* Header: Mission Status */}
            <TvPanel elevation="raised" padding="md" className="flex justify-between items-center border-l-4 border-l-tv-accent">
                <div className="flex gap-12">
                    <div>
                        <TvText variant="label">Current Round</TvText>
                        <TvText variant="h2" className="text-tv-accent">PHASE {currentRound}</TvText>
                    </div>
                    <div>
                        <TvText variant="label">Active Operative</TvText>
                        <TvText variant="h2" style={{ color: activeTeam?.color }}>{activeTeam?.name || 'AWAITING...'}</TvText>
                    </div>
                </div>

                <div className="flex gap-4">
                    <TvButton variant="secondary" size="md" iconLeft={isPaused ? <Play size={18} /> : <Pause size={18} />} onClick={() => setPaused(!isPaused)}>
                        {isPaused ? 'RESUME' : 'PAUSE'}
                    </TvButton>
                    <TvButton variant="ghost" size="sm" className="text-tv-danger hover:bg-tv-danger/10" iconLeft={<ShieldAlert size={18} />} onClick={() => setUiScreen('COMMAND_CENTER')}>
                        ABORT
                    </TvButton>
                </div>
            </TvPanel>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Center: Stage Stage Area */}
                <TvPanel elevation="floating" padding="lg" className="col-span-8 flex flex-col items-center justify-center text-center gap-10 relative">
                    {!currentQuestion ? (
                        <div className="flex flex-col items-center gap-8 animate-rise">
                            <div className="p-10 rounded-full bg-tv-accentSoft border border-tv-accent/20 animate-pulse">
                                <Zap size={64} className="text-tv-accent" />
                            </div>
                            <div className="space-y-2">
                                <TvText variant="h1" className="text-4xl">READY FOR ENGAGEMENT</TvText>
                                <TvText variant="muted">System awaits next question stage trigger.</TvText>
                            </div>
                            <TvButton variant="primary" size="xl" glow onClick={handlePickQuestion}>
                                INITIATE NEXT STAGE
                            </TvButton>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-10 animate-fadeIn overflow-hidden">
                            <TvText variant="body" align="center" className="text-2xl lg:text-3xl font-semibold max-w-3xl mx-auto">
                                {currentQuestion.question}
                            </TvText>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
                                {(['A', 'B', 'C', 'D'] as const).map(key => (
                                    <OptionControl
                                        key={key}
                                        label={key}
                                        text={currentQuestion.options[key]}
                                        isActive={currentQuestion.answer === key}
                                        isSelected={selectedAnswer === key}
                                        onClick={() => setSelectedAnswer(key)}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-center gap-6 mt-4">
                                <TvButton
                                    variant="primary"
                                    className="px-10 py-4 bg-tv-success hover:bg-tv-success/80 border-tv-success text-white"
                                    iconLeft={<CheckCircle2 size={20} />}
                                    onClick={() => handleResult(true)}
                                >
                                    CORRECT (+{config?.scorePerCorrect})
                                </TvButton>
                                <TvButton
                                    variant="danger"
                                    className="px-10 py-4"
                                    iconLeft={<XCircle size={20} />}
                                    onClick={() => handleResult(false)}
                                >
                                    WRONG (-{config?.deductionPerWrong})
                                </TvButton>
                            </div>
                        </div>
                    )}
                </TvPanel>

                {/* Sidebar: Status Rack */}
                <div className="col-span-4 flex flex-col gap-6">
                    {/* Timer Zone */}
                    <TvPanel elevation="raised" className="flex flex-col items-center py-10 gap-4">
                        <TvText variant="label">System Clock</TvText>
                        <TvProgressRing
                            duration={config?.timerSeconds || 30}
                            remaining={timerRemaining}
                            size={180}
                            strokeWidth={10}
                        />
                    </TvPanel>

                    {/* Team Standings */}
                    <TvPanel elevation="raised" className="flex-1 flex flex-col gap-6 overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-tv-border pb-4">
                            <Trophy size={18} className="text-tv-accent" />
                            <TvText variant="h3" className="text-sm">Standings</TvText>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-20">
                            {teams.map((team, idx) => (
                                <div key={team.id} className={`p-4 rounded-md border flex items-center justify-between transition-all ${currentTeamIndex === idx ? 'bg-tv-accentSoft border-tv-accent shadow-glow' : 'bg-tv-panel border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: team.color }} />
                                        <TvText variant="body" className="text-sm font-semibold tracking-wide uppercase">{team.name}</TvText>
                                    </div>
                                    <TvText variant="h3" className="text-tv-accent">{team.score}</TvText>
                                </div>
                            ))}
                        </div>
                    </TvPanel>

                    {/* Quick Tools */}
                    <TvPanel elevation="raised" className="p-4 flex justify-between items-center">
                        <div className="flex gap-2">
                            <TvButton variant="ghost" size="sm" iconLeft={<Volume2 size={18} />} />
                            <TvButton variant="ghost" size="sm" iconLeft={<RotateCcw size={18} />} />
                        </div>
                        <TvButton variant="secondary" size="sm" onClick={() => setCurrentState('LEADERBOARD')}>
                            SHOW BOARD
                        </TvButton>
                    </TvPanel>
                </div>
            </div>
        </div>
    )
}

function OptionControl({ label, text, isActive, isSelected, onClick }: { label: string, text: string, isActive: boolean, isSelected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-5 rounded-lg border text-left flex items-start gap-4 transition-all duration-300 relative overflow-hidden group ${isSelected
                ? 'bg-tv-accentSoft border-tv-accent shadow-glow'
                : 'bg-tv-panel border-tv-border hover:border-tv-accent/50'
                }`}
        >
            <div className={`w-8 h-8 rounded border flex items-center justify-center font-timer shrink-0 transition-colors ${isSelected ? 'bg-tv-accent text-tv-bg border-tv-accent' : 'bg-tv-bg border-tv-border text-tv-textMuted'}`}>
                {label}
            </div>
            <div className="space-y-1">
                <TvText variant="body" className={`text-base flex-1 ${isSelected ? 'text-tv-accent' : 'text-tv-textPrimary'}`}>{text}</TvText>
                {/* Admin visual hint for the correct answer */}
                {isActive && (
                    <TvText variant="label" className="text-[8px] text-tv-success/60 tracking-tighter">System Hint: Match Verified</TvText>
                )}
            </div>
        </button>
    )
}
