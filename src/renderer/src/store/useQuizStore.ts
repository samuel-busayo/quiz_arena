import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type QuizState =
    | 'IDLE'
    | 'STANDBY'
    | 'ARMING'
    | 'PICKER_PHASE'
    | 'QUESTION'
    | 'ANSWER_REVEAL'
    | 'LEADERBOARD'
    | 'ELIMINATION'
    | 'WINNER'
    | 'SESSION_END'

export interface GridNumber {
    value: number
    used: boolean
    questionIndex: number
    teamId?: string
}

export interface QuizResult {
    id: string
    date: string
    setupSnapshot: QuizConfig
    teams: Team[]
    roundsPlayed: number
    takesPerRound: number
    finalScores: Record<string, number>
    eliminationOrder: string[]
    winner: string | null
    questionStats: {
        questionId: string
        teamId: string
        correct: boolean
        timeUsed: number
    }[]
}

export interface Team {
    id: string
    name: string
    color: string
    score: number
    isEliminated: boolean
}

export interface Question {
    id: string
    question: string
    options: {
        A: string
        B: string
        C: string
        D: string
    }
    answer: 'A' | 'B' | 'C' | 'D'
    image?: string
    formula?: string
    used: boolean
}

export interface QuizConfig {
    eventName?: string
    rounds: number
    takesPerRound: number
    timerSeconds: number
    extraTimerSeconds: number
    scorePerCorrect: number
    deductionPerWrong: number
    showLeaderboardAfterRound: boolean
    mode: 'RANDOM' | 'PICK_NUMBER'
    collectionName?: string
}

export interface SystemSettings {
    theme: 'dark' | 'light' | 'glossy'
    volume: number
    sfxEnabled: boolean
    particleDensity: 'low' | 'balanced' | 'high'
}

interface QuizStore {
    // State
    currentState: QuizState
    uiScreen: 'COMMAND_CENTER' | 'QUESTION_BANK' | 'QUIZ_SETUP' | 'SIMULATION_CONSOLE' | 'HELP_ABOUT' | 'SETTINGS' | 'RESULTS_HISTORY'
    teams: Team[]
    config: QuizConfig | null
    questions: Question[]
    currentRound: number
    currentTake: number
    currentTeamId: string | null
    currentQuestion: Question | null
    timerRemaining: number
    isPaused: boolean
    questionQueue: Question[]
    systemSettings: SystemSettings

    // Pick-A-Number State
    gridColumns: number
    gridNumbers: GridNumber[]
    currentPickerTeamId: string | null
    selectionCursor: number

    // Analytics State
    results: QuizResult[]
    currentStats: QuizResult['questionStats']

    // Helpers
    initialize: (view: 'admin' | 'projector') => void
    syncState: () => void

    // Actions
    setCurrentState: (state: QuizState) => void
    setUiScreen: (screen: 'COMMAND_CENTER' | 'QUESTION_BANK' | 'QUIZ_SETUP' | 'SIMULATION_CONSOLE' | 'HELP_ABOUT' | 'SETTINGS' | 'RESULTS_HISTORY') => void
    setTeams: (teams: Team[]) => void
    setConfig: (config: QuizConfig) => void
    setQuestions: (questions: Question[]) => void
    nextRound: () => void
    nextTake: () => void
    nextTeam: () => void
    updateScore: (teamId: string, delta: number) => void
    eliminateTeam: (teamId: string) => void
    resetQuiz: () => void
    tickTimer: () => void
    setPaused: (paused: boolean) => void
    updateSystemSettings: (settings: Partial<SystemSettings>) => void

    // Pick-A-Number Actions
    setGrid: (cols: number, numbers: GridNumber[]) => void
    setSelectionCursor: (index: number) => void
    confirmPick: (index: number, teamId: string) => void

    // Analytics Actions
    addQuestionStat: (stat: QuizResult['questionStats'][0]) => void
    saveResult: (result: QuizResult) => void
}

let isProjectorUpdate = false

