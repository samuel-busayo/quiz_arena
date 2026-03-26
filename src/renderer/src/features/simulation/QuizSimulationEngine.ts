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
            currentTeamId: initialTeams[0].id,
            revealStatus: null,
            selectedOption: null
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
        } else {
            const queue = [...questions].sort(() => Math.random() - 0.5)
            useQuizStore.setState({ questionQueue: queue })
        }

        // 4. Trigger Intro Sequence (Arming)
        audioEngine.stopBgm()
        this.transitionTo('ARMING')

        // Automatically proceed to Round Intro after 3s Arming
        setTimeout(() => {
            this.transitionTo('ROUND_INTRO')
            // Play ROUND_INTRO for 1.8s then start question logic
            setTimeout(() => {
                const state = useQuizStore.getState()
                if (state.config?.mode === 'PICK_NUMBER') {
                    this.transitionTo('PICKER_PHASE')
                } else {
                    const { questionQueue } = state
                    if (questionQueue.length > 0) {
                        useQuizStore.setState({ currentQuestion: questionQueue[0] })
                    }
                    this.transitionTo('QUESTION')
                }
            }, 1800)
        }, 3000)
    }

    transitionTo(phase: QuizState) {
        const { setCurrentState } = useQuizStore.getState()
        setCurrentState(phase)

        // Audio Triggers
        switch (phase) {
            case 'ROUND_INTRO':
                audioEngine.playSfx('bassHit')
                break
            case 'PICKER_PHASE':
                audioEngine.playBgm('leaderboard')
                break
            case 'QUESTION':
                useQuizStore.setState({ revealStatus: null, selectedOption: null })
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
                // elimination SFX handled in advanceSimulation
                break
            case 'WINNER':
                audioEngine.playBgm('winner')
                this.handleQuizEnd()
                break
            case 'IDLE':
                audioEngine.stopBgm()
                break
            case 'STANDBY':
                audioEngine.playBgm('standbyAmbient')
                break
        }
    }

    // Pick-A-Number Logic
    handlePick(index: number) {
        const { gridNumbers, questions, currentTeamId, confirmPick } = useQuizStore.getState()
        const numObj = gridNumbers[index]
        if (!numObj || numObj.used || !currentTeamId) return

        confirmPick(index, currentTeamId)

        // Find the actual question
        const question = questions[numObj.questionIndex]
        useQuizStore.setState({ currentQuestion: question, revealStatus: null, selectedOption: null })

        audioEngine.playSfx('correct')

        // Short delay for animation before question starts
        setTimeout(() => {
            this.transitionTo('QUESTION')
        }, 800)
    }

    // Timer Logic
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
                this.lastTick = now
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

    pauseTimer() {
        useQuizStore.setState({ isPaused: true })
        // Stop BGM or lower volume? User didn't specify, but pausing countdown BGM is good
        audioEngine.stopBgm()
    }

    resumeTimer() {
        useQuizStore.setState({ isPaused: false })
        audioEngine.playBgm('countdown', false)
    }

    private handleTimerEnd() {
        // Auto submission of "wrong" on timeout
        const { currentTeamId, config, updateScore, currentQuestion, addQuestionStat } = useQuizStore.getState()

        if (currentTeamId && config) {
            audioEngine.playSfx('wrong')
            updateScore(currentTeamId, -config.deductionPerWrong)
        }

        if (currentQuestion && currentTeamId && config) {
            addQuestionStat({
                questionId: currentQuestion.id,
                teamId: currentTeamId,
                correct: false,
                timeUsed: config.timerSeconds
            })
        }

        useQuizStore.setState({ revealStatus: 'timeout', selectedOption: null })
        this.transitionTo('ANSWER_REVEAL')

        // Auto advance after wrong reveal duration ~2.2s
        setTimeout(() => {
            this.advanceSimulation()
        }, 2200)
    }

    // --- CORE SELECTION FLOW ---

    selectAnswer(selection: 'A' | 'B' | 'C' | 'D') {
        const { currentState, isConfirming, isLocked } = useQuizStore.getState()
        if (currentState !== 'QUESTION' || isConfirming || isLocked) return

        this.pauseTimer()
        useQuizStore.setState({
            selectedOption: selection,
            isConfirming: true
        })
        audioEngine.playSfx('click')
    }

    cancelSelection() {
        const { isConfirming, isLocked } = useQuizStore.getState()
        if (!isConfirming || isLocked) return

        useQuizStore.setState({
            isConfirming: false,
            selectedOption: null
        })
        this.resumeTimer()
    }

    async confirmAnswer() {
        const { isConfirming, isLocked, selectedOption, currentQuestion } = useQuizStore.getState()
        if (!isConfirming || isLocked || !selectedOption || !currentQuestion) return

        useQuizStore.setState({ isLocked: true })

        // 1s SUSPENSE BEAT
        audioEngine.playSfx('bassHit')
        await new Promise(resolve => setTimeout(resolve, 1000))

        this.revealAnswer(selectedOption)
    }

    private revealAnswer(selection: 'A' | 'B' | 'C' | 'D' | null) {
        const { currentTeamId, config, updateScore, timerRemaining, currentQuestion, addQuestionStat } = useQuizStore.getState()
        if (!currentQuestion || !currentTeamId || !config) return

        this.stopTimer()

        const isCorrect = selection === currentQuestion.answer
        const revealStatus = selection === null ? 'timeout' : isCorrect ? 'correct' : 'wrong'

        useQuizStore.setState({
            currentState: 'ANSWER_REVEAL',
            revealStatus,
            selectedOption: selection,
            isConfirming: false, // Reset confirmation state
            isLocked: false     // Reset lock state
        })

        if (revealStatus === 'timeout') {
            audioEngine.playSfx('wrong')
            updateScore(currentTeamId, -config.deductionPerWrong)
        } else if (isCorrect) {
            audioEngine.playSfx('correct')
            updateScore(currentTeamId, config.scorePerCorrect)
        } else {
            audioEngine.playSfx('wrong')
            updateScore(currentTeamId, -config.deductionPerWrong)
        }

        // Add Stat
        addQuestionStat({
            questionId: currentQuestion.id,
            teamId: currentTeamId,
            correct: isCorrect && selection !== null,
            timeUsed: config.timerSeconds - timerRemaining
        })

        // Auto advance based on animation duration
        const delay = isCorrect ? 2500 : 2200
        setTimeout(() => {
            this.advanceSimulation()
        }, delay)
    }

    advanceSimulation() {
        const { currentTake, config, teams, nextTake, nextTeam } = useQuizStore.getState()
        if (!config) return

        const activeTeams = teams.filter(t => !t.isEliminated)

        // Check if round is complete
        if (currentTake >= config.takesPerRound * activeTeams.length) {
            this.eliminateLowestTeam()
        } else {
            nextTake()
            nextTeam()

            if (config.mode === 'PICK_NUMBER') {
                this.transitionTo('PICKER_PHASE')
            } else {
                // Auto pop from queue for Random Mode
                const { questionQueue } = useQuizStore.getState()
                const nextQ = questionQueue[currentTake] // currentTake is 1-indexed for logic, but queue is 0-indexed. Actually wait... nextTake() was just called.
                // It's safer to pop
                const nextQSafe = questionQueue[currentTake] || questionQueue[0]
                useQuizStore.setState({ currentQuestion: nextQSafe })
                this.transitionTo('QUESTION')
            }
        }
    }

    private eliminateLowestTeam() {
        const { teams, config } = useQuizStore.getState()
        const activeTeams = teams.filter(t => !t.isEliminated)

        if (activeTeams.length <= 1) {
            // Already winner status
            this.transitionTo('WINNER')
            return
        }

        // Find lowest
        const lowest = [...activeTeams].sort((a, b) => a.score - b.score)[0]

        // Mark eliminated
        useQuizStore.getState().eliminateTeam(lowest.id)

        // Set state to ELIMINATION for UX
        useQuizStore.setState({ currentTeamId: lowest.id }) // Focus on them for UI
        audioEngine.playSfx('bassHit') // low bass drop
        this.transitionTo('ELIMINATION')

        // Elimination sequence is 3s. After that, either go to leaderboard or next round
        setTimeout(() => {
            if (config?.showLeaderboardAfterRound) {
                this.transitionTo('LEADERBOARD')
            } else {
                this.startNextRound()
            }
        }, 3000)
    }

    startNextRound() {
        const { currentRound, config, teams } = useQuizStore.getState()
        if (!config) return

        const activeTeams = teams.filter(t => !t.isEliminated)

        if (currentRound >= config.rounds || activeTeams.length <= 1) {
            this.transitionTo('WINNER')
        } else {
            useQuizStore.setState({
                currentRound: currentRound + 1,
                currentTake: 1,
                currentTeamId: activeTeams[0].id
            })

            this.transitionTo('ROUND_INTRO')
            setTimeout(() => {
                if (config.mode === 'PICK_NUMBER') {
                    this.transitionTo('PICKER_PHASE')
                } else {
                    const { questionQueue } = useQuizStore.getState()
                    useQuizStore.setState({ currentQuestion: questionQueue[0] }) // Need proper shifting in queue, but simplified
                    this.transitionTo('QUESTION')
                }
            }, 1800)
        }
    }

    private handleQuizEnd() {
        const { config, teams, currentRound, currentStats, saveResult } = useQuizStore.getState()
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
            eliminationOrder: teams.filter(t => t.isEliminated).map(t => t.id), // Basic approximation
            winner: winner?.id || null,
            questionStats: currentStats
        }

        saveResult(result)
    }

    initializeSimulation() {
        useQuizStore.getState().setCurrentState('STANDBY')
        window.api.openProjector()
        audioEngine.playBgm('standbyAmbient', true)
    }
}

export const simulationEngine = new QuizSimulationEngine()
