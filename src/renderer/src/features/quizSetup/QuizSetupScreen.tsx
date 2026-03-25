import React, { useState, useEffect } from 'react'
import { CommandCenterLayout } from '../../layouts/CommandCenterLayout'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { Users, Database, Settings, Play, ArrowLeft, Plus, Trash2, Check, Info, Shield, Zap, Target } from 'lucide-react'
import { useQuizStore, Team, QuizConfig } from '../../store/useQuizStore'

const TEAM_COLORS = [
    '#00D1FF', '#FF3D00', '#22C55E', '#EAB308', '#A855F7', '#F97316', '#FFFFFF'
]

export function QuizSetupScreen() {
    const { setUiScreen, setConfig, setTeams, setQuestions, setCurrentState } = useQuizStore()
    const [step, setStep] = useState(1)

    // Setup State
    const [setupTeams, setSetupTeams] = useState<Partial<Team>[]>([
        { id: '1', name: 'TEAM ALPHA', color: '#00D1FF', score: 0, isEliminated: false },
        { id: '2', name: 'TEAM BETA', color: '#FF3D00', score: 0, isEliminated: false }
    ])
    const [collections, setCollections] = useState<string[]>([])
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
    const [setupConfig, setSetupConfig] = useState<QuizConfig>({
        rounds: 3,
        takesPerRound: 2,
        timerSeconds: 30,
        extraTimerSeconds: 15,
        scorePerCorrect: 10,
        deductionPerWrong: 5,
        showLeaderboardAfterRound: true,
        mode: 'RANDOM'
    })

    useEffect(() => {
        window.api.getCollections().then(setCollections)
    }, [])

    const startSimulation = async () => {
        if (!selectedCollection) return
        const questions = await window.api.getCollection(selectedCollection)
        if (!questions || questions.length === 0) {
            alert('Selection contains no valid question stages.')
            return
        }

        setConfig(setupConfig)
        setTeams(setupTeams as Team[])
        setQuestions(questions)
        setCurrentState('SIMULATION_PREPARATION')
        setUiScreen('SIMULATION_CONSOLE')
    }

    return (
        <CommandCenterLayout
            sidebar={
                <div className="h-full flex flex-col p-4 gap-8">
                    <div className="flex items-center gap-3">
                        <TvButton variant="ghost" size="sm" iconLeft={<ArrowLeft size={18} />} onClick={() => setUiScreen('COMMAND_CENTER')} />
                        <TvText variant="h3">System Arming</TvText>
                    </div>

                    <div className="space-y-4">
                        <StepItem num={1} label="Teams" active={step === 1} done={step > 1} onClick={() => setStep(1)} icon={<Users size={16} />} />
                        <StepItem num={2} label="Source" active={step === 2} done={step > 2} onClick={() => setStep(2)} icon={<Database size={16} />} />
                        <StepItem num={3} label="Rules" active={step === 3} done={step > 3} onClick={() => setStep(3)} icon={<Settings size={16} />} />
                        <StepItem num={4} label="Mode" active={step === 4} done={step > 4} onClick={() => setStep(4)} icon={<Target size={16} />} />
                    </div>

                    <div className="mt-auto p-4 rounded-lg bg-tv-panel border border-tv-border">
                        <div className="flex items-center gap-2 mb-2 text-tv-accent">
                            <Shield size={14} />
                            <TvText variant="label" className="tracking-tighter">System Integrity</TvText>
                        </div>
                        <TvText variant="muted" className="text-[10px]">Ensure all team identities are finalized before initiating launch sequence.</TvText>
                    </div>
                </div>
            }
        >
            <TvPanel elevation="raised" padding="lg" className="flex-1 flex flex-col gap-10 overflow-hidden relative">
                {/* Step Header */}
                <div className="border-b border-tv-border pb-6 flex justify-between items-center">
                    <div>
                        <TvText variant="label" className="text-tv-accent mb-1">Phase 0{step}</TvText>
                        <TvText variant="h2">{step === 1 ? 'TEAM REGISTRATION' : step === 2 ? 'QUESTION SOURCE' : step === 3 ? 'COMPETITION RULES' : 'ENGAGEMENT MODE'}</TvText>
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && <TvButton variant="secondary" onClick={() => setStep(step - 1)}>PREVIOUS</TvButton>}
                        {step < 4 ? (
                            <TvButton variant="primary" onClick={() => setStep(step + 1)}>NEXT PHASE</TvButton>
                        ) : (
                            <TvButton variant="primary" glow onClick={startSimulation} disabled={!selectedCollection || setupTeams.length < 2}>INITIATE SIMULATION</TvButton>
                        )}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-6">
                            {setupTeams.map((team, idx) => (
                                <TvCard key={team.id} className="p-6 space-y-4 group">
                                    <div className="flex justify-between items-start">
                                        <TvText variant="label">Unit 0{idx + 1}</TvText>
                                        <button className="text-tv-textMuted hover:text-tv-danger transition-colors p-1" onClick={() => setSetupTeams(setupTeams.filter(t => t.id !== team.id))}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-transparent border-b border-tv-border py-2 font-display text-xl text-tv-accent outline-none focus:border-tv-accent transition-colors"
                                        value={team.name}
                                        onChange={(e) => {
                                            const next = [...setupTeams]
                                            next[idx].name = e.target.value.toUpperCase()
                                            setSetupTeams(next)
                                        }}
                                    />
                                    <div className="flex gap-3">
                                        {TEAM_COLORS.map(c => (
                                            <button
                                                key={c}
                                                className={`w-6 h-6 rounded-full border-2 transition-all ${team.color === c ? 'border-white scale-110 shadow-glow' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => {
                                                    const next = [...setupTeams]
                                                    next[idx].color = c
                                                    setSetupTeams(next)
                                                }}
                                            />
                                        ))}
                                    </div>
                                </TvCard>
                            ))}
                            <TvCard
                                hoverable
                                className="p-6 border-dashed flex flex-col items-center justify-center gap-4 text-tv-textMuted group hover:text-tv-accent"
                                onClick={() => setSetupTeams([...setupTeams, { id: Date.now().toString(), name: `TEAM ${setupTeams.length + 1}`, color: '#FFFFFF', score: 0, isEliminated: false }])}
                            >
                                <div className="p-4 rounded-full bg-tv-panel border border-tv-border group-hover:border-tv-accent transition-colors">
                                    <Plus size={32} />
                                </div>
                                <TvText variant="h3">ADD TEAM</TvText>
                            </TvCard>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-wrap gap-4">
                            {collections.map(name => (
                                <TvCard
                                    key={name}
                                    hoverable
                                    selected={selectedCollection === name}
                                    className="px-8 py-6 min-w-[200px] flex flex-col items-center gap-3 animate-rise"
                                    onClick={() => setSelectedCollection(name)}
                                >
                                    <Database size={24} className={selectedCollection === name ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                    <TvText variant="h3" className="text-sm">{name}</TvText>
                                    {selectedCollection === name && (
                                        <div className="absolute top-2 right-2 text-tv-accent">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </TvCard>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-2 gap-10 max-w-2xl">
                            <ConfigField
                                label="Number of Rounds"
                                value={setupConfig.rounds}
                                onChange={(val) => setSetupConfig({ ...setupConfig, rounds: val })}
                                icon={<Zap size={16} />}
                            />
                            <ConfigField
                                label="Takes Per Round"
                                value={setupConfig.takesPerRound}
                                onChange={(val) => setSetupConfig({ ...setupConfig, takesPerRound: val })}
                                icon={<Zap size={16} />}
                            />
                            <ConfigField
                                label="Timer Seconds"
                                value={setupConfig.timerSeconds}
                                onChange={(val) => setSetupConfig({ ...setupConfig, timerSeconds: val })}
                                icon={<Zap size={16} />}
                            />
                            <ConfigField
                                label="Points Per Correct"
                                value={setupConfig.scorePerCorrect}
                                onChange={(val) => setSetupConfig({ ...setupConfig, scorePerCorrect: val })}
                                icon={<Zap size={16} />}
                            />
                        </div>
                    )}

                    {step === 4 && (
                        <div className="grid grid-cols-2 gap-6 max-w-3xl">
                            <TvCard
                                hoverable
                                selected={setupConfig.mode === 'RANDOM'}
                                className="p-10 flex flex-col items-center gap-6 text-center"
                                onClick={() => setSetupConfig({ ...setupConfig, mode: 'RANDOM' })}
                            >
                                <Zap size={48} className={setupConfig.mode === 'RANDOM' ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                <div>
                                    <TvText variant="h3">RANDOM MODE</TvText>
                                    <TvText variant="muted" className="mt-2">Questions are selected automatically by the system AI.</TvText>
                                </div>
                            </TvCard>

                            <TvCard
                                hoverable
                                selected={setupConfig.mode === 'PICK_NUMBER'}
                                className="p-10 flex flex-col items-center gap-6 text-center opacity-40"
                                onClick={() => { }} // Not fully implemented yet
                            >
                                <Target size={48} className="text-tv-textMuted" />
                                <div>
                                    <TvText variant="h3">PICK NUMBER MODE</TvText>
                                    <TvText variant="muted" className="mt-2 text-tv-danger/60 italic">(COMING SOON)</TvText>
                                </div>
                            </TvCard>
                        </div>
                    )}
                </div>

                {/* Footer Status Bar */}
                <div className="mt-auto pt-6 border-t border-tv-border flex items-center justify-between text-tv-textMuted">
                    <div className="flex gap-6 items-center">
                        <StatusChip active={setupTeams.length >= 2} label={`${setupTeams.length} TEAMS`} />
                        <StatusChip active={!!selectedCollection} label={selectedCollection || 'NO SOURCE'} />
                        <StatusChip active={true} label={`R${setupConfig.rounds} // T${setupConfig.takesPerRound}`} />
                    </div>
                </div>
            </TvPanel>
        </CommandCenterLayout>
    )
}

function StepItem({ num, label, active, done, onClick, icon }: { num: number, label: string, active: boolean, done: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all border ${active ? 'bg-tv-accentSoft border-tv-accent text-tv-accent shadow-glow' : 'bg-tv-panel border-transparent text-tv-textMuted hover:border-tv-border'}`}
        >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-xs border ${done ? 'bg-tv-accent text-white border-tv-accent' : active ? 'border-tv-accent' : 'border-tv-border'}`}>
                {done ? <Check size={12} /> : num}
            </div>
            <span className="font-display tracking-widest text-sm font-semibold">{label}</span>
            <div className="ml-auto opacity-40">{icon}</div>
        </button>
    )
}

function ConfigField({ label, value, onChange, icon }: { label: string, value: number, onChange: (val: number) => void, icon: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-tv-textMuted">
                {icon}
                <TvText variant="label">{label}</TvText>
            </div>
            <div className="flex items-center gap-4">
                <button
                    className="w-10 h-10 rounded border border-tv-border flex items-center justify-center hover:bg-tv-panel transition-colors text-xl font-display"
                    onClick={() => onChange(Math.max(1, value - 1))}
                >-</button>
                <div className="flex-1 bg-tv-panel border border-tv-border rounded h-10 flex items-center justify-center font-display text-xl text-tv-accent">
                    {value}
                </div>
                <button
                    className="w-10 h-10 rounded border border-tv-border flex items-center justify-center hover:bg-tv-panel transition-colors text-xl font-display"
                    onClick={() => onChange(value + 1)}
                >+</button>
            </div>
        </div>
    )
}

function StatusChip({ active, label }: { active: boolean, label: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-orbitron tracking-tighter ${active ? 'border-tv-accent/50 text-tv-accent' : 'border-tv-border grayscale opacity-50'}`}>
            <div className={`w-1 h-1 rounded-full ${active ? 'bg-tv-accent' : 'bg-tv-textMuted'}`} />
            {label}
        </div>
    )
}
