import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type QuizState =
    | 'IDLE'
    | 'SETUP_LOADED'
    | 'SIMULATION_PREPARATION'
    | 'ROUND_START'
    | 'TEAM_READY'
    | 'QUESTION_DISPLAY'
    | 'NORMAL_TIMER_RUNNING'
    | 'EXTRA_TIMER'
    | 'ANSWER_SELECTED'
    | 'RESULT_ANIMATION'
    | 'SCORE_UPDATE'
    | 'NEXT_TEAM'
    | 'ROUND_END'
    | 'LEADERBOARD'
    | 'ELIMINATION'
    | 'NEXT_ROUND'
    | 'WINNER_FLOW'
    | 'SESSION_END'

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
    rounds: number
    takesPerRound: number
    timerSeconds: number
    extraTimerSeconds: number
    scorePerCorrect: number
    deductionPerWrong: number
    showLeaderboardAfterRound: boolean
    mode: 'RANDOM' | 'PICK_NUMBER'
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
    uiScreen: 'COMMAND_CENTER' | 'QUESTION_BANK' | 'QUIZ_SETUP' | 'SIMULATION_CONSOLE' | 'HELP_ABOUT' | 'SETTINGS'
    teams: Team[]
    config: QuizConfig | null
    questions: Question[]
    currentRound: number
    currentTake: number
    currentTeamIndex: number
    currentQuestion: Question | null
    timerRemaining: number
    isPaused: boolean
    systemSettings: SystemSettings

    // Helpers
    initialize: (view: 'admin' | 'projector') => void
    syncState: () => void

    // Actions
    setCurrentState: (state: QuizState) => void
    setUiScreen: (screen: 'COMMAND_CENTER' | 'QUESTION_BANK' | 'QUIZ_SETUP' | 'SIMULATION_CONSOLE' | 'HELP_ABOUT' | 'SETTINGS') => void
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
            currentTeamIndex: 0,
            currentQuestion: null,
            timerRemaining: 0,
            isPaused: false,
            systemSettings: {
                theme: 'dark',
                volume: 50,
                sfxEnabled: true,
                particleDensity: 'balanced'
            },

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
                    currentTeamIndex: state.currentTeamIndex,
                    currentQuestion: state.currentQuestion,
                    timerRemaining: state.timerRemaining,
                    isPaused: state.isPaused,
                    systemSettings: state.systemSettings
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

            setUiScreen: (screen: 'COMMAND_CENTER' | 'QUESTION_BANK' | 'QUIZ_SETUP' | 'SIMULATION_CONSOLE' | 'HELP_ABOUT' | 'SETTINGS') => {
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
                    if (activeTeams.length === 0) return { currentTeamIndex: 0 }
                    const nextIdx = (state.currentTeamIndex + 1) % activeTeams.length
                    return { currentTeamIndex: nextIdx }
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
                    currentTeamIndex: 0,
                    currentQuestion: null,
                    timerRemaining: 0,
                    isPaused: false
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
                currentTeamIndex: state.currentTeamIndex,
                currentQuestion: state.currentQuestion,
                systemSettings: state.systemSettings
            })
        }
    )
)
