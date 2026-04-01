import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandCenterLayout } from '../../layouts/CommandCenterLayout'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { Users, Database, Settings, Play, ArrowLeft, Plus, Trash2, Check, Info, Shield, Zap, Target, ShieldCheck } from 'lucide-react'
import { useQuizStore, Team, QuizConfig } from '../../store/useQuizStore'
import { cn } from '../../utils/cn'

const TEAM_COLORS = [
    '#00D1FF', '#FF3D00', '#22C55E', '#EAB308', '#A855F7', '#F97316', '#FFFFFF'
]

export function QuizSetupScreen() {
    const { systemSettings, setUiScreen, setConfig, setTeams, setQuestions, setCurrentState, setupDraft, updateSetupDraft } = useQuizStore()
    const { step, teams: setupTeams, collectionName: selectedCollection, config: setupConfig } = setupDraft
    const [collections, setCollections] = useState<string[]>([])
    const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        loadCollections()
    }, [])

    // Auto-fill event name from organization if not set
    useEffect(() => {
        if (!setupConfig.eventName && systemSettings.organizationName) {
            updateSetupDraft({
                config: {
                    ...setupConfig,
                    eventName: systemSettings.organizationName.toUpperCase()
                }
            })
        }
    }, [systemSettings.organizationName, setupConfig.eventName])

    const loadCollections = async () => {
        const list = await window.api.getCollections()
        setCollections(list)

        // Fetch counts
        const counts: Record<string, number> = {}
        for (const name of list) {
            const data = await window.api.getCollection(name)
            counts[name] = data?.length || 0
        }
        setCollectionCounts(counts)
    }

    const startSimulation = async () => {
        if (!selectedCollection) return

        const required = (setupConfig.rounds! * setupConfig.takesPerRound! * setupTeams.length) + 10
        const available = collectionCounts[selectedCollection] || 0

        if (available < required) {
            alert(`INSUFFICIENT DATA: Selected source contains ${available} questions. Required minimum: ${required} (including tie-breaker buffer). Please append more questions to the collection.`)
            return
        }

        const questions = await window.api.getCollection(selectedCollection)
        if (!questions || questions.length === 0) {
            alert('Selection contains no valid question stages.')
            return
        }

        setConfig({ ...setupConfig, collectionName: selectedCollection } as QuizConfig)
        setTeams(setupTeams as Team[])
        setQuestions(questions)
        setCurrentState('ARMING')
        setUiScreen('SIMULATION_CONSOLE')
    }

    const handleAppend = async (target: string) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.txt'
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = async (event) => {
                const text = event.target?.result as string
                const questions: any[] = []
                const blocks = text.split('---').map(b => b.trim()).filter(b => b.length > 0)

                blocks.forEach((block, index) => {
                    const lines = block.split('\n').map(l => l.trim())
                    const q: any = { id: `q${Date.now()}_${index}`, options: { A: '', B: '', C: '', D: '' }, used: false }
                    lines.forEach(line => {
                        if (line.startsWith('Q:')) q.question = line.replace('Q:', '').trim()
                        if (line.startsWith('A:')) q.options.A = line.replace('A:', '').trim()
                        if (line.startsWith('B:')) q.options.B = line.replace('B:', '').trim()
                        if (line.startsWith('C:')) q.options.C = line.replace('C:', '').trim()
                        if (line.startsWith('D:')) q.options.D = line.replace('D:', '').trim()
                        if (line.startsWith('ANS:')) q.answer = line.replace('ANS:', '').trim()
                    })
                    if (q.question && q.answer) questions.push(q)
                })

                if (questions.length > 0) {
                    const existing = await window.api.getCollection(target)
                    const updated = [...(existing || []), ...questions]
                    await window.api.saveCollection(target, updated)
                    await loadCollections()
                }
            }
            reader.readAsText(file)
        }
        input.click()
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
                        <StepItem num={1} label="Teams" active={step === 1} done={step > 1} onClick={() => updateSetupDraft({ step: 1 })} icon={<Users size={16} />} />
                        <StepItem num={2} label="Source" active={step === 2} done={step > 2} onClick={() => updateSetupDraft({ step: 2 })} icon={<Database size={16} />} />
                        <StepItem num={3} label="Rules" active={step === 3} done={step > 3} onClick={() => updateSetupDraft({ step: 3 })} icon={<Settings size={16} />} />
                        <StepItem num={4} label="Mode" active={step === 4} done={step > 4} onClick={() => updateSetupDraft({ step: 4 })} icon={<Target size={16} />} />
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
                        {step > 1 && <TvButton variant="secondary" onClick={() => updateSetupDraft({ step: step - 1 })}>PREVIOUS</TvButton>}
                        {step < 4 ? (
                            <TvButton variant="primary" onClick={() => updateSetupDraft({ step: step + 1 })}>NEXT PHASE</TvButton>
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
                                        <button className="text-tv-textMuted hover:text-tv-danger transition-colors p-1" onClick={() => updateSetupDraft({ teams: setupTeams.filter(t => t.id !== team.id) })}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-transparent border-b border-tv-border py-2 font-display text-xl text-tv-accent outline-none focus:border-tv-accent transition-colors select-text"
                                        value={team.name}
                                        onChange={(e) => {
                                            const next = [...setupTeams]
                                            next[idx] = { ...next[idx], name: e.target.value.toUpperCase() }
                                            updateSetupDraft({ teams: next })
                                        }}
                                    />
                                    <div className="flex gap-3">
                                        {TEAM_COLORS.map(c => {
                                            const isPicked = setupTeams.some((t, tIdx) => t.color === c && tIdx !== idx)
                                            const isCurrSelected = team.color === c
                                            return (
                                                <button
                                                    key={c}
                                                    disabled={isPicked && !isCurrSelected}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${isCurrSelected ? 'border-white scale-110 shadow-glow' : isPicked ? 'border-transparent opacity-5 cursor-not-allowed scale-75' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-110'}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => {
                                                        const next = [...setupTeams]
                                                        next[idx].color = c
                                                        updateSetupDraft({ teams: next })
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                </TvCard>
                            ))}
                            <TvCard
                                hoverable={setupTeams.length < 4}
                                className={cn(
                                    "p-6 border-dashed flex flex-col items-center justify-center gap-4 text-tv-textMuted group",
                                    setupTeams.length < 4 ? "hover:text-tv-accent cursor-pointer" : "opacity-20 cursor-not-allowed"
                                )}
                                onClick={() => {
                                    if (setupTeams.length < 4) {
                                        const nextColor = TEAM_COLORS.find(c => !setupTeams.some(t => t.color === c)) || '#FFFFFF'
                                        updateSetupDraft({ teams: [...setupTeams, { id: Date.now().toString(), name: `TEAM ${setupTeams.length + 1}`, color: nextColor, score: 0, isEliminated: false }] })
                                    }
                                }}
                            >
                                <div className={cn("p-4 rounded-full bg-tv-panel border border-tv-border transition-colors", setupTeams.length < 4 && "group-hover:border-tv-accent")}>
                                    <Plus size={32} />
                                </div>
                                <TvText variant="h3">{setupTeams.length < 4 ? 'ADD TEAM' : 'QUOTA REACHED'}</TvText>
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
                                    className="px-8 py-6 min-w-[240px] flex flex-col items-center gap-3 animate-rise group"
                                    onClick={() => updateSetupDraft({ collectionName: name })}
                                >
                                    <Database size={24} className={selectedCollection === name ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                    <div className="text-center">
                                        <TvText variant="h3" className="text-sm">{name}</TvText>
                                        <TvText variant="muted" className="text-[10px] tracking-widest">{collectionCounts[name] || 0} ITEMS</TvText>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAppend(name); }}
                                        className="mt-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 px-3 py-1 rounded bg-tv-accentSoft text-tv-accent text-[9px] font-bold border border-tv-accent/20 hover:bg-tv-accent hover:text-white"
                                    >
                                        <Plus size={10} />
                                        APPEND DATA
                                    </button>

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
                        <div className="space-y-10 max-w-2xl">
                            <div className="p-8 bg-tv-panel/60 border border-tv-border rounded-xl space-y-6 focus-within:border-tv-accent focus-within:shadow-glow-soft hover:bg-tv-panel/80 transition-all group">
                                <div className="flex items-center gap-3 text-tv-accent group-focus-within:animate-pulse">
                                    <Info size={20} />
                                    <TvText variant="label" className="text-sm tracking-widest uppercase">Event Branding</TvText>
                                </div>
                                <input
                                    placeholder="ENTER EVENT NAME (E.G. INTER-HOUSE QUIZ)"
                                    className="w-full bg-transparent border-b border-tv-border py-4 font-display text-[clamp(1.5rem,4vh,3.5rem)] text-white font-black outline-none focus:border-tv-accent transition-colors placeholder:opacity-10 placeholder:text-white uppercase tracking-tighter select-text"
                                    value={setupConfig.eventName || ''}
                                    onChange={(e) => updateSetupDraft({ config: { ...setupConfig, eventName: e.target.value.toUpperCase() } })}
                                />

                                <div className="pt-4 border-t border-tv-border/30">
                                    <div className="flex items-center gap-2 text-tv-accent/60 mb-2">
                                        <Target size={14} />
                                        <TvText variant="label" className="text-[10px] tracking-widest uppercase">Program Theme</TvText>
                                    </div>
                                    <input
                                        placeholder="ENTER PROGRAM THEME (E.G. KNOWLEDGE IS POWER)"
                                        className="w-full bg-transparent border-b border-tv-border/50 py-2 font-display text-xl text-tv-accent outline-none focus:border-tv-accent transition-colors placeholder:opacity-5 uppercase select-text"
                                        value={setupConfig.eventTheme || ''}
                                        onChange={(e) => updateSetupDraft({ config: { ...setupConfig, eventTheme: e.target.value.toUpperCase() } })}
                                    />
                                </div>

                                <TvText variant="muted" className="text-xs opacity-40 italic mt-2">These identity markers will be displayed prominently on the Projection Standby screen.</TvText>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <ConfigField
                                    label="Number of Rounds"
                                    value={setupConfig.rounds || 3}
                                    onChange={(val) => updateSetupDraft({ config: { ...setupConfig, rounds: val } })}
                                    icon={<Zap size={16} />}
                                />
                                <ConfigField
                                    label="Takes Per Round"
                                    value={setupConfig.takesPerRound || 2}
                                    onChange={(val) => updateSetupDraft({ config: { ...setupConfig, takesPerRound: val } })}
                                    icon={<Zap size={16} />}
                                />
                                <ConfigField
                                    label="Timer Seconds"
                                    value={setupConfig.timerSeconds || 30}
                                    onChange={(val) => updateSetupDraft({ config: { ...setupConfig, timerSeconds: val } })}
                                    icon={<Zap size={16} />}
                                />
                                <ConfigField
                                    label="Points Per Correct"
                                    value={setupConfig.scorePerCorrect || 10}
                                    onChange={(val) => updateSetupDraft({ config: { ...setupConfig, scorePerCorrect: val } })}
                                    icon={<Zap size={16} />}
                                />
                            </div>

                            {/* CAPACITY METER */}
                            {selectedCollection && (
                                <div className="p-6 rounded-xl bg-tv-panel border border-tv-border relative overflow-hidden">
                                    {(() => {
                                        const req = (setupConfig.rounds! * setupConfig.takesPerRound! * setupTeams.length) + 10
                                        const avail = collectionCounts[selectedCollection] || 0
                                        const percent = Math.min(100, (avail / req) * 100)
                                        const isLow = avail < req

                                        return (
                                            <>
                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <TvText variant="label" className="text-[10px] text-tv-textMuted block mb-1">STATION DATA CAPACITY</TvText>
                                                        <TvText variant="h3" className={isLow ? "text-tv-warning" : "text-tv-accent"}>
                                                            {isLow ? "INSUFFICIENT QUESTIONS" : "LINK STABLE"}
                                                        </TvText>
                                                    </div>
                                                    <div className="text-right">
                                                        <TvText variant="label" className="text-[10px] text-tv-textMuted block mb-1">AVN / REQ (+10)</TvText>
                                                        <TvText variant="h3" className="text-lg font-mono">{avail} / {req}</TvText>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-black/40 rounded-full border border-tv-border overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        className={cn("h-full", isLow ? "bg-tv-warning shadow-glow-soft" : "bg-tv-accent shadow-glow")}
                                                    />
                                                </div>
                                                {isLow && (
                                                    <TvText variant="muted" className="text-[10px] mt-4 flex items-center gap-2 text-tv-warning animate-pulse">
                                                        <Shield size={12} />
                                                        CRITICAL: Append questions to reach the simulation threshold.
                                                    </TvText>
                                                )}
                                            </>
                                        )
                                    })()}
                                </div>
                            )}

                            {/* LIFELINE SETTINGS */}
                            <div className="p-8 bg-tv-panel/40 border border-white/5 rounded-xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-tv-accentSoft">
                                            <ShieldCheck size={20} className="text-tv-accent" />
                                        </div>
                                        <div>
                                            <TvText variant="h3" className="text-lg">50/50 LIFELINE</TvText>
                                            <TvText variant="muted" className="text-xs">Automatically remove two wrong choices</TvText>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateSetupDraft({
                                            config: {
                                                ...setupConfig,
                                                lifelineConfig: {
                                                    enabled: !setupConfig.lifelineConfig?.enabled,
                                                    usesPerTeam: setupConfig.lifelineConfig?.usesPerTeam || 2
                                                }
                                            }
                                        })}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-colors duration-300",
                                            setupConfig.lifelineConfig?.enabled ? "bg-tv-accent" : "bg-white/10"
                                        )}
                                    >
                                        <motion.div
                                            animate={{ x: setupConfig.lifelineConfig?.enabled ? 24 : 4 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                        />
                                    </button>
                                </div>

                                {setupConfig.lifelineConfig?.enabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="pt-4 border-t border-white/5 flex items-center justify-between"
                                    >
                                        <TvText variant="body" className="text-sm opacity-60">Uses per team (MAX 3)</TvText>
                                        <div className="flex items-center gap-4 bg-black/20 rounded-lg p-1 border border-white/5">
                                            {[1, 2, 3].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => updateSetupDraft({
                                                        config: {
                                                            ...setupConfig,
                                                            lifelineConfig: {
                                                                enabled: true,
                                                                usesPerTeam: val
                                                            }
                                                        }
                                                    })}
                                                    className={cn(
                                                        "w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-all",
                                                        setupConfig.lifelineConfig?.usesPerTeam === val ? "bg-tv-accent text-black" : "text-white/40 hover:text-white"
                                                    )}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="grid grid-cols-2 gap-6 max-w-3xl">
                            <TvCard
                                hoverable
                                selected={setupConfig.mode === 'RANDOM'}
                                className="p-10 flex flex-col items-center gap-6 text-center"
                                onClick={() => updateSetupDraft({ config: { ...setupConfig, mode: 'RANDOM' } })}
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
                                className="p-10 flex flex-col items-center gap-6 text-center"
                                onClick={() => updateSetupDraft({ config: { ...setupConfig, mode: 'PICK_NUMBER' } })}
                            >
                                <Target size={48} className={setupConfig.mode === 'PICK_NUMBER' ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                <div>
                                    <TvText variant="h3">PICK NUMBER MODE</TvText>
                                    <TvText variant="muted" className="mt-2">Teams select their preferred question identity from the neural grid.</TvText>
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
                        {selectedCollection && (
                            <StatusChip
                                active={collectionCounts[selectedCollection] >= (setupConfig.rounds! * setupConfig.takesPerRound! * setupTeams.length) + 10}
                                label={`CAPACITY: ${collectionCounts[selectedCollection]} / ${(setupConfig.rounds! * setupConfig.takesPerRound! * setupTeams.length) + 10}`}
                            />
                        )}
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