export const useQuizStore = create<QuizStore>()(
    persist(
        (set, get) => ({
            currentState: 'IDLE',
            uiScreen: 'COMMAND_CENTER',
            teams: [],
            config: null,
            questions: [],
            currentRound: 1,
            currentTake: 1,
            currentTeamId: null,
            currentQuestion: null,
            timerRemaining: 0,
            isPaused: false,
            questionQueue: [],
            systemSettings: {
                theme: 'dark',
                volume: 50,
                sfxEnabled: true,
                particleDensity: 'balanced'
            },

            // Pick-A-Number Initial State
            gridColumns: 0,
            gridNumbers: [],
            currentPickerTeamId: null,
            selectionCursor: 0,

            // Analytics Initial State
            results: [],
            currentStats: [],

            initialize: (view) => {
                if (view === 'projector') {
                    window.api.onQuizStateUpdate((newState: any) => {
                        isProjectorUpdate = true
                        set(newState)
                        isProjectorUpdate = false
                    })
                }

                // Initial broadcast if admin
                if (view === 'admin') {
                    get().syncState()
                }
            },

            syncState: () => {
                if (isProjectorUpdate) return
                const state = get()
                window.api.updateQuizState({
                    currentState: state.currentState,
                    teams: state.teams,
                    config: state.config,
                    questions: state.questions,
                    currentRound: state.currentRound,
                    currentTake: state.currentTake,
                    currentTeamId: state.currentTeamId,
                    currentQuestion: state.currentQuestion,
                    timerRemaining: state.timerRemaining,
                    isPaused: state.isPaused,
                    questionQueue: state.questionQueue,
                    systemSettings: state.systemSettings,
                    gridColumns: state.gridColumns,
                    gridNumbers: state.gridNumbers,
                    currentPickerTeamId: state.currentPickerTeamId,
                    selectionCursor: state.selectionCursor,
                })
            },

            setCurrentState: (state) => {
                set({ currentState: state })
                get().syncState()
            },

            updateSystemSettings: (newSettings) => {
                set((state) => ({
                    systemSettings: { ...state.systemSettings, ...newSettings }
                }))
                get().syncState()
            },

            setUiScreen: (screen) => {
                set({ uiScreen: screen })
            },

            setTeams: (teams) => {
                set({ teams })
                get().syncState()
            },

            setConfig: (config) => {
                set({ config })
                get().syncState()
            },

            setQuestions: (questions) => {
                set({ questions })
                get().syncState()
            },

            nextRound: () => {
                set((state) => ({ currentRound: state.currentRound + 1 }))
                get().syncState()
            },

            nextTake: () => {
                set((state) => ({ currentTake: state.currentTake + 1 }))
                get().syncState()
            },

            nextTeam: () => {
                set((state) => {
                    const activeTeams = state.teams.filter(t => !t.isEliminated)
                    if (activeTeams.length === 0) return { currentTeamId: null }

                    const currentIdx = activeTeams.findIndex(t => t.id === state.currentTeamId)
                    const nextIdx = (currentIdx + 1) % activeTeams.length
                    return { currentTeamId: activeTeams[nextIdx].id }
                })
                get().syncState()
            },

            updateScore: (teamId, delta) => {
                set((state) => ({
                    teams: state.teams.map(t => t.id === teamId ? { ...t, score: t.score + delta } : t)
                }))
                get().syncState()
            },

            eliminateTeam: (teamId) => {
                set((state) => ({
                    teams: state.teams.map(t => t.id === teamId ? { ...t, isEliminated: true } : t)
                }))
                get().syncState()
            },

            resetQuiz: () => {
                set({
                    currentState: 'IDLE',
                    teams: [],
                    config: null,
                    questions: [],
                    currentRound: 1,
                    currentTake: 1,
                    currentTeamId: null,
                    currentQuestion: null,
                    timerRemaining: 0,
                    isPaused: false,
                    questionQueue: [],
                    gridNumbers: [],
                    currentPickerTeamId: null,
                    selectionCursor: 0,
                    currentStats: [],
                })
                get().syncState()
            },

            tickTimer: () => {
                set((state) => ({ timerRemaining: Math.max(0, state.timerRemaining - 1) }))
                get().syncState()
            },

            setPaused: (paused) => {
                set({ isPaused: paused })
                get().syncState()
            },

            // Pick-A-Number Actions
            setGrid: (cols, numbers) => {
                set({ gridColumns: cols, gridNumbers: numbers })
                get().syncState()
            },

            setSelectionCursor: (index) => {
                set({ selectionCursor: index })
                get().syncState()
            },

            confirmPick: (index, teamId) => {
                set((state) => ({
                    gridNumbers: state.gridNumbers.map((n, i) =>
                        i === index ? { ...n, used: true, teamId } : n
                    )
                }))
                get().syncState()
            },

            // Analytics Actions
            addQuestionStat: (stat) => {
                set((state) => ({
                    currentStats: [...state.currentStats, stat]
                }))
            },

            saveResult: (result) => {
                set((state) => ({
                    results: [result, ...state.results]
                }))
                window.api.saveQuizResult(result)
            }
        }),
        {
            name: 'techverse-quiz-session',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentState: state.currentState,
                uiScreen: state.uiScreen,
                teams: state.teams,
                config: state.config,
                questions: state.questions,
                currentRound: state.currentRound,
                currentTake: state.currentTake,
                currentTeamId: state.currentTeamId,
                currentQuestion: state.currentQuestion,
                questionQueue: state.questionQueue,
                systemSettings: state.systemSettings
            })
        }
    )
)
