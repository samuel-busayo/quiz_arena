import React, { useState, useEffect } from 'react'
import { TechCard } from '../components/ui/TechCard'
import { TechButton } from '../components/ui/TechButton'
import { Database, Play, Settings, History, Plus, Upload, Edit3, Trash2, Loader2, Users, Clock, Trophy, X, Save } from 'lucide-react'
import { Question, useQuizStore, Team, QuizConfig } from '../store/useQuizStore'

export function AdminScreen() {
    const [activeTab, setActiveTab] = useState<'database' | 'simulation' | 'settings'>('database')
    const [collections, setCollections] = useState<string[]>([])
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)

    // Modals
    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

    // Simulation Setup State
    const [setupTeams, setSetupTeams] = useState<Partial<Team>[]>([
        { id: '1', name: 'Team Alpha', color: '#00E5FF', score: 0, isEliminated: false },
        { id: '2', name: 'Team Beta', color: '#FF3D00', score: 0, isEliminated: false }
    ])
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

    const {
        currentState,
        setCurrentState,
        setConfig,
        setTeams,
        setQuestions,
        tickTimer,
        updateScore,
        nextTeam,
        currentQuestion,
        timerRemaining,
        isPaused,
        setPaused,
        currentTeamIndex,
        resetQuiz
    } = useQuizStore()

    useEffect(() => {
        loadCollections()
    }, [])

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (currentState === 'QUESTION_DISPLAY' && !isPaused && timerRemaining > 0) {
            interval = setInterval(() => {
                tickTimer()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [currentState, isPaused, timerRemaining, tickTimer])

    const loadCollections = async () => {
        const list = await window.api.getCollections()
        setCollections(list)
        if (list.length > 0 && !selectedCollection) {
            handleSelectCollection(list[0])
        }
    }

    const handleSelectCollection = async (name: string) => {
        setSelectedCollection(name)
        setLoading(true)
        const data = await window.api.getCollection(name)
        setCurrentQuestions(data || [])
        setLoading(false)
    }

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return
        const success = await window.api.createCollection(newCollectionName)
        if (success) {
            await loadCollections()
            handleSelectCollection(newCollectionName)
            setNewCollectionName('')
            setShowNewCollectionModal(false)
        }
    }

    const handleDeleteCollection = async (name: string) => {
        if (window.confirm(`Are you sure you want to delete the collection "${name}"?`)) {
            const success = await window.api.deleteCollection(name)
            if (success) {
                await loadCollections()
                if (selectedCollection === name) {
                    setSelectedCollection(null)
                    setCurrentQuestions([])
                }
            }
        }
    }

    const handleSaveQuestion = async (q: Question) => {
        if (!selectedCollection) return
        const updatedQuestions = editingQuestion?.id
            ? currentQuestions.map(item => item.id === editingQuestion.id ? q : item)
            : [...currentQuestions, { ...q, id: `q${Date.now()}` }]

        const success = await window.api.saveCollection(selectedCollection, updatedQuestions)
        if (success) {
            setCurrentQuestions(updatedQuestions)
            setEditingQuestion(null)
        }
    }

    const handleDeleteQuestion = async (id: string) => {
        if (!selectedCollection) return
        if (window.confirm('Delete this question?')) {
            const updated = currentQuestions.filter(q => q.id !== id)
            const success = await window.api.saveCollection(selectedCollection, updated)
            if (success) {
                setCurrentQuestions(updated)
            }
        }
    }

    const startQuiz = () => {
        if (!selectedCollection || currentQuestions.length === 0) return
        setConfig(setupConfig)
        setTeams(setupTeams as Team[])
        setQuestions(currentQuestions)
        setCurrentState('SIMULATION_PREPARATION')
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            if (!text) return

            const questions: Question[] = []
            const blocks = text.split('---').map(b => b.trim()).filter(b => b.length > 0)

            blocks.forEach((block, index) => {
                const lines = block.split('\n').map(l => l.trim())
                const q: Partial<Question> = {
                    id: `q${Date.now()}_${index}`,
                    options: { A: '', B: '', C: '', D: '' },
                    used: false
                }

                lines.forEach(line => {
                    const cleanLine = line.trim()
                    if (cleanLine.startsWith('Q:')) q.question = cleanLine.replace('Q:', '').trim()
                    if (cleanLine.startsWith('A:')) q.options!.A = cleanLine.replace('A:', '').trim()
                    if (cleanLine.startsWith('B:')) q.options!.B = cleanLine.replace('B:', '').trim()
                    if (cleanLine.startsWith('C:')) q.options!.C = cleanLine.replace('C:', '').trim()
                    if (cleanLine.startsWith('D:')) q.options!.D = cleanLine.replace('D:', '').trim()
                    if (cleanLine.startsWith('ANS:')) q.answer = cleanLine.replace('ANS:', '').trim() as 'A' | 'B' | 'C' | 'D'
                })

                if (q.question && q.answer) {
                    questions.push(q as Question)
                }
            })

            if (questions.length > 0) {
                const collectionName = file.name.replace('.txt', '')
                const success = await window.api.saveCollection(collectionName, questions)
                if (success) {
                    loadCollections()
                    handleSelectCollection(collectionName)
                }
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="h-full flex flex-col p-8 gap-8 font-inter relative">
            {/* Dashboard Nav */}
            <div className="flex gap-4">
                <TabButton
                    active={activeTab === 'database'}
                    onClick={() => setActiveTab('database')}
                    icon={<Database size={20} />}
                    label="Question Database"
                />
                <TabButton
                    active={activeTab === 'simulation'}
                    onClick={() => setActiveTab('simulation')}
                    icon={<Play size={20} />}
                    label="Quiz Simulation"
                />
                <TabButton
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    icon={<Settings size={20} />}
                    label="System Settings"
                />
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {activeTab === 'settings' && (
                    <div className="col-span-12 grid grid-cols-2 gap-8">
                        <TechCard className="p-8 space-y-6" glow>
                            <div className="flex items-center gap-3 border-b border-primary-surface pb-4">
                                <History className="text-primary-accent" size={24} />
                                <h3 className="font-orbitron text-xl text-primary-accent">System Management</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-primary-secondary font-rajdhani text-sm uppercase tracking-widest leading-relaxed">
                                    Use this to manually reset the state of the current quiz simulation.
                                    This will clear all scores, team registrations, and question progress.
                                </p>
                                <TechButton
                                    variant="primary"
                                    className="bg-team-red/20 border-team-red text-team-red hover:bg-team-red hover:text-white"
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to RESET the entire simulation?')) {
                                            resetQuiz()
                                        }
                                    }}
                                >
                                    RESET SIMULATION STATE
                                </TechButton>
                            </div>
                        </TechCard>

                        <TechCard className="p-8 space-y-6" glow>
                            <div className="flex items-center gap-3 border-b border-primary-surface pb-4">
                                <Clock className="text-primary-secondary" size={24} />
                                <h3 className="font-orbitron text-xl text-primary-secondary">Application Info</h3>
                            </div>
                            <div className="space-y-2 font-rajdhani text-primary-secondary uppercase tracking-[0.2em] text-xs">
                                <div>Build Version: 1.0.0-PRO</div>
                                <div>Environment: Production (Offline)</div>
                                <div>Persistence: Local Storage Active</div>
                            </div>
                        </TechCard>
                    </div>
                )}

                {activeTab === 'database' && (
                    <>
                        {/* Sidebar: Collections */}
                        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="font-orbitron text-primary-secondary text-sm tracking-widest uppercase">Collections</h3>
                                <TechButton
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 rounded-full"
                                    onClick={() => setShowNewCollectionModal(true)}
                                >
                                    <Plus size={16} />
                                </TechButton>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {collections.map((name) => (
                                    <CollectionItem
                                        key={name}
                                        name={name}
                                        count={0}
                                        active={selectedCollection === name}
                                        onClick={() => handleSelectCollection(name)}
                                        onDelete={() => handleDeleteCollection(name)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Main Content: Question List */}
                        <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
                            <TechCard className="flex-1 flex flex-col gap-4" glow>
                                <div className="flex justify-between items-center border-b border-primary-surface pb-4">
                                    <div>
                                        <h4 className="font-orbitron text-xl text-primary-accent">{selectedCollection || 'No Collection Selected'}</h4>
                                        <p className="text-primary-secondary font-rajdhani text-xs uppercase tracking-widest">{currentQuestions.length} Questions // Local Storage</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".txt"
                                            onChange={handleUpload}
                                        />
                                        <TechButton variant="secondary" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                                            <Upload size={14} className="mr-2" /> UPLOAD .TXT
                                        </TechButton>
                                        <TechButton
                                            variant="primary"
                                            size="sm"
                                            disabled={!selectedCollection}
                                            onClick={() => setEditingQuestion({ id: '', question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', used: false })}
                                        >
                                            <Plus size={14} className="mr-2" /> NEW QUESTION
                                        </TechButton>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {loading ? (
                                        <div className="h-full flex items-center justify-center text-primary-secondary">
                                            <Loader2 className="animate-spin mr-2" /> Loading Questions...
                                        </div>
                                    ) : currentQuestions.length > 0 ? (
                                        currentQuestions.map((q, i) => (
                                            <QuestionListItem
                                                key={q.id || i}
                                                index={i + 1}
                                                text={q.question}
                                                answer={q.options[q.answer]}
                                                onEdit={() => setEditingQuestion(q)}
                                                onDelete={() => handleDeleteQuestion(q.id)}
                                            />
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-primary-secondary font-rajdhani uppercase tracking-widest text-sm text-center">
                                            No questions found. Upload a .txt file to get started.<br />
                                            <span className="text-[10px] mt-2 block opacity-50">Format: Q:, A:, B:, C:, D:, ANS: separated by ---</span>
                                        </div>
                                    )}
                                </div>
                            </TechCard>
                        </div>
                    </>
                )}

                {activeTab === 'simulation' && currentState === 'IDLE' && (
                    <div className="col-span-12 grid grid-cols-12 gap-8 h-full">
                        {/* Team Setup */}
                        <div className="col-span-8 flex flex-col gap-6">
                            <TechCard className="flex-1 flex flex-col gap-6" glow>
                                <div className="flex justify-between items-center border-b border-primary-surface pb-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="text-primary-accent" size={24} />
                                        <h3 className="font-orbitron text-xl text-primary-accent">Team Registration</h3>
                                    </div>
                                    <TechButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSetupTeams([...setupTeams, { id: Date.now().toString(), name: `Team ${setupTeams.length + 1}`, color: '#FFFFFF', score: 0, isEliminated: false }])}
                                    >
                                        <Plus size={16} className="mr-2" /> ADD TEAM
                                    </TechButton>
                                </div>

                                <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {setupTeams.map((team, index) => (
                                        <div key={team.id} className="p-4 bg-primary-surface/50 border border-white/5 rounded-xl flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-full border-2 border-primary-accent/30 flex items-center justify-center font-orbitron text-primary-accent">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    className="bg-transparent border-none outline-none text-primary-text font-orbitron w-full focus:text-primary-accent transition-colors"
                                                    value={team.name}
                                                    onChange={(e) => {
                                                        const newTeams = [...setupTeams]
                                                        newTeams[index].name = e.target.value
                                                        setSetupTeams(newTeams)
                                                    }}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="w-4 h-4 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                                                        value={team.color}
                                                        onChange={(e) => {
                                                            const newTeams = [...setupTeams]
                                                            newTeams[index].color = e.target.value
                                                            setSetupTeams(newTeams)
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-primary-secondary uppercase tracking-widest font-rajdhani">Hex Code: {team.color}</span>
                                                </div>
                                            </div>
                                            <TechButton
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-team-red"
                                                onClick={() => setSetupTeams(setupTeams.filter(t => t.id !== team.id))}
                                            >
                                                <Trash2 size={16} />
                                            </TechButton>
                                        </div>
                                    ))}
                                </div>
                            </TechCard>
                        </div>

                        {/* Config Sidebar */}
                        <div className="col-span-4 flex flex-col gap-6">
                            <TechCard className="flex-1 flex flex-col gap-6" glow>
                                <div className="flex items-center gap-3 border-b border-primary-surface pb-4">
                                    <Settings className="text-primary-secondary" size={20} />
                                    <h3 className="font-orbitron text-sm text-primary-secondary tracking-widest uppercase">Configuration</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-primary-secondary uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={12} /> Timer Duration (Seconds)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-primary-surface border border-white/10 rounded-lg px-4 py-2 font-orbitron text-primary-accent focus:border-primary-accent outline-none"
                                            value={setupConfig.timerSeconds}
                                            onChange={(e) => setSetupConfig({ ...setupConfig, timerSeconds: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] text-primary-secondary uppercase tracking-widest flex items-center gap-2">
                                            <Trophy size={12} /> Points Per Correct Answer
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-primary-surface border border-white/10 rounded-lg px-4 py-2 font-orbitron text-primary-accent focus:border-primary-accent outline-none"
                                            value={setupConfig.scorePerCorrect}
                                            onChange={(e) => setSetupConfig({ ...setupConfig, scorePerCorrect: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="p-4 bg-primary-accent/5 rounded-lg border border-primary-accent/20">
                                            <div className="text-[10px] text-primary-accent uppercase tracking-widest mb-1">Active Collection</div>
                                            <div className="text-sm font-orbitron text-primary-text">{selectedCollection || 'None Selected'}</div>
                                        </div>
                                        <TechButton
                                            variant="primary"
                                            className="w-full py-6 font-orbitron tracking-tighter text-lg"
                                            disabled={!selectedCollection || setupTeams.length < 2}
                                            onClick={startQuiz}
                                        >
                                            LAUNCH SIMULATION
                                        </TechButton>
                                    </div>
                                </div>
                            </TechCard>
                        </div>
                    </div>
                )}

                {activeTab === 'simulation' && currentState !== 'IDLE' && (
                    <div className="col-span-12 flex flex-col gap-8 h-full min-h-0">
                        {/* Simulation Control Bar */}
                        <TechCard className="p-6 flex justify-between items-center" glow>
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-[10px] text-primary-secondary uppercase tracking-[0.3em] mb-1">State</div>
                                    <div className="text-xl font-orbitron text-primary-accent">{currentState.replace('_', ' ')}</div>
                                </div>
                                <div className="w-px bg-primary-surface" />
                                <div>
                                    <div className="text-[10px] text-primary-secondary uppercase tracking-[0.3em] mb-1">Timer</div>
                                    <div className={`text-xl font-orbitron ${timerRemaining < 10 ? 'text-team-red' : 'text-primary-text'}`}>{timerRemaining}s</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <TechButton variant="secondary" onClick={() => setPaused(!isPaused)}>
                                    {isPaused ? 'RESUME' : 'PAUSE'}
                                </TechButton>
                                <TechButton variant="primary" onClick={() => setCurrentState('IDLE')} className="hover:bg-team-red/20 hover:border-team-red hover:text-team-red">
                                    END SESSION
                                </TechButton>
                            </div>
                        </TechCard>

                        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                            {/* Question Card (Admin Reveal) */}
                            <div className="col-span-8 flex flex-col gap-6">
                                <TechCard className="flex-1 p-8 flex flex-col justify-center items-center text-center gap-8" glow>
                                    {currentState === 'SIMULATION_PREPARATION' ? (
                                        <div className="space-y-6">
                                            <h2 className="text-4xl font-orbitron text-primary-text">READY TO START?</h2>
                                            <TechButton variant="primary" size="lg" className="px-12 py-6 text-xl" onClick={() => setCurrentState('QUESTION_DISPLAY')}>
                                                START ROUND 1
                                            </TechButton>
                                        </div>
                                    ) : currentQuestion ? (
                                        <>
                                            <div className="text-2xl font-inter leading-relaxed">{currentQuestion.question}</div>
                                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                                                {Object.entries(currentQuestion.options).map(([key, value]) => (
                                                    <div key={key} className={`p-4 rounded-lg border flex items-center gap-3 ${currentQuestion.answer === key ? 'bg-team-green/10 border-team-green text-team-green' : 'bg-primary-surface border-white/5 opacity-60'}`}>
                                                        <span className="font-orbitron font-bold">{key}:</span>
                                                        <span className="truncate">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 w-full max-w-md mt-4">
                                                <TechButton variant="primary" className="flex-1 bg-team-green hover:bg-team-green/80 border-team-green" onClick={() => {
                                                    const teamsInStore = useQuizStore.getState().teams
                                                    updateScore(teamsInStore[currentTeamIndex].id!, setupConfig.scorePerCorrect)
                                                    nextTeam()
                                                    useQuizStore.setState({ currentQuestion: null })
                                                }}>
                                                    CORRECT (+{setupConfig.scorePerCorrect})
                                                </TechButton>
                                                <TechButton variant="secondary" className="flex-1 border-team-red text-team-red hover:bg-team-red/10" onClick={() => {
                                                    const teamsInStore = useQuizStore.getState().teams
                                                    updateScore(teamsInStore[currentTeamIndex].id!, -setupConfig.deductionPerWrong)
                                                    nextTeam()
                                                    useQuizStore.setState({ currentQuestion: null })
                                                }}>
                                                    WRONG (-{setupConfig.deductionPerWrong})
                                                </TechButton>
                                            </div>
                                            <div className="flex gap-4 w-full max-w-md mt-2">
                                                <TechButton variant="secondary" className="flex-1" onClick={() => setCurrentState('LEADERBOARD')}>
                                                    SHOW LEADERBOARD
                                                </TechButton>
                                                <TechButton variant="secondary" className="flex-1" onClick={() => setCurrentState('WINNER_FLOW')}>
                                                    FINISH QUIZ
                                                </TechButton>
                                            </div>
                                        </>
                                    ) : currentState === 'LEADERBOARD' ? (
                                        <div className="space-y-6">
                                            <h2 className="text-4xl font-orbitron text-primary-accent">LEADERBOARD ACTIVE</h2>
                                            <TechButton variant="primary" size="lg" onClick={() => setCurrentState('QUESTION_DISPLAY')}>
                                                CONTINUE TO QUESTIONS
                                            </TechButton>
                                        </div>
                                    ) : currentState === 'WINNER_FLOW' ? (
                                        <div className="space-y-6">
                                            <h2 className="text-4xl font-orbitron text-primary-accent uppercase">Victory Revealed</h2>
                                            <TechButton variant="primary" size="lg" onClick={() => setCurrentState('IDLE')}>
                                                CLOSE SESSION
                                            </TechButton>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-orbitron text-primary-secondary uppercase tracking-widest">Awaiting Command</h2>
                                            <TechButton variant="primary" onClick={() => {
                                                const unUsed = currentQuestions.filter(q => !q.used)
                                                if (unUsed.length > 0) {
                                                    const nextQ = unUsed[Math.floor(Math.random() * unUsed.length)]
                                                    const updatedQuestions = currentQuestions.map(q => q.id === nextQ.id ? { ...q, used: true } : q)
                                                    setQuestions(updatedQuestions)
                                                    setCurrentQuestions(updatedQuestions)
                                                    useQuizStore.setState({
                                                        currentQuestion: nextQ,
                                                        timerRemaining: setupConfig.timerSeconds,
                                                        currentState: 'QUESTION_DISPLAY'
                                                    })
                                                }
                                            }}>
                                                PICK RANDOM QUESTION
                                            </TechButton>
                                        </div>
                                    )}
                                </TechCard>
                            </div>

                            {/* Live Scoreboard */}
                            <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
                                <h3 className="font-orbitron text-sm text-primary-secondary tracking-widest uppercase mb-2">Live Standings</h3>
                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {useQuizStore.getState().teams.map((team, index) => (
                                        <div key={team.id} className={`p-4 rounded-xl border flex items-center justify-between ${currentTeamIndex === index ? 'bg-primary-accent/10 border-primary-accent shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-primary-surface border-white/5'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                                                <span className="font-rajdhani text-lg uppercase tracking-widest">{team.name}</span>
                                            </div>
                                            <span className="font-orbitron text-xl text-primary-accent">{team.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showNewCollectionModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                    <TechCard className="w-full max-w-md p-8 space-y-6" glow>
                        <div className="flex justify-between items-center border-b border-primary-surface pb-4">
                            <h3 className="font-orbitron text-primary-accent text-xl">NEW COLLECTION</h3>
                            <button onClick={() => setShowNewCollectionModal(false)}><X className="text-primary-secondary hover:text-white" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-primary-secondary uppercase tracking-widest">Collection Name</label>
                                <input
                                    className="w-full bg-primary-surface border border-white/10 rounded-lg px-4 py-3 font-orbitron text-primary-accent outline-none focus:border-primary-accent"
                                    placeholder="e.g. History Round 1"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <TechButton variant="secondary" className="flex-1" onClick={() => setShowNewCollectionModal(false)}>CANCEL</TechButton>
                                <TechButton variant="primary" className="flex-1" onClick={handleCreateCollection}>CREATE</TechButton>
                            </div>
                        </div>
                    </TechCard>
                </div>
            )}

            {editingQuestion && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                    <TechCard className="w-full max-w-2xl p-8 space-y-6 max-h-full overflow-y-auto custom-scrollbar" glow>
                        <div className="flex justify-between items-center border-b border-primary-surface pb-4">
                            <h3 className="font-orbitron text-primary-accent text-xl">
                                {editingQuestion.id ? 'EDIT QUESTION' : 'NEW QUESTION'}
                            </h3>
                            <button onClick={() => setEditingQuestion(null)}><X className="text-primary-secondary hover:text-white" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-primary-secondary uppercase tracking-widest">Question Text</label>
                                <textarea
                                    className="w-full bg-primary-surface border border-white/10 rounded-lg px-4 py-3 font-inter text-primary-text outline-none focus:border-primary-accent min-h-[100px]"
                                    value={editingQuestion.question}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {(['A', 'B', 'C', 'D'] as const).map(key => (
                                    <div key={key} className="space-y-2">
                                        <label className={`text-[10px] uppercase tracking-widest flex items-center gap-2 ${editingQuestion.answer === key ? 'text-team-green' : 'text-primary-secondary'}`}>
                                            Option {key} {editingQuestion.answer === key && <span className="text-[8px] opacity-70">(CORRECT)</span>}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                className={`flex-1 bg-primary-surface border rounded-lg px-4 py-2 text-sm text-primary-text outline-none transition-colors ${editingQuestion.answer === key ? 'border-team-green/50' : 'border-white/10 focus:border-primary-accent'}`}
                                                value={editingQuestion.options[key]}
                                                onChange={(e) => setEditingQuestion({
                                                    ...editingQuestion,
                                                    options: { ...editingQuestion.options, [key]: e.target.value }
                                                })}
                                            />
                                            <button
                                                onClick={() => setEditingQuestion({ ...editingQuestion, answer: key })}
                                                className={`w-10 rounded-lg border flex items-center justify-center transition-all ${editingQuestion.answer === key ? 'bg-team-green/20 border-team-green text-team-green' : 'bg-primary-surface border-white/10 text-primary-secondary opacity-50 hover:opacity-100'}`}
                                            >
                                                {key}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-primary-surface">
                                <TechButton variant="secondary" className="flex-1" onClick={() => setEditingQuestion(null)}>CANCEL</TechButton>
                                <TechButton variant="primary" className="flex-1" onClick={() => handleSaveQuestion(editingQuestion)}>
                                    <Save size={16} className="mr-2" /> SAVE QUESTION
                                </TechButton>
                            </div>
                        </div>
                    </TechCard>
                </div>
            )}
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg border transition-all font-rajdhani tracking-widest uppercase text-sm ${active
                ? 'bg-primary-accent/10 border-primary-accent text-primary-accent shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                : 'bg-primary-surface border-transparent text-primary-secondary hover:border-primary-secondary/30'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

function CollectionItem({ name, count, active, onClick, onDelete }: { name: string, count: number, active?: boolean, onClick: () => void, onDelete: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${active
                ? 'bg-primary-surface border-primary-accent/50'
                : 'bg-black/20 border-white/5 hover:border-white/10'
                }`}>
            <div className="flex-1 min-w-0">
                <div className={`font-rajdhani text-sm font-semibold tracking-wide truncate ${active ? 'text-primary-accent' : 'text-primary-text'}`}>{name}</div>
                <div className="text-[10px] text-primary-secondary uppercase tracking-widest">{count} Questions</div>
            </div>
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                <TechButton variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-team-red" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 size={12} />
                </TechButton>
            </div>
        </div>
    )
}

function QuestionListItem({ index, text, answer, onEdit, onDelete }: { index: number, text: string, answer: string, onEdit: () => void, onDelete: () => void }) {
    return (
        <div className="p-4 bg-black/20 border border-white/5 rounded-lg flex gap-4 items-center group hover:border-primary-accent/30 transition-all">
            <div className="w-8 h-8 rounded bg-primary-surface border border-white/5 flex items-center justify-center font-orbitron text-xs text-primary-accent shrink-0">
                {index}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-primary-text truncate font-inter">{text}</div>
                <div className="text-[10px] text-primary-secondary uppercase tracking-widest mt-1">
                    Answer: <span className="text-team-green font-bold">{answer}</span>
                </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <TechButton variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={onEdit}><Edit3 size={14} /></TechButton>
                <TechButton variant="secondary" size="sm" className="h-8 w-8 p-0 hover:text-team-red" onClick={onDelete}><Trash2 size={14} /></TechButton>
            </div>
        </div>
    )
}
