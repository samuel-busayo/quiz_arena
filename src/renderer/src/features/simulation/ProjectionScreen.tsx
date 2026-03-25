import React, { useEffect } from 'react'
import { ProjectionLayout } from '../../layouts/ProjectionLayout'
import { TvText } from '../../components/ui/TvText'
import { TvProgressRing } from '../../components/ui/TvProgressRing'
import { TvCard } from '../../components/ui/TvCard'
import { useQuizStore } from '../../store/useQuizStore'

export function ProjectionScreen() {
    const {
        currentState,
        teams,
        config,
        currentRound,
        currentTeamIndex,
        currentQuestion,
        timerRemaining,
        isPaused
    } = useQuizStore()

    const activeTeam = teams[currentTeamIndex]

    return (
        <ProjectionLayout>
            {!currentQuestion ? (
                <div className="flex flex-col items-center gap-12 text-center animate-rise">
                    <div className="space-y-4">
                        <TvText variant="label" className="text-tv-accent text-xl tracking-[0.5em]">TECHVERSE ARENA</TvText>
                        <TvText variant="h1" className="text-6xl lg:text-8xl">WAITING FOR INITIALIZATION</TvText>
                    </div>

                    <div className="flex gap-20 items-center justify-center w-full max-w-5xl">
                        {teams.map((team) => (
                            <div key={team.id} className="flex flex-col items-center gap-4">
                                <div className="w-4 h-24 rounded-full shadow-glow" style={{ backgroundColor: team.color }} />
                                <TvText variant="h2" className="text-2xl">{team.name}</TvText>
                                <TvText variant="h1" className="text-5xl text-tv-accent">{team.score}</TvText>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-16 animate-fadeIn items-center">
                    {/* Top Status */}
                    <div className="flex justify-between items-center w-full border-b border-tv-border/20 pb-10">
                        <div className="flex flex-col gap-2">
                            <TvText variant="label" className="text-tv-accent">ROUND 0{currentRound}</TvText>
                            <TvText variant="h2" className="text-4xl" style={{ color: activeTeam?.color }}>{activeTeam?.name}</TvText>
                        </div>
                        <TvProgressRing
                            duration={config?.timerSeconds || 30}
                            remaining={timerRemaining}
                            size={140}
                            strokeWidth={12}
                        />
                    </div>

                    {/* Question Stage */}
                    <div className="w-full text-center space-y-12">
                        <TvText variant="body" align="center" className="text-5xl lg:text-7xl font-bold max-w-6xl mx-auto">
                            {currentQuestion.question}
                        </TvText>

                        <div className="grid grid-cols-2 gap-10 w-full max-w-6xl mx-auto">
                            {(['A', 'B', 'C', 'D'] as const).map(key => (
                                <TvCard
                                    key={key}
                                    className="p-10 flex items-center gap-8 bg-tv-panel/40 border-tv-border transition-all duration-500"
                                >
                                    <div className="w-16 h-16 rounded border-2 flex items-center justify-center font-timer text-3xl text-tv-accent border-tv-accent">
                                        {key}
                                    </div>
                                    <TvText variant="body" className="text-3xl text-left font-semibold">
                                        {currentQuestion.options[key]}
                                    </TvText>
                                </TvCard>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </ProjectionLayout>
    )
}
