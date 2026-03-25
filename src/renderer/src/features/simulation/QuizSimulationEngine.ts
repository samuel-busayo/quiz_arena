import { useQuizStore, QuizState, QuizResult } from '../../store/useQuizStore'
import { audioEngine } from './AudioEngine'

class QuizSimulationEngine {
    private timerId: number | null = null
    private lastTick: number = 0

    // Core Actions
    startSimulation() {
        const { questions, config, teams } = useQuizStore.getState()
        if (!config || teams.length === 0) return

        // 1. Lock/Initialize teams
        const initialTeams = teams.map(t => ({ ...t, score: 0, isEliminated: false }))
        useQuizStore.setState({ teams: initialTeams })

        // 2. Initial State Setup
        useQuizStore.setState({
            currentRound: 1,
            currentTake: 1,
            currentTeamId: initialTeams[0].id
        })

        // 3. Grid / Queue Generation
        if (config.mode === 'PICK_NUMBER') {
            const count = questions.length
            let cols = 4
            if (count <= 12) cols = 4
            else if (count <= 20) cols = 5
            else if (count <= 30) cols = 6
            else cols = 7

            const gridNumbers = questions.map((_, i) => ({
                value: i + 1,
                used: false,
                questionIndex: i
            })).sort(() => Math.random() - 0.5)

            useQuizStore.setState({
                gridColumns: cols,
                gridNumbers: gridNumbers,
                currentPickerTeamId: initialTeams[0].id,
                selectionCursor: 0
            })

            this.transitionTo('PICKER_PHASE')
        } else {
            const queue = [...questions].sort(() => Math.random() - 0.5)
            useQuizStore.setState({ questionQueue: queue })
            this.transitionTo('QUESTION')
        }
    }

    transitionTo(phase: QuizState) {
        const { setCurrentState } = useQuizStore.getState()
        setCurrentState(phase)

        // Audio Triggers
        switch (phase) {
            case 'PICKER_PHASE':
                audioEngine.playBgm('leaderboard') // Reuse leaderboard or add picker bgm
                break
            case 'QUESTION':
                audioEngine.playBgm('countdown', false)
                this.startTimer()
                break
            case 'ANSWER_REVEAL':
                this.stopTimer()
                break
            case 'LEADERBOARD':
                audioEngine.playBgm('leaderboard')
                break
            case 'ELIMINATION':
                audioEngine.playBgm('elimination')
                break
            case 'WINNER':
                audioEngine.playBgm('winner')
                this.handleQuizEnd()
                break
            case 'IDLE':
                audioEngine.stopBgm()
                break
        }
    }

    // Pick-A-Number Logic
    handlePick(index: number) {
        const { gridNumbers, questions, currentTeamId, confirmPick } = useQuizStore.getState()
        const numObj = gridNumbers[index]
        if (!numObj || numObj.used || !currentTeamId) return

        confirmPick(index, currentTeamId)

        // Find the actual question (mapped by original index or value)
        const question = questions[numObj.value - 1]
        useQuizStore.setState({ currentQuestion: question })

        audioEngine.playSfx('correct') // Lock sound

        // Short delay for animation before question starts
        setTimeout(() => {
            this.transitionTo('QUESTION')
        }, 800)
    }

    // Timer Logic using requestAnimationFrame
    private startTimer() {
        this.stopTimer()
        const { config } = useQuizStore.getState()
        if (!config) return

        useQuizStore.setState({ timerRemaining: config.timerSeconds })
        this.lastTick = performance.now()

        const tick = (now: number) => {
            const { isPaused, timerRemaining, currentState } = useQuizStore.getState()

            if (currentState !== 'QUESTION') {
                this.stopTimer()
                return
            }

            if (!isPaused) {
                const delta = now - this.lastTick
                if (delta >= 1000) {
                    const nextValue = Math.max(0, timerRemaining - 1)
                    useQuizStore.setState({ timerRemaining: nextValue })
                    this.lastTick = now

                    if (nextValue === 0) {
                        this.handleTimerEnd()
                        return
                    }
                }
            } else {
                this.lastTick = now // Reset tick anchor if paused
            }

            this.timerId = requestAnimationFrame(tick)
        }

        this.timerId = requestAnimationFrame(tick)
    }

    private stopTimer() {
        if (this.timerId) {
            cancelAnimationFrame(this.timerId)
            this.timerId = null
        }
    }

    private handleTimerEnd() {
        audioEngine.playSfx('wrong')
        this.transitionTo('ANSWER_REVEAL')
    }

    // Flow Logic
    revealAnswer(isCorrect: boolean) {
        const { currentTeamId, config, updateScore, timerRemaining, currentQuestion, addQuestionStat } = useQuizStore.getState()
        if (isCorrect && currentTeamId && config) {
            audioEngine.playSfx('correct')
            updateScore(currentTeamId, config.scorePerCorrect)
        } else if (!isCorrect && currentTeamId && config) {
            audioEngine.playSfx('wrong')
            updateScore(currentTeamId, -config.deductionPerWrong)
        }

        // Add Stat
        if (currentQuestion && currentTeamId && config) {
            addQuestionStat({
                questionId: currentQuestion.id,
                teamId: currentTeamId,
                correct: isCorrect,
                timeUsed: config.timerSeconds - timerRemaining
            })
        }

        this.transitionTo('ANSWER_REVEAL')

        // Auto advance after short delay
        setTimeout(() => {
            this.advanceSimulation()
        }, 3500)
    }

    advanceSimulation() {
        const { currentTake, currentRound, config, teams, nextTake, nextTeam, currentState } = useQuizStore.getState()
        if (!config) return

        const activeTeams = teams.filter(t => !t.isEliminated)

        // Check if round is complete
        if (currentTake >= config.takesPerRound * activeTeams.length) {
            if (config.showLeaderboardAfterRound) {
                this.transitionTo('LEADERBOARD')
            } else {
                this.startNextRound()
            }
        } else {
            nextTake()
            nextTeam()

            if (config.mode === 'PICK_NUMBER') {
                this.transitionTo('PICKER_PHASE')
            } else {
                // Auto pop from queue for Random Mode
                const { questionQueue } = useQuizStore.getState()
                const nextQ = questionQueue[currentTake] // Simply index for now or pop
                useQuizStore.setState({ currentQuestion: nextQ })
                this.transitionTo('QUESTION')
            }
        }
    }

    startNextRound() {
        const { currentRound, config, teams } = useQuizStore.getState()
        if (!config) return

        if (currentRound >= config.rounds) {
            this.transitionTo('WINNER')
        } else {
            const activeTeams = teams.filter(t => !t.isEliminated)
            useQuizStore.setState({
                currentRound: currentRound + 1,
                currentTake: 1,
                currentTeamId: activeTeams.length > 0 ? activeTeams[0].id : null
            })

            if (config.mode === 'PICK_NUMBER') {
                this.transitionTo('PICKER_PHASE')
            } else {
                this.transitionTo('QUESTION')
            }
        }
    }

    private handleQuizEnd() {
        const { config, teams, currentRound, currentTake, currentStats, saveResult } = useQuizStore.getState()
        if (!config) return

        const finalScores: Record<string, number> = {}
        teams.forEach(t => { finalScores[t.id] = t.score })

        const winner = [...teams].sort((a, b) => b.score - a.score)[0]

        const result: QuizResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            setupSnapshot: config,
            teams,
            roundsPlayed: currentRound,
            takesPerRound: config.takesPerRound,
            finalScores,
            eliminationOrder: [], // Track this later if needed
            winner: winner?.id || null,
            questionStats: currentStats
        }

        saveResult(result)
    }
}

export const simulationEngine = new QuizSimulationEngine()
